// Backend integration tests (run with `npm test`, uses Node's built-in test runner).
//
// Starts the real server.js in a child process with its own temporary data
// directory, plus a tiny in-process SMTP server so the e-mail paths
// (nodemailer) are exercised end to end without real credentials.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const dataRoot = mkdtempSync(path.join(tmpdir(), 'zenith-backend-test-'));

// ---- minimal SMTP server that records received messages -------------------
const received = [];
const smtpServer = net.createServer((socket) => {
  let inData = false;
  let current = { rcpt: [], data: '' };
  let buffer = '';
  socket.write('220 test-smtp ready\r\n');
  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    let idx;
    while ((idx = buffer.indexOf('\r\n')) !== -1) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      if (inData) {
        if (line === '.') {
          inData = false;
          received.push(current);
          current = { rcpt: [], data: '' };
          socket.write('250 OK queued\r\n');
        } else {
          current.data += line + '\n';
        }
        continue;
      }
      const cmd = line.slice(0, 4).toUpperCase();
      if (cmd === 'EHLO') socket.write('250-test-smtp\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
      else if (cmd === 'HELO') socket.write('250 test-smtp\r\n');
      else if (cmd === 'AUTH') socket.write('235 Authentication successful\r\n');
      else if (cmd === 'MAIL') { current.from = line; socket.write('250 OK\r\n'); }
      else if (cmd === 'RCPT') { current.rcpt.push(line); socket.write('250 OK\r\n'); }
      else if (cmd === 'DATA') { inData = true; socket.write('354 End data with <CR><LF>.<CR><LF>\r\n'); }
      else if (cmd === 'RSET' || cmd === 'NOOP') socket.write('250 OK\r\n');
      else if (cmd === 'QUIT') { socket.write('221 Bye\r\n'); socket.end(); }
      else socket.write('502 Command not implemented\r\n');
    }
  });
  socket.on('error', () => {});
});

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
}

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

let child;
let baseUrl;
let smtpPort;
let output = '';

async function api(method, route, body) {
  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

before(async () => {
  smtpPort = await listen(smtpServer);
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, [path.join(backendDir, 'server.js')], {
    cwd: dataRoot, // database.js keeps its SQLite file under <cwd>/data
    env: {
      ...process.env,
      PORT: String(port),
      // Not 'test': we want the real e-mail code paths, against the fake SMTP server
      NODE_ENV: 'development',
      SMTP_HOST: '',
      SMTP_USER: '',
      SMTP_PASS: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => { output += d; });
  child.stderr.on('data', (d) => { output += d; });

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) break;
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`backend did not start:\n${output}`);
});

after(async () => {
  if (child && child.exitCode === null) {
    const exited = new Promise((r) => child.once('exit', r));
    child.kill('SIGTERM');
    await exited;
  }
  smtpServer.close();
  rmSync(dataRoot, { recursive: true, force: true });
});

const now = Date.now();
const task = (overrides = {}) => ({
  id: 't1',
  title: 'Write report',
  completed: false,
  projectId: 'inbox',
  createdAt: now,
  dueDate: now + 86_400_000,
  priority: 'high',
  order: 0,
  reminderEnabled: true,
  reminderTime: now + 3_600_000,
  userEmail: 'user@example.com', // the frontend always sends one; the DB column is NOT NULL
  ...overrides,
});

test('health check responds', async () => {
  const res = await api('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'OK');
});

test('unknown routes return a JSON 404', async () => {
  const res = await api('GET', '/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

test('projects can be created, renamed, listed and deleted', async () => {
  let res = await api('POST', '/api/projects', { id: 'p1', name: 'Work', createdAt: now, icon: 'briefcase' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { success: true, data: { id: 'p1' } });

  res = await api('POST', '/api/projects', { name: 'Missing id' });
  assert.equal(res.status, 400);

  res = await api('PUT', '/api/projects/p1', { name: 'Work stuff', icon: 'briefcase' });
  assert.equal(res.status, 200);

  res = await api('GET', '/api/projects');
  assert.equal(res.status, 200);
  const p1 = res.body.data.find((p) => p.id === 'p1');
  assert.ok(p1, 'created project is listed');
  assert.equal(p1.name, 'Work stuff');

  res = await api('DELETE', '/api/projects/p1');
  assert.equal(res.status, 200);
  res = await api('GET', '/api/projects');
  assert.equal(res.body.data.some((p) => p.id === 'p1'), false);
});

test('task sync validates input and stores tasks with their reminders', async () => {
  let res = await api('POST', '/api/tasks/sync', { tasks: 'nope' });
  assert.equal(res.status, 400);

  res = await api('POST', '/api/tasks/sync', { tasks: [{ id: 'bad' }] });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Invalid task/);

  res = await api('POST', '/api/tasks/sync', {
    tasks: [task(), task({ id: 't2', title: 'No reminder', reminderEnabled: false, reminderTime: null, priority: null })],
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.success, true);

  res = await api('GET', '/api/tasks');
  assert.equal(res.status, 200);
  const ids = res.body.data.map((t) => t.id).sort();
  assert.deepEqual(ids, ['t1', 't2']);
  const t1 = res.body.data.find((t) => t.id === 't1');
  assert.equal(t1.reminderEnabled, true);
  assert.equal(t1.completed, false);

  res = await api('GET', '/api/reminders');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((r) => r.taskId === 't1'), 'reminder stored for t1');
});

test('SMTP settings are validated', async () => {
  const res = await api('POST', '/api/smtp/settings', { host: 'x' });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('SMTP settings can be saved and the connection verified', async () => {
  const res = await api('POST', '/api/smtp/settings', {
    host: '127.0.0.1',
    port: smtpPort,
    user: 'sender@example.com',
    pass: 'secret',
    fromEmail: 'sender@example.com',
    toEmail: 'owner@example.com',
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.data.configured, true, JSON.stringify(res.body.data.testResult));

  const settings = await api('GET', '/api/smtp/settings');
  assert.equal(settings.status, 200);
  assert.equal(JSON.stringify(settings.body).includes('secret'), false, 'password is not returned');
});

test('a test email is delivered through SMTP', async () => {
  const before = received.length;
  const res = await api('POST', '/api/smtp/test-email', {});
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(received.length, before + 1);
  const mail = received.at(-1);
  assert.ok(mail.rcpt.some((r) => r.includes('owner@example.com')));
  assert.match(mail.data, /Subject: Test Email - Todo Reminder/);
});

test('a reminder can be sent manually for a task', async () => {
  const before = received.length;
  const res = await api('POST', '/api/reminders/send/t1');
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.success, true);
  assert.equal(received.length, before + 1);
  assert.match(received.at(-1).data, /Subject: Reminder: Write report/);

  const missing = await api('POST', '/api/reminders/send/nope');
  assert.equal(missing.status, 404);

  const disabled = await api('POST', '/api/reminders/send/t2');
  assert.equal(disabled.status, 400);
});

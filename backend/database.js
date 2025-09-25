import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'todo.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create projects table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at INTEGER NOT NULL
          )
        `);

        // Create tasks table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            project_id TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            due_date INTEGER,
            priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
            order_index INTEGER NOT NULL,
            reminder_enabled INTEGER NOT NULL DEFAULT 0,
            reminder_time INTEGER,
            user_email TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects (id)
          )
        `);

        // Create reminders table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            user_email TEXT NOT NULL,
            reminder_time INTEGER NOT NULL,
            sent INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (task_id) REFERENCES tasks (id)
          )
        `);

        // Create SMTP settings table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS smtp_settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            host TEXT,
            port INTEGER,
            user TEXT,
            pass TEXT,
            CONSTRAINT single_row CHECK (id = 1)
          )
        `);

        // Insert default projects if they don't exist
        this.db.run(`
          INSERT OR IGNORE INTO projects (id, name, created_at) 
          VALUES ('inbox-default-id', 'Inbox', ?)
        `, [Date.now()]);

        this.db.run(`
          INSERT OR IGNORE INTO projects (id, name, created_at) 
          VALUES ('work-default-id', 'Work', ?)
        `, [Date.now()]);

        console.log('Database initialized successfully');
        resolve();
      });
    });
  }

  // Project operations
  async getProjects() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM projects ORDER BY created_at', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          id: row.id,
          name: row.name,
          createdAt: row.created_at
        })));
      });
    });
  }

  async addProject(project) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)',
        [project.id, project.name, project.createdAt],
        function(err) {
          if (err) reject(err);
          else resolve({ id: project.id });
        }
      );
    });
  }

  async updateProject(id, name) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE projects SET name = ? WHERE id = ?',
        [name, id],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  async deleteProject(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  // Task operations
  async getTasks() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM tasks ORDER BY order_index', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          id: row.id,
          title: row.title,
          completed: Boolean(row.completed),
          projectId: row.project_id,
          createdAt: row.created_at,
          dueDate: row.due_date,
          priority: row.priority,
          order: row.order_index,
          reminderEnabled: Boolean(row.reminder_enabled),
          reminderTime: row.reminder_time,
          userEmail: row.user_email
        })));
      });
    });
  }

  async getTasksByProject(projectId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM tasks WHERE project_id = ? ORDER BY order_index',
        [projectId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => ({
            id: row.id,
            title: row.title,
            completed: Boolean(row.completed),
            projectId: row.project_id,
            createdAt: row.created_at,
            dueDate: row.due_date,
            priority: row.priority,
            order: row.order_index,
            reminderEnabled: Boolean(row.reminder_enabled),
            reminderTime: row.reminder_time,
            userEmail: row.user_email
          })));
        }
      );
    });
  }

  async addTask(task) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO tasks (id, title, completed, project_id, created_at, due_date, priority, order_index, reminder_enabled, reminder_time, user_email) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.title,
          task.completed ? 1 : 0,
          task.projectId,
          task.createdAt,
          task.dueDate,
          task.priority,
          task.order,
          task.reminderEnabled ? 1 : 0,
          task.reminderTime,
          task.userEmail
        ],
        function(err) {
          if (err) reject(err);
          else resolve({ id: task.id });
        }
      );
    });
  }

  async updateTask(id, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (key === 'completed' || key === 'reminderEnabled') {
        fields.push(`${key === 'completed' ? 'completed' : 'reminder_enabled'} = ?`);
        values.push(updates[key] ? 1 : 0);
      } else if (key === 'projectId') {
        fields.push('project_id = ?');
        values.push(updates[key]);
      } else if (key === 'order') {
        fields.push('order_index = ?');
        values.push(updates[key]);
      } else if (key === 'reminderTime') {
        fields.push('reminder_time = ?');
        values.push(updates[key]);
      } else if (key === 'dueDate') {
        fields.push('due_date = ?');
        values.push(updates[key]);
      } else {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    values.push(id);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
        values,
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  async deleteTask(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  async syncTasks(tasks) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        // Clear existing tasks
        this.db.run('DELETE FROM tasks', (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }

          // Insert new tasks
          const stmt = this.db.prepare(`
            INSERT INTO tasks (id, title, completed, project_id, created_at, due_date, priority, order_index, reminder_enabled, reminder_time, user_email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          let completed = 0;
          let total = tasks.length;

          if (total === 0) {
            this.db.run('COMMIT', (err) => {
              if (err) reject(err);
              else resolve({ tasksCount: 0, remindersCount: 0 });
            });
            return;
          }

          tasks.forEach(task => {
            stmt.run([
              task.id,
              task.title,
              task.completed ? 1 : 0,
              task.projectId,
              task.createdAt,
              task.dueDate,
              task.priority,
              task.order,
              task.reminderEnabled ? 1 : 0,
              task.reminderTime,
              task.userEmail
            ], (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              completed++;
              if (completed === total) {
                stmt.finalize();
                this.db.run('COMMIT', (err) => {
                  if (err) reject(err);
                  else {
                    // Update reminders
                    this.updateReminders(tasks).then(() => {
                      resolve({ 
                        tasksCount: tasks.length, 
                        remindersCount: tasks.filter(t => t.reminderEnabled && t.reminderTime && !t.completed).length 
                      });
                    }).catch(reject);
                  }
                });
              }
            });
          });
        });
      });
    });
  }

  // Reminder operations
  async getReminders() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM reminders WHERE sent = 0', (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          taskId: row.task_id,
          userEmail: row.user_email,
          reminderTime: row.reminder_time,
          sent: Boolean(row.sent)
        })));
      });
    });
  }

  async updateReminders(tasks) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Clear existing reminders
        this.db.run('DELETE FROM reminders', (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Insert new reminders for tasks with reminderEnabled
          const reminderTasks = tasks.filter(task => 
            task.reminderEnabled && task.reminderTime && !task.completed
          );

          if (reminderTasks.length === 0) {
            resolve();
            return;
          }

          const stmt = this.db.prepare(`
            INSERT INTO reminders (task_id, user_email, reminder_time, sent)
            VALUES (?, ?, ?, 0)
          `);

          let completed = 0;
          const total = reminderTasks.length;

          reminderTasks.forEach(task => {
            stmt.run([task.id, task.userEmail, task.reminderTime], (err) => {
              if (err) {
                reject(err);
                return;
              }
              
              completed++;
              if (completed === total) {
                stmt.finalize();
                resolve();
              }
            });
          });
        });
      });
    });
  }

  async markReminderSent(taskId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE reminders SET sent = 1 WHERE task_id = ?',
        [taskId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  // SMTP settings operations
  async getSmtpSettings() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM smtp_settings WHERE id = 1', (err, row) => {
        if (err) reject(err);
        else if (row) {
          resolve({
            host: row.host || '',
            port: row.port || 587,
            user: row.user || '',
            pass: row.pass || ''
          });
        } else {
          resolve({
            host: '',
            port: 587,
            user: '',
            pass: ''
          });
        }
      });
    });
  }

  async updateSmtpSettings(settings) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO smtp_settings (id, host, port, user, pass) 
         VALUES (1, ?, ?, ?, ?)`,
        [settings.host, settings.port, settings.user, settings.pass],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err);
        resolve();
      });
    });
  }
}

export default Database;
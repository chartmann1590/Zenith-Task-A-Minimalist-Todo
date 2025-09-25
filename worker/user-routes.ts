import { Hono } from "hono";
import type { Env } from './core-utils';
import { ProjectEntity, TaskEntity, SettingsEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Project, Task, SmtpSettings } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- PROJECTS API ---
  app.get('/api/projects', async (c) => {
    await ProjectEntity.ensureSeed(c.env);
    const { items } = await ProjectEntity.list(c.env);
    items.sort((a, b) => {
      if (a.name === 'Inbox') return -1;
      if (b.name === 'Inbox') return 1;
      return a.createdAt - b.createdAt;
    });
    return ok(c, items);
  });
  app.post('/api/projects', async (c) => {
    const { name } = await c.req.json<{ name?: string }>();
    if (!isStr(name)) return bad(c, 'Project name is required');
    const newProject: Project = { id: crypto.randomUUID(), name: name.trim(), createdAt: Date.now() };
    const created = await ProjectEntity.create(c.env, newProject);
    return ok(c, created);
  });
  app.patch('/api/projects/:id', async (c) => {
    const projectId = c.req.param('id');
    const { name } = await c.req.json<{ name?: string }>();
    if (!isStr(name)) return bad(c, 'Project name is required');
    const projectEntity = new ProjectEntity(c.env, projectId);
    if (!(await projectEntity.exists())) return notFound(c, 'Project not found');
    await projectEntity.patch({ name: name.trim() });
    return ok(c, await projectEntity.getState());
  });
  app.delete('/api/projects/:id', async (c) => {
    const projectId = c.req.param('id');
    const { items: allTasks } = await TaskEntity.list(c.env);
    const tasksToDelete = allTasks.filter(task => task.projectId === projectId);
    const taskIdsToDelete = tasksToDelete.map(task => task.id);
    if (taskIdsToDelete.length > 0) await TaskEntity.deleteMany(c.env, taskIdsToDelete);
    const deleted = await ProjectEntity.delete(c.env, projectId);
    if (!deleted) return notFound(c, 'Project not found');
    return ok(c, { id: projectId, deleted: true });
  });
  // --- TASKS API ---
  app.get('/api/tasks', async (c) => {
    const projectId = c.req.query('projectId');
    if (!isStr(projectId)) return bad(c, 'projectId is required');
    const { items: allTasks } = await TaskEntity.list(c.env);
    const projectTasks = allTasks.filter(task => task.projectId === projectId);
    return ok(c, projectTasks);
  });
  app.post('/api/tasks', async (c) => {
    const { title, projectId, order } = await c.req.json<{ title?: string; projectId?: string; order: number }>();
    if (!isStr(title) || !isStr(projectId)) return bad(c, 'title and projectId are required');
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      projectId,
      createdAt: Date.now(),
      dueDate: null,
      priority: null,
      order: order,
      reminderEnabled: false,
      reminderTime: null,
    };
    const created = await TaskEntity.create(c.env, newTask);
    return ok(c, created);
  });
  app.patch('/api/tasks/:id', async (c) => {
    const taskId = c.req.param('id');
    const updates = await c.req.json<Partial<Task>>();
    const taskEntity = new TaskEntity(c.env, taskId);
    if (!(await taskEntity.exists())) return notFound(c, 'Task not found');
    // Basic validation for reminder fields
    if (updates.reminderEnabled !== undefined && typeof updates.reminderEnabled !== 'boolean') {
        return bad(c, 'Invalid reminderEnabled value');
    }
    if (updates.reminderTime !== undefined && (updates.reminderTime !== null && typeof updates.reminderTime !== 'number')) {
        return bad(c, 'Invalid reminderTime value');
    }
    await taskEntity.patch(updates);
    return ok(c, await taskEntity.getState());
  });
  app.delete('/api/tasks/:id', async (c) => {
    const taskId = c.req.param('id');
    const deleted = await TaskEntity.delete(c.env, taskId);
    if (!deleted) return notFound(c, 'Task not found');
    return ok(c, { id: taskId, deleted: true });
  });
  // --- SETTINGS API ---
  app.get('/api/settings', async (c) => {
    const settingsEntity = new SettingsEntity(c.env);
    const settings = await settingsEntity.getState();
    return ok(c, settings);
  });
  app.post('/api/settings', async (c) => {
    const settings = await c.req.json<SmtpSettings>();
    if (!settings.host || !settings.port || !settings.user || !settings.pass) {
        return bad(c, 'Missing required SMTP settings fields');
    }
    const settingsEntity = new SettingsEntity(c.env);
    await settingsEntity.save(settings);
    return ok(c, settings);
  });
}
import { Entity, IndexedEntity } from "./core-utils";
import type { Project, Task, SmtpSettings } from "@shared/types";


interface Env {
  id?: string | number;

  [key: string]: unknown;
}const SEED_PROJECTS: Project[] = [{ id: 'inbox-default-id', name: 'Inbox', createdAt: Date.now() }, { id: 'work-default-id', name: 'Work', createdAt: Date.now() }];export class ProjectEntity extends IndexedEntity<Project> {static readonly entityName = "project";
  static readonly indexName = "projects";
  static readonly initialState: Project = { id: "", name: "", createdAt: 0 };
  static seedData = SEED_PROJECTS;
}

export class TaskEntity extends IndexedEntity<Task> {
  static readonly entityName = "task";
  static readonly indexName = "tasks";
  static readonly initialState: Task = {
    id: "",
    title: "",
    completed: false,
    projectId: "",
    createdAt: 0,
    dueDate: null,
    priority: null,
    order: 0,
    reminderEnabled: false,
    reminderTime: null
  };
}

export class SettingsEntity extends Entity<SmtpSettings> {
  static readonly entityName = "settings";
  static readonly fixedId = "smtp-settings";
  static readonly initialState: SmtpSettings = {
    host: "",
    port: 0,
    user: "",
    pass: ""
  };
  constructor(env: Env) {
    super(env, SettingsEntity.fixedId);
  }
}
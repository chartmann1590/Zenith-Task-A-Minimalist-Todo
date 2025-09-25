// Base API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Represents a project that contains tasks
export interface Project {
  id: string;
  name: string;
  createdAt: number;
  icon?: string;
}
// Defines the priority levels for a task
export type TaskPriority = 'low' | 'medium' | 'high' | null;
// Represents a single todo item
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  projectId: string;
  createdAt: number;
  dueDate?: number | null;
  priority?: TaskPriority;
  order: number;
  reminderEnabled?: boolean;
  reminderTime?: number | null;
}
// Represents SMTP settings for email reminders
export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  toEmail: string;
}
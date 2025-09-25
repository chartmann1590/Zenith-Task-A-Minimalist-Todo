import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Project, Task, SmtpSettings } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';
type DialogState = {
  isProjectDialogOpen: boolean;
  editingProject: Project | null;
  isDeleteDialogOpen: boolean;
  deletingProject: Project | null;
};
type AppState = {
  projects: Project[];
  tasks: Task[];
  activeProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  smtpSettings: SmtpSettings | null;
} & DialogState;
type AppActions = {
  fetchInitialData: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: SmtpSettings) => Promise<void>;
  setActiveProjectId: (projectId: string) => void;
  // Task actions
  addTask: (title: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  reorderTasks: (oldIndex: number, newIndex: number) => Promise<void>;
  // Project actions
  addProject: (name: string) => Promise<void>;
  updateProject: (projectId: string, name: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  // Dialog actions
  openProjectDialog: (project: Project | null) => void;
  closeProjectDialog: () => void;
  openDeleteDialog: (project: Project) => void;
  closeDeleteDialog: () => void;
};
const initialState: AppState = {
  projects: [],
  tasks: [],
  activeProjectId: null,
  isLoading: true,
  error: null,
  smtpSettings: null,
  isProjectDialogOpen: false,
  editingProject: null,
  isDeleteDialogOpen: false,
  deletingProject: null,
};
export const useAppStore = create<AppState & AppActions>()(
  immer((set, get) => ({
    ...initialState,
    fetchInitialData: async () => {
      try {
        set({ isLoading: true, error: null });
        const projects = await api<Project[]>('/api/projects');
        set({ projects });
        if (projects.length > 0) {
          const inboxProject = projects.find(p => p.name === 'Inbox') || projects[0];
          set({ activeProjectId: inboxProject.id });
          const tasks = await api<Task[]>(`/api/tasks?projectId=${inboxProject.id}`);
          set({ tasks });
        } else {
          set({ tasks: [] });
        }
        await get().fetchSettings();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch initial data';
        set({ error: errorMessage });
        toast.error(errorMessage);
      } finally {
        set({ isLoading: false });
      }
    },
    fetchSettings: async () => {
        try {
            const settings = await api<SmtpSettings>('/api/settings');
            set({ smtpSettings: settings });
        } catch (error) {
            console.error("Could not fetch settings, maybe they are not set yet.");
        }
    },
    updateSettings: async (settings) => {
        const originalSettings = get().smtpSettings;
        set({ smtpSettings: settings });
        try {
            await api('/api/settings', {
                method: 'POST',
                body: JSON.stringify(settings),
            });
        } catch (error) {
            toast.error('Failed to update settings. Reverting.');
            set({ smtpSettings: originalSettings });
            throw error;
        }
    },
    setActiveProjectId: async (projectId: string) => {
      if (get().activeProjectId === projectId) return;
      set({ activeProjectId: projectId, isLoading: true, error: null, tasks: [] });
      try {
        const tasks = await api<Task[]>(`/api/tasks?projectId=${projectId}`);
        set({ tasks });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
        set({ error: errorMessage });
        toast.error(errorMessage);
      } finally {
        set({ isLoading: false });
      }
    },
    addTask: async (title: string) => {
      const { activeProjectId, tasks } = get();
      if (!activeProjectId) {
        toast.error("No active project selected.");
        return;
      }
      const optimisticId = crypto.randomUUID();
      const maxOrder = tasks.reduce((max, task) => Math.max(task.order, max), -1);
      const newTask: Task = {
        id: optimisticId,
        title,
        completed: false,
        projectId: activeProjectId,
        createdAt: Date.now(),
        order: maxOrder + 1,
      };
      set((state) => {
        state.tasks.push(newTask);
      });
      try {
        const createdTask = await api<Task>('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title, projectId: activeProjectId, order: newTask.order }),
        });
        set((state) => {
          const taskIndex = state.tasks.findIndex((t) => t.id === optimisticId);
          if (taskIndex !== -1) {
            state.tasks[taskIndex] = createdTask;
          }
        });
      } catch (error) {
        toast.error('Failed to add task. Reverting.');
        set((state) => {
          state.tasks = state.tasks.filter((t) => t.id !== optimisticId);
        });
      }
    },
    updateTask: async (taskId, updates) => {
      const originalTasks = get().tasks;
      const taskIndex = originalTasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return;
      const updatedTask = { ...originalTasks[taskIndex], ...updates };
      set((state) => {
        state.tasks[taskIndex] = updatedTask;
      });
      try {
        await api(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      } catch (error) {
        toast.error('Failed to update task. Reverting.');
        set({ tasks: originalTasks });
      }
    },
    deleteTask: async (taskId: string) => {
      const originalTasks = get().tasks;
      set((state) => {
        state.tasks = state.tasks.filter((t) => t.id !== taskId);
      });
      try {
        await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
      } catch (error) {
        toast.error('Failed to delete task. Reverting.');
        set({ tasks: originalTasks });
      }
    },
    reorderTasks: async (oldIndex: number, newIndex: number) => {
      const originalTasks = get().tasks;
      const reorderedTasks = arrayMove(originalTasks, oldIndex, newIndex).map((task, index) => ({
        ...task,
        order: index,
      }));
      set({ tasks: reorderedTasks });
      try {
        await Promise.all(
          reorderedTasks.map(task =>
            api(`/api/tasks/${task.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ order: task.order }),
            })
          )
        );
      } catch (error) {
        toast.error('Failed to save new task order. Reverting.');
        set({ tasks: originalTasks });
      }
    },
    addProject: async (name: string) => {
      const optimisticId = crypto.randomUUID();
      const newProject: Project = {
        id: optimisticId,
        name,
        createdAt: Date.now(),
      };
      set(state => {
        state.projects.push(newProject);
      });
      try {
        const createdProject = await api<Project>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
        set(state => {
          const projectIndex = state.projects.findIndex(p => p.id === optimisticId);
          if (projectIndex !== -1) {
            state.projects[projectIndex] = createdProject;
          }
          state.activeProjectId = createdProject.id;
          state.tasks = [];
        });
        toast.success(`Project "${createdProject.name}" created.`);
      } catch (error) {
        toast.error('Failed to create project.');
        set(state => {
          state.projects = state.projects.filter(p => p.id !== optimisticId);
        });
      }
    },
    updateProject: async (projectId: string, name: string) => {
      const originalProjects = get().projects;
      const projectIndex = originalProjects.findIndex(p => p.id === projectId);
      if (projectIndex === -1) return;
      const updatedProject = { ...originalProjects[projectIndex], name };
      set(state => {
        state.projects[projectIndex] = updatedProject;
      });
      try {
        await api(`/api/projects/${projectId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name }),
        });
        toast.success(`Project renamed to "${name}".`);
      } catch (error) {
        toast.error('Failed to rename project.');
        set({ projects: originalProjects });
      }
    },
    deleteProject: async (projectId: string) => {
      const { projects, activeProjectId } = get();
      const originalProjects = projects;
      set(state => {
        state.projects = state.projects.filter(p => p.id !== projectId);
        if (state.activeProjectId === projectId) {
          const inbox = state.projects.find(p => p.name === 'Inbox') || state.projects[0];
          state.activeProjectId = inbox ? inbox.id : null;
        }
      });
      const newActiveId = get().activeProjectId;
      if (newActiveId) {
        get().setActiveProjectId(newActiveId);
      } else {
        set({ tasks: [] });
      }
      try {
        await api(`/api/projects/${projectId}`, { method: 'DELETE' });
        toast.success('Project deleted.');
      } catch (error) {
        toast.error('Failed to delete project.');
        set({ projects: originalProjects, activeProjectId });
      }
    },
    openProjectDialog: (project) => {
      set({ isProjectDialogOpen: true, editingProject: project });
    },
    closeProjectDialog: () => {
      set({ isProjectDialogOpen: false, editingProject: null });
    },
    openDeleteDialog: (project) => {
      set({ isDeleteDialogOpen: true, deletingProject: project });
    },
    closeDeleteDialog: () => {
      set({ isDeleteDialogOpen: false, deletingProject: null });
    },
  }))
);
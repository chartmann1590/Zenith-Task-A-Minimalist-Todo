import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Project, Task, SmtpSettings } from '@shared/types';
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
  initializeApp: () => void;
  updateSettings: (settings: SmtpSettings) => Promise<void>;
  testSMTPConnection: () => Promise<boolean>;
  sendTestEmail: (email: string) => Promise<boolean>;
  setActiveProjectId: (projectId: string) => void;
  // Task actions
  addTask: (title: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (oldIndex: number, newIndex: number) => void;
  syncTasksWithBackend: () => Promise<void>;
  // Project actions
  addProject: (name: string) => void;
  updateProject: (projectId: string, name: string) => void;
  deleteProject: (projectId: string) => void;
  // Dialog actions
  openProjectDialog: (project: Project | null) => void;
  closeProjectDialog: () => void;
  openDeleteDialog: (project: Project) => void;
  closeDeleteDialog: () => void;
};

const API_BASE_URL = 'http://localhost:3001/api';

const initialState: AppState = {
  projects: [
    { id: 'inbox-default-id', name: 'Inbox', createdAt: Date.now() },
    { id: 'work-default-id', name: 'Work', createdAt: Date.now() }
  ],
  tasks: [],
  activeProjectId: 'inbox-default-id',
  isLoading: false,
  error: null,
  smtpSettings: {
    host: '',
    port: 587,
    user: '',
    pass: ''
  },
  isProjectDialogOpen: false,
  editingProject: null,
  isDeleteDialogOpen: false,
  deletingProject: null,
};

export const useAppStore = create<AppState & AppActions>()(
  immer((set, get) => ({
    ...initialState,
    
    initializeApp: () => {
      set({ isLoading: true });
      // Simulate loading time
      setTimeout(() => {
        set({ isLoading: false });
      }, 500);
    },

    updateSettings: async (settings) => {
      try {
        const response = await fetch(`${API_BASE_URL}/smtp/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });

        const result = await response.json();
        
        if (result.success) {
          set({ smtpSettings: settings });
          toast.success('SMTP settings saved and tested successfully!');
        } else {
          toast.error(`Failed to save settings: ${result.error}`);
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error updating SMTP settings:', error);
        toast.error('Failed to save SMTP settings. Please check your configuration.');
        throw error;
      }
    },

    testSMTPConnection: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/smtp/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        
        if (result.success && result.data.success) {
          toast.success('SMTP connection test successful!');
          return true;
        } else {
          toast.error(`SMTP test failed: ${result.data?.error || 'Unknown error'}`);
          return false;
        }
      } catch (error) {
        console.error('Error testing SMTP connection:', error);
        toast.error('Failed to test SMTP connection. Please check your settings.');
        return false;
      }
    },

    sendTestEmail: async (email: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/smtp/test-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const result = await response.json();
        
        if (result.success) {
          toast.success('Test email sent successfully! Check your inbox.');
          return true;
        } else {
          toast.error(`Failed to send test email: ${result.error}`);
          return false;
        }
      } catch (error) {
        console.error('Error sending test email:', error);
        toast.error('Failed to send test email. Please check your settings.');
        return false;
      }
    },

    syncTasksWithBackend: async () => {
      try {
        const { tasks } = get();
        const tasksWithEmail = tasks.map(task => ({
          ...task,
          userEmail: 'user@example.com' // In a real app, this would come from user authentication
        }));

        const response = await fetch(`${API_BASE_URL}/tasks/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tasks: tasksWithEmail }),
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`Synced ${result.data.tasksCount} tasks and ${result.data.remindersCount} reminders`);
        } else {
          console.error('Failed to sync tasks:', result.error);
        }
      } catch (error) {
        console.error('Error syncing tasks with backend:', error);
      }
    },

    setActiveProjectId: (projectId: string) => {
      if (get().activeProjectId === projectId) return;
      set({ activeProjectId: projectId });
    },

    addTask: (title: string) => {
      const { activeProjectId, tasks, syncTasksWithBackend } = get();
      if (!activeProjectId) {
        toast.error("No active project selected.");
        return;
      }
      
      const maxOrder = tasks.reduce((max, task) => Math.max(task.order, max), -1);
      const newTask: Task = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        projectId: activeProjectId,
        createdAt: Date.now(),
        order: maxOrder + 1,
        dueDate: null,
        priority: null,
        reminderEnabled: false,
        reminderTime: null,
      };
      
      set((state) => {
        state.tasks.push(newTask);
      });
      
      // Sync with backend for reminders
      syncTasksWithBackend();
      toast.success('Task added successfully!');
    },

    updateTask: (taskId, updates) => {
      const { syncTasksWithBackend } = get();
      set((state) => {
        const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
        }
      });
      
      // Sync with backend for reminders
      syncTasksWithBackend();
      toast.success('Task updated successfully!');
    },

    deleteTask: (taskId: string) => {
      const { syncTasksWithBackend } = get();
      set((state) => {
        state.tasks = state.tasks.filter((t) => t.id !== taskId);
      });
      
      // Sync with backend for reminders
      syncTasksWithBackend();
      toast.success('Task deleted successfully!');
    },

    reorderTasks: (oldIndex: number, newIndex: number) => {
      set((state) => {
        const reorderedTasks = arrayMove(state.tasks, oldIndex, newIndex).map((task, index) => ({
          ...task,
          order: index,
        }));
        state.tasks = reorderedTasks;
      });
      toast.success('Tasks reordered successfully!');
    },

    addProject: (name: string) => {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now(),
      };
      
      set(state => {
        state.projects.push(newProject);
        state.activeProjectId = newProject.id;
        state.tasks = [];
      });
      toast.success(`Project "${newProject.name}" created.`);
    },

    updateProject: (projectId: string, name: string) => {
      set(state => {
        const projectIndex = state.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
          state.projects[projectIndex].name = name;
        }
      });
      toast.success(`Project renamed to "${name}".`);
    },

    deleteProject: (projectId: string) => {
      const { projects, activeProjectId } = get();
      
      set(state => {
        state.projects = state.projects.filter(p => p.id !== projectId);
        state.tasks = state.tasks.filter(t => t.projectId !== projectId);
        
        if (state.activeProjectId === projectId) {
          const inbox = state.projects.find(p => p.name === 'Inbox') || state.projects[0];
          state.activeProjectId = inbox ? inbox.id : null;
          state.tasks = state.tasks.filter(t => t.projectId === state.activeProjectId);
        }
      });
      
      toast.success('Project deleted.');
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
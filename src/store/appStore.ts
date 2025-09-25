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
  loadSmtpSettings: () => Promise<void>;
  updateSettings: (settings: SmtpSettings) => Promise<void>;
  testSMTPConnection: () => Promise<boolean>;
  sendTestEmail: (email: string) => Promise<boolean>;
  setActiveProjectId: (projectId: string) => void;
  // Task actions
  addTask: (title: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (oldIndex: number, newIndex: number, projectId: string) => void;
  syncTasksWithBackend: () => Promise<void>;
  // Project actions
  addProject: (name: string, icon?: string) => void;
  updateProject: (projectId: string, name: string, icon?: string) => void;
  deleteProject: (projectId: string) => void;
  // Dialog actions
  openProjectDialog: (project: Project | null) => void;
  closeProjectDialog: () => void;
  openDeleteDialog: (project: Project) => void;
  closeDeleteDialog: () => void;
};

// Use relative URLs in production (Docker) and absolute URLs in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : `${window.location.protocol}//${window.location.hostname}:3001/api`;

const initialState: AppState = {
  projects: [
    { id: 'inbox-default-id', name: 'Inbox', createdAt: Date.now(), icon: 'inbox' },
    { id: 'work-default-id', name: 'Work', createdAt: Date.now(), icon: 'briefcase' }
  ],
  tasks: [],
  activeProjectId: 'inbox-default-id',
  isLoading: false,
  error: null,
  smtpSettings: {
    host: '',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    toEmail: ''
  },
  isProjectDialogOpen: false,
  editingProject: null,
  isDeleteDialogOpen: false,
  deletingProject: null,
};

export const useAppStore = create<AppState & AppActions>()(
  immer((set, get) => ({
    ...initialState,
    
    initializeApp: async () => {
      set({ isLoading: true });
      try {
        // Load projects and tasks from backend
        const [projectsResponse, tasksResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/projects`),
          fetch(`${API_BASE_URL}/tasks`)
        ]);

        const projectsResult = await projectsResponse.json();
        const tasksResult = await tasksResponse.json();

        if (projectsResult.success && tasksResult.success) {
          set({ 
            projects: projectsResult.data,
            tasks: tasksResult.data,
            isLoading: false 
          });
        } else {
          console.error('Failed to load data from backend');
          set({ isLoading: false });
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        set({ isLoading: false });
      }
    },

    loadSmtpSettings: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/smtp/settings`);
        const result = await response.json();
        
        if (result.success && result.data) {
          set({ 
            smtpSettings: {
              host: result.data.host || '',
              port: result.data.port || 587,
              user: result.data.user || '',
              pass: '', // Don't load password for security
              fromEmail: result.data.fromEmail || '',
              toEmail: result.data.toEmail || ''
            }
          });
        }
      } catch (error) {
        console.error('Error loading SMTP settings:', error);
        toast.error('Failed to load SMTP settings from server');
      }
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
          
          // Check if SMTP connection test was successful
          if (result.data && result.data.configured) {
            toast.success('SMTP settings saved and tested successfully!');
          } else {
            const errorMsg = result.data?.testResult?.error || 'SMTP connection test failed';
            toast.warning(`Settings saved but SMTP test failed: ${errorMsg}. Please check your credentials and try again.`);
            // Don't throw error - allow settings to be saved even if test fails
          }
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

    reorderTasks: (oldIndex: number, newIndex: number, projectId: string) => {
      set((state) => {
        // Get tasks for the specific project
        const projectTasks = state.tasks.filter(task => task.projectId === projectId);
        const otherTasks = state.tasks.filter(task => task.projectId !== projectId);
        
        // Reorder only the project tasks
        const reorderedProjectTasks = arrayMove(projectTasks, oldIndex, newIndex).map((task, index) => ({
          ...task,
          order: index,
        }));
        
        // Combine with other tasks
        state.tasks = [...otherTasks, ...reorderedProjectTasks];
      });
      toast.success('Tasks reordered successfully!');
    },

    addProject: async (name: string, icon?: string) => {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now(),
        icon: icon || 'inbox',
      };
      
      try {
        // Add to backend
        const response = await fetch(`${API_BASE_URL}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProject),
        });

        if (response.ok) {
          set(state => {
            state.projects.push(newProject);
            state.activeProjectId = newProject.id;
            state.tasks = [];
          });
          toast.success(`Project "${newProject.name}" created.`);
        } else {
          toast.error('Failed to create project');
        }
      } catch (error) {
        console.error('Error creating project:', error);
        toast.error('Failed to create project');
      }
    },

    updateProject: async (projectId: string, name: string, icon?: string) => {
      try {
        // Update in backend
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, icon }),
        });

        if (response.ok) {
          set(state => {
            const projectIndex = state.projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) {
              state.projects[projectIndex].name = name;
              if (icon !== undefined) {
                state.projects[projectIndex].icon = icon;
              }
            }
          });
          toast.success(`Project updated successfully.`);
        } else {
          toast.error('Failed to update project');
        }
      } catch (error) {
        console.error('Error updating project:', error);
        toast.error('Failed to update project');
      }
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
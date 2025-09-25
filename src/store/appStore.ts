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
  updateSettings: (settings: SmtpSettings) => void;
  setActiveProjectId: (projectId: string) => void;
  // Task actions
  addTask: (title: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (oldIndex: number, newIndex: number) => void;
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

    updateSettings: (settings) => {
      set({ smtpSettings: settings });
      toast.success('Settings saved successfully!');
    },

    setActiveProjectId: (projectId: string) => {
      if (get().activeProjectId === projectId) return;
      set({ activeProjectId: projectId });
    },

    addTask: (title: string) => {
      const { activeProjectId, tasks } = get();
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
      toast.success('Task added successfully!');
    },

    updateTask: (taskId, updates) => {
      set((state) => {
        const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
        }
      });
      toast.success('Task updated successfully!');
    },

    deleteTask: (taskId: string) => {
      set((state) => {
        state.tasks = state.tasks.filter((t) => t.id !== taskId);
      });
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
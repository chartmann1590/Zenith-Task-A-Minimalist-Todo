import React from 'react';
import { CheckSquare, Inbox, Briefcase, Plus, Settings } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProjectContextMenu } from './ProjectContextMenu';
import { ScrollArea } from './ui/scroll-area';
import { Link, useLocation } from 'react-router-dom';
export function Sidebar() {
  const projects = useAppStore((state) => state.projects);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const setActiveProjectId = useAppStore((state) => state.setActiveProjectId);
  const openProjectDialog = useAppStore((state) => state.openProjectDialog);
  const location = useLocation();
  const projectIcons: { [key: string]: React.ReactNode } = {
    'Inbox': <Inbox className="h-5 w-5" />,
    'Work': <Briefcase className="h-5 w-5" />,
  };
  return (
    <aside className="w-full md:w-[280px] bg-neutral-50 dark:bg-neutral-900/50 p-6 flex flex-col border-r border-border h-full">
      <div className="flex items-center gap-3 mb-8">
        <CheckSquare className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Zenith Task</h1>
      </div>
      <div className="flex items-center justify-between mb-2 px-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Projects</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openProjectDialog(null)}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">New Project</span>
        </Button>
      </div>
      <ScrollArea className="flex-grow -mx-3">
        <nav className="flex flex-col gap-1 px-3">
          {projects.map((project) => (
            <ProjectContextMenu key={project.id} project={project}>
              <Button
                variant={activeProjectId === project.id && location.pathname === '/' ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start text-base h-11 px-3',
                  activeProjectId === project.id && location.pathname === '/'
                    ? 'text-primary-foreground bg-primary hover:bg-primary/90'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                onClick={() => setActiveProjectId(project.id)}
              >
                <div className="mr-3">{projectIcons[project.name] || <Inbox className="h-5 w-5" />}</div>
                <span className="truncate flex-1 text-left">{project.name}</span>
              </Button>
            </ProjectContextMenu>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto pt-4">
        <Button asChild variant={location.pathname === '/settings' ? 'secondary' : 'ghost'} className="w-full justify-start text-base h-11 px-3">
          <Link to="/settings">
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </Button>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>Built with ❤️ for productivity</p>
        </div>
      </div>
    </aside>
  );
}
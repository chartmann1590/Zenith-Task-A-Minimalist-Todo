import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Project } from '@shared/types';
interface ProjectContextMenuProps {
  project: Project;
  children: React.ReactNode;
}
export function ProjectContextMenu({ project, children }: ProjectContextMenuProps) {
  const openProjectDialog = useAppStore((state) => state.openProjectDialog);
  const openDeleteDialog = useAppStore((state) => state.openDeleteDialog);
  // Inbox is a special project and cannot be renamed or deleted.
  const isInbox = project.name === 'Inbox';
  if (isInbox) {
    return <>{children}</>;
  }
  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full">{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => openProjectDialog(project)}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(project)}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Project</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
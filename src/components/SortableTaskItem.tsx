import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from './TaskItem';
import type { Task } from '@shared/types';
import { GripVertical } from 'lucide-react';
interface SortableTaskItemProps {
  task: Task;
}
export function SortableTaskItem({ task }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center group bg-background">
      <div
        {...attributes}
        {...listeners}
        className="p-2 cursor-grab touch-none text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder task"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-grow">
        <TaskItem task={task} />
      </div>
    </div>
  );
}
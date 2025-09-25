import React, { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { AddTaskForm } from './AddTaskForm';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTodo } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskItem } from './SortableTaskItem';
import { toast } from 'sonner';
export function TaskView() {
  const tasks = useAppStore((state) => state.tasks);
  const isLoading = useAppStore((state) => state.isLoading);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const projects = useAppStore((state) => state.projects);
  const reorderTasks = useAppStore((state) => state.reorderTasks);
  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const sortedTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => a.order - b.order);
  }, [tasks]);
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedTasks.findIndex(task => task.id === active.id);
      const newIndex = sortedTasks.findIndex(task => task.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTasks(oldIndex, newIndex).catch(() => {
          toast.error("Failed to reorder tasks.");
        });
      }
    }
  };
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 py-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-16">
          <ListTodo className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-foreground">All Clear!</h3>
          <p className="text-muted-foreground mt-2">Add a new task to get started.</p>
        </div>
      );
    }
    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-border">
            {sortedTasks.map((task) => (
              <SortableTaskItem key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  };
  return (
    <div className="flex flex-col h-full">
      <header className="py-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {activeProject?.name || 'Tasks'}
        </h1>
      </header>
      <ScrollArea className="flex-grow pr-4 -mr-4">
        {renderContent()}
      </ScrollArea>
      <div className="pt-6">
        <AddTaskForm />
      </div>
    </div>
  );
}
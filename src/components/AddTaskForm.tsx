import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/appStore';
export function AddTaskForm() {
  const [title, setTitle] = useState('');
  const addTask = useAppStore((state) => state.addTask);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      addTask(trimmedTitle);
      setTitle('');
    }
  };
  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Plus className="h-5 w-5 text-muted-foreground" />
      </div>
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task..."
        className="pl-10 h-12 text-base bg-background/80 backdrop-blur-sm"
        aria-label="Add a new task"
      />
    </form>
  );
}
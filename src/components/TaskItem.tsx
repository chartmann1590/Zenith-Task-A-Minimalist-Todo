import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Calendar as CalendarIcon, Flag, AlarmClock } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from './DateTimePicker';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import type { Task, TaskPriority } from '@shared/types';
interface TaskItemProps {
  task: Task;
}
const priorityConfig = {
  high: { label: 'High', color: 'bg-red-500' },
  medium: { label: 'Medium', color: 'bg-yellow-500' },
  low: { label: 'Low', color: 'bg-blue-500' },
};
export function TaskItem({ task }: TaskItemProps) {
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  const handleToggle = () => {
    updateTask(task.id, { completed: !task.completed });
  };
  const handleDelete = () => {
    deleteTask(task.id);
  };
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== task.title) {
      updateTask(task.id, { title: title.trim() });
    } else {
      setTitle(task.title);
    }
    setIsEditing(false);
  };
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleBlur();
    else if (e.key === 'Escape') {
      setTitle(task.title);
      setIsEditing(false);
    }
  };
  const handleDateSelect = (date: Date | undefined) => {
    updateTask(task.id, { dueDate: date ? date.getTime() : null });
  };
  const handlePriorityChange = (priority: string) => {
    updateTask(task.id, { priority: priority === 'none' ? null : (priority as TaskPriority) });
  };
  const handleReminderToggle = (enabled: boolean) => {
    const updates: Partial<Task> = { reminderEnabled: enabled };
    if (enabled && !task.reminderTime) {
      updates.reminderTime = (task.dueDate || Date.now());
    }
    updateTask(task.id, updates);
  };
  const handleReminderTimeChange = (date: Date | null) => {
    updateTask(task.id, { reminderTime: date ? date.getTime() : null });
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-center gap-2 py-2 w-full"
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={handleToggle}
        className="h-5 w-5 rounded-full"
        aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="flex-grow" onDoubleClick={() => !task.completed && setIsEditing(true)}>
        {isEditing ? (
          <Input ref={inputRef} value={title} onChange={handleTitleChange} onBlur={handleTitleBlur} onKeyDown={handleTitleKeyDown} className="h-8 text-base" />
        ) : (
          <span className={cn('transition-colors text-base', task.completed ? 'line-through text-muted-foreground' : 'text-foreground')}>
            {task.title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 ml-auto opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
        {task.reminderEnabled && task.reminderTime && (
          <Badge variant="outline" className="font-normal flex items-center gap-1">
            <AlarmClock className="h-3 w-3" />
            {format(new Date(task.reminderTime), 'MMM d, h:mm a')}
          </Badge>
        )}
        {task.dueDate && (
          <Badge variant="outline" className="font-normal">{format(new Date(task.dueDate), 'MMM d')}</Badge>
        )}
        {task.priority && (
          <Badge variant="outline" className="border-0 p-0"><div className={cn('w-2.5 h-2.5 rounded-full', priorityConfig[task.priority].color)} /></Badge>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><AlarmClock className="h-4 w-4" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <div className="p-4 border-b">
              <div className="flex items-center space-x-2">
                <Switch id={`reminder-${task.id}`} checked={task.reminderEnabled} onCheckedChange={handleReminderToggle} />
                <Label htmlFor={`reminder-${task.id}`}>Enable Reminder</Label>
              </div>
            </div>
            {task.reminderEnabled && (
              <DateTimePicker value={task.reminderTime ? new Date(task.reminderTime) : null} onChange={handleReminderTimeChange} />
            )}
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><CalendarIcon className="h-4 w-4" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={task.dueDate ? new Date(task.dueDate) : undefined} onSelect={handleDateSelect} initialFocus />
          </PopoverContent>
        </Popover>
        <Select onValueChange={handlePriorityChange} value={task.priority || 'none'}>
          <SelectTrigger className="h-8 w-8 p-0 rounded-full border-0 bg-transparent hover:bg-accent focus:ring-0 focus:ring-offset-0 data-[state=open]:bg-accent">
            <Flag className="h-4 w-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Priority</SelectItem>
            <SelectItem value="low"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Low</div></SelectItem>
            <SelectItem value="medium"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Medium</div></SelectItem>
            <SelectItem value="high"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> High</div></SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive" aria-label={`Delete task "${task.title}"`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppStore } from '@/store/appStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { IconSelector } from '@/components/IconSelector';
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(50, 'Project name is too long'),
  icon: z.string().optional(),
});
type ProjectFormData = z.infer<typeof projectSchema>;
export function ProjectFormDialog() {
  const isProjectDialogOpen = useAppStore((state) => state.isProjectDialogOpen);
  const editingProject = useAppStore((state) => state.editingProject);
  const closeProjectDialog = useAppStore((state) => state.closeProjectDialog);
  const addProject = useAppStore((state) => state.addProject);
  const updateProject = useAppStore((state) => state.updateProject);
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      icon: 'inbox',
    },
  });
  useEffect(() => {
    if (editingProject) {
      form.reset({ name: editingProject.name, icon: editingProject.icon || 'inbox' });
    } else {
      form.reset({ name: '', icon: 'inbox' });
    }
  }, [editingProject, form]);
  const onSubmit = (data: ProjectFormData) => {
    if (editingProject) {
      updateProject(editingProject.id, data.name, data.icon);
    } else {
      addProject(data.name, data.icon);
    }
    closeProjectDialog();
  };
  return (
    <Dialog open={isProjectDialogOpen} onOpenChange={closeProjectDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingProject ? 'Rename Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {editingProject ? 'Give your project a new name.' : 'Create a new project to organize your tasks.'}
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Home Remodel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Icon</FormLabel>
                  <FormControl>
                    <IconSelector
                      selectedIcon={field.value}
                      onIconSelect={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeProjectDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingProject ? 'Save Changes' : 'Create Project'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
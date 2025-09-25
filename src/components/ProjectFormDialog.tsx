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
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(50, 'Project name is too long'),
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
    },
  });
  useEffect(() => {
    if (editingProject) {
      form.reset({ name: editingProject.name });
    } else {
      form.reset({ name: '' });
    }
  }, [editingProject, form]);
  const onSubmit = (data: ProjectFormData) => {
    if (editingProject) {
      updateProject(editingProject.id, data.name);
    } else {
      addProject(data.name);
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
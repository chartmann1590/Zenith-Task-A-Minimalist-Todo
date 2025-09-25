import React from 'react';
import { useAppStore } from '@/store/appStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
export function DeleteProjectDialog() {
  const isDeleteDialogOpen = useAppStore((state) => state.isDeleteDialogOpen);
  const deletingProject = useAppStore((state) => state.deletingProject);
  const closeDeleteDialog = useAppStore((state) => state.closeDeleteDialog);
  const deleteProject = useAppStore((state) => state.deleteProject);
  const handleDelete = () => {
    if (deletingProject) {
      deleteProject(deletingProject.id);
    }
    closeDeleteDialog();
  };
  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={closeDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          This action cannot be undone. This will permanently delete the
          <strong> "{deletingProject?.name}"</strong> project and all of its associated tasks.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { Toaster } from '@/components/ui/sonner';
import { ProjectFormDialog } from '@/components/ProjectFormDialog';
import { DeleteProjectDialog } from '@/components/DeleteProjectDialog';
export function App() {
  const fetchInitialData = useAppStore((state) => state.fetchInitialData);
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
      <ProjectFormDialog />
      <DeleteProjectDialog />
    </>
  );
}
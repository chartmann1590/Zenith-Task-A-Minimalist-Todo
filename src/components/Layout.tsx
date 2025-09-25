import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TaskView } from './TaskView';
import { Toaster } from '@/components/ui/sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, CheckSquare } from 'lucide-react';
import { ProjectFormDialog } from './ProjectFormDialog';
import { DeleteProjectDialog } from './DeleteProjectDialog';
export function Layout() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  if (isMobile) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
        <header className="flex items-center justify-between px-4 sm:px-6 h-16 border-b">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Zenith Task</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px]">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
          <TaskView />
        </main>
        <Toaster richColors position="top-right" />
        <ProjectFormDialog />
        <DeleteProjectDialog />
      </div>
    );
  }
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex-grow">
          <TaskView />
        </div>
      </main>
      <Toaster richColors position="top-right" />
      <ProjectFormDialog />
      <DeleteProjectDialog />
    </div>
  );
}
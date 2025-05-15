import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/app-store';
import { Menu, X, Sun, Moon, Monitor, Upload, BarChart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from "../../lib/utils";
import { Link, useRouter } from '@tanstack/react-router';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { theme, setTheme, sidebarOpen, setSidebarOpen } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // After mounting, we have access to the window object
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle theme toggle
  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  // Get the current theme icon
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  // Handle sidebar toggle for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  // Get the current route path
  const currentPath = router.state.location.pathname;

  if (!mounted) {
    // Return a placeholder during SSR
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-bold">Budget Flowr</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              <ThemeIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 mt-16 w-full shrink-0 overflow-y-auto border-r bg-background px-4 py-6 md:static md:block",
            sidebarOpen ? "block" : "hidden"
          )}
        >
          <nav className="flex flex-col gap-2">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                currentPath === "/" ? "bg-secondary" : "hover:bg-secondary/50"
              )}
            >
              <BarChart className="h-4 w-4" />
              Dashboard
            </Link>
            <a
              href="#"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary/50"
            >
              Transactions
            </a>
            <a
              href="#"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary/50"
            >
              Reports
            </a>
            <a
              href="#"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary/50"
            >
              Budget
            </a>

            {/* Utilities Section Heading */}
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground mt-4">
              UTILITIES
            </div>

            <Link
              to="/import"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                currentPath.startsWith("/import") ? "bg-secondary" : "hover:bg-secondary/50"
              )}
            >
              <Upload className="h-4 w-4" />
              Import
            </Link>
            <a
              href="#"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary/50"
            >
              Settings
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pt-6">{children}</main>
      </div>
    </div>
  );
};
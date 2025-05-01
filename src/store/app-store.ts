import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the theme type
export type Theme = 'light' | 'dark' | 'system';

// Define the store state interface
interface AppState {
  // Theme state
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // User preferences
  gridPageSize: number;
  setGridPageSize: (size: number) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// Define the notification interface
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: Date;
  autoClose?: boolean;
}

// Generate a unique ID for notifications
const generateId = () => Math.random().toString(36).substring(2, 9);

// Create the store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme state with system default
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // Sidebar state (open by default on desktop, closed on mobile)
      sidebarOpen: window.innerWidth > 768,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // User preferences
      gridPageSize: 10,
      setGridPageSize: (size) => set({ gridPageSize: size }),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => 
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              id: generateId(),
              createdAt: new Date(),
              ...notification,
            },
          ],
        })),
      dismissNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter(
            (notification) => notification.id !== id
          ),
        })),
      clearAllNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'budget-flowr-storage',
      partialize: (state) => ({
        theme: state.theme,
        gridPageSize: state.gridPageSize,
      }),
    }
  )
);

// Example usage:
// const { theme, setTheme } = useAppStore();
// setTheme('dark');

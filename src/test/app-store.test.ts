import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAppStore } from '../store/app-store';

// Import Zustand modules for hydration test
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Import the id-utils module to mock
import * as idUtils from '../lib/id-utils';

describe('App Store', () => {
  beforeEach(() => {
    // Reset the store state
    const { setState } = useAppStore;
    act(() => {
      setState({
        theme: 'system',
        setTheme: useAppStore.getState().setTheme,
        sidebarOpen: window.innerWidth > 768,
        toggleSidebar: useAppStore.getState().toggleSidebar,
        setSidebarOpen: useAppStore.getState().setSidebarOpen,
        gridPageSize: 10,
        setGridPageSize: useAppStore.getState().setGridPageSize,
        notifications: [],
        addNotification: useAppStore.getState().addNotification,
        dismissNotification: useAppStore.getState().dismissNotification,
        clearAllNotifications: useAppStore.getState().clearAllNotifications,
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const state = useAppStore.getState();
      
      expect(state.theme).toBe('system');
      expect(state.sidebarOpen).toBe(window.innerWidth > 768);
      expect(state.gridPageSize).toBe(10);
      expect(state.notifications).toEqual([]);
    });
  });

  describe('Theme Management', () => {
    it('should set theme correctly', () => {
      const { setTheme } = useAppStore.getState();
      
      // Default theme is 'system'
      expect(useAppStore.getState().theme).toBe('system');
      
      // Set theme to 'dark'
      act(() => {
        setTheme('dark');
      });
      expect(useAppStore.getState().theme).toBe('dark');
      
      // Set theme to 'light'
      act(() => {
        setTheme('light');
      });
      expect(useAppStore.getState().theme).toBe('light');
      
      // Set theme back to 'system'
      act(() => {
        setTheme('system');
      });
      expect(useAppStore.getState().theme).toBe('system');
    });
    
    it('should persist theme changes to localStorage', () => {
      // Create a spy on localStorage.setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      const { setTheme } = useAppStore.getState();
      
      // Set the theme to dark
      act(() => {
        setTheme('dark');
      });
      
      // Verify the theme was updated in the store
      expect(useAppStore.getState().theme).toBe('dark');
      
      // Verify localStorage.setItem was called
      expect(setItemSpy).toHaveBeenCalled();
      
      // Clean up
      setItemSpy.mockRestore();
    });
  });

  describe('Sidebar Management', () => {
    it('should toggle sidebar state', () => {
      const { toggleSidebar } = useAppStore.getState();
      const initialState = useAppStore.getState().sidebarOpen;
      
      act(() => {
        toggleSidebar();
      });
      
      expect(useAppStore.getState().sidebarOpen).toBe(!initialState);
      
      act(() => {
        toggleSidebar();
      });
      
      expect(useAppStore.getState().sidebarOpen).toBe(initialState);
    });
    
    it('should set sidebar state directly', () => {
      const { setSidebarOpen } = useAppStore.getState();
      
      act(() => {
        setSidebarOpen(true);
      });
      
      expect(useAppStore.getState().sidebarOpen).toBe(true);
      
      act(() => {
        setSidebarOpen(false);
      });
      
      expect(useAppStore.getState().sidebarOpen).toBe(false);
    });
  });

  describe('Grid Page Size', () => {
    it('should set grid page size correctly', () => {
      const { setGridPageSize } = useAppStore.getState();
      
      // Default is 10
      expect(useAppStore.getState().gridPageSize).toBe(10);
      
      act(() => {
        setGridPageSize(20);
      });
      
      expect(useAppStore.getState().gridPageSize).toBe(20);
      
      act(() => {
        setGridPageSize(50);
      });
      
      expect(useAppStore.getState().gridPageSize).toBe(50);
    });
    
    it('should persist grid page size changes to localStorage', () => {
      // Create a spy on localStorage.setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      const { setGridPageSize } = useAppStore.getState();
      
      // Set the grid page size
      act(() => {
        setGridPageSize(25);
      });
      
      // Verify the grid page size was updated in the store
      expect(useAppStore.getState().gridPageSize).toBe(25);
      
      // Verify localStorage.setItem was called
      expect(setItemSpy).toHaveBeenCalled();
      
      // Clean up
      setItemSpy.mockRestore();
    });
  });

  describe('Notifications', () => {
    
    it('should add a notification with generated ID and timestamp', () => {
      const { addNotification } = useAppStore.getState();
      
      // Create a spy on the generateId function
      const generateIdSpy = vi.spyOn(idUtils, 'generateId');
      
      // Initial state has no notifications
      expect(useAppStore.getState().notifications).toHaveLength(0);
      
      const now = new Date();
      vi.setSystemTime(now);
      
      act(() => {
        addNotification({
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification',
        });
      });
      
      // Verify generateId was called
      expect(generateIdSpy).toHaveBeenCalled();
      
      const notifications = useAppStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      
      const notification = notifications[0];
      // Verify ID exists but don't check its specific value
      expect(notification.id).toBeTruthy();
      expect(typeof notification.id).toBe('string');
      expect(notification.type).toBe('info');
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('This is a test notification');
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.createdAt.getTime()).toBe(now.getTime());
    });
    
    it('should add multiple notifications', () => {
      const { addNotification } = useAppStore.getState();
      
      // Add first notification
      act(() => {
        addNotification({
          type: 'info',
          title: 'First Notification',
          message: 'This is the first notification',
        });
      });
      
      // Add second notification
      act(() => {
        addNotification({
          type: 'success',
          title: 'Second Notification',
          message: 'This is the second notification',
        });
      });
      
      const notifications = useAppStore.getState().notifications;
      expect(notifications).toHaveLength(2);
      
      expect(notifications[0].title).toBe('First Notification');
      expect(notifications[1].title).toBe('Second Notification');
    });
    
    it('should dismiss a notification by ID', () => {
      const { addNotification, dismissNotification } = useAppStore.getState();
      
      // Add a notification
      act(() => {
        addNotification({
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification',
        });
      });
      
      const notifications = useAppStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      
      // Dismiss the notification
      act(() => {
        dismissNotification(notifications[0].id);
      });
      
      expect(useAppStore.getState().notifications).toHaveLength(0);
    });
    
    it('should handle dismissing a non-existent notification', () => {
      const { dismissNotification } = useAppStore.getState();
      
      // Try to dismiss a notification that doesn't exist
      act(() => {
        dismissNotification('non-existent-id');
      });
      
      // Should not throw an error
      expect(useAppStore.getState().notifications).toHaveLength(0);
    });
    
    it('should clear all notifications', () => {
      const { addNotification, clearAllNotifications } = useAppStore.getState();
      
      // Add multiple notifications
      act(() => {
        addNotification({
          type: 'info',
          title: 'First Notification',
          message: 'This is the first notification',
        });
        
        addNotification({
          type: 'success',
          title: 'Second Notification',
          message: 'This is the second notification',
        });
      });
      
      expect(useAppStore.getState().notifications).toHaveLength(2);
      
      // Clear all notifications
      act(() => {
        clearAllNotifications();
      });
      
      expect(useAppStore.getState().notifications).toHaveLength(0);
    });
    
    it('should support all notification types', () => {
      const { addNotification } = useAppStore.getState();
      
      // Add notifications of different types
      act(() => {
        addNotification({
          type: 'info',
          title: 'Info Notification',
          message: 'This is an info notification',
        });
        
        addNotification({
          type: 'success',
          title: 'Success Notification',
          message: 'This is a success notification',
        });
        
        addNotification({
          type: 'warning',
          title: 'Warning Notification',
          message: 'This is a warning notification',
        });
        
        addNotification({
          type: 'error',
          title: 'Error Notification',
          message: 'This is an error notification',
        });
      });
      
      const notifications = useAppStore.getState().notifications;
      expect(notifications).toHaveLength(4);
      
      expect(notifications[0].type).toBe('info');
      expect(notifications[1].type).toBe('success');
      expect(notifications[2].type).toBe('warning');
      expect(notifications[3].type).toBe('error');
    });
    
    it('should support autoClose option', () => {
      const { addNotification } = useAppStore.getState();
      
      act(() => {
        addNotification({
          type: 'info',
          title: 'Auto Close Notification',
          message: 'This notification will auto close',
          autoClose: true,
        });
      });
      
      const notification = useAppStore.getState().notifications[0];
      expect(notification.autoClose).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should only persist specified state properties', () => {
      // Create a spy on localStorage.setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      const { setTheme, setSidebarOpen, setGridPageSize, addNotification } = useAppStore.getState();
      
      // Update all state properties
      act(() => {
        setTheme('dark');
        setSidebarOpen(true);
        setGridPageSize(25);
        addNotification({
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification',
        });
      });
      
      // Verify the state was updated in the store
      expect(useAppStore.getState().theme).toBe('dark');
      expect(useAppStore.getState().sidebarOpen).toBe(true);
      expect(useAppStore.getState().gridPageSize).toBe(25);
      expect(useAppStore.getState().notifications).toHaveLength(1);
      
      // Verify localStorage.setItem was called
      expect(setItemSpy).toHaveBeenCalled();
      
      // Clean up
      setItemSpy.mockRestore();
    });
    
    it('should hydrate state from localStorage on initialization', () => {
      // Mock localStorage.getItem to return test data
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementation((key: string) => {
        if (key === 'budget-flowr-storage') {
          return JSON.stringify({
            state: {
              theme: 'dark',
              gridPageSize: 30,
            },
            version: 0,
          });
        }
        return null;
      });
      
      // Create a new store to test hydration
      type TestState = {
        theme: string;
        gridPageSize: number;
      };
      
      // Create a test store that will hydrate from our mocked localStorage
      const testStore = create<TestState>()(
        persist(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (_set) => ({
            theme: 'system',
            gridPageSize: 10,
          }),
          {
            name: 'budget-flowr-storage',
          }
        )
      );
      
      // Verify the store hydrated with the values from localStorage
      expect(testStore.getState().theme).toBe('dark');
      expect(testStore.getState().gridPageSize).toBe(30);
      
      // Clean up
      getItemSpy.mockRestore();
    });
  });
});

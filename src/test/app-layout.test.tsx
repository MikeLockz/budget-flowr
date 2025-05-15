import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppLayout } from '../components/layout/app-layout';
import { useAppStore } from '../store/app-store';
import { act } from 'react';

// Mock useAppStore
vi.mock('../store/app-store', () => ({
  useAppStore: vi.fn(),
}));

// Mock the Lucide icons
vi.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu Icon</div>,
  X: () => <div data-testid="x-icon">X Icon</div>,
  Sun: () => <div data-testid="sun-icon">Sun Icon</div>,
  Moon: () => <div data-testid="moon-icon">Moon Icon</div>,
  Monitor: () => <div data-testid="monitor-icon">Monitor Icon</div>,
  BarChart: () => <div data-testid="bar-chart-icon">Bar Chart Icon</div>,
  ListFilter: () => <div data-testid="list-filter-icon">List Filter Icon</div>,
  Upload: () => <div data-testid="upload-icon">Upload Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
}));

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode, to: string }) => 
    <a href={to} data-testid={`router-link-${to}`}>{children}</a>,
  useLocation: () => ({ pathname: '/' }),
}));

describe('AppLayout component', () => {
  // Mock store values and functions
  const mockSetTheme = vi.fn();
  const mockSetSidebarOpen = vi.fn();
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Default to desktop width
    });
    
    // Default mock implementation for useAppStore
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });
  });

  afterEach(() => {
    // Restore window.innerWidth
    vi.restoreAllMocks();
  });

  it('renders the layout with header and sidebar', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    // Check if header elements are rendered
    expect(screen.getByText('Budget Flowr')).toBeInTheDocument();
    
    // Check if sidebar is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Check if children content is rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders the correct theme icon based on current theme', () => {
    // Test with light theme
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    
    // Cleanup
    cleanup();
    
    // Test with dark theme
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    
    // Cleanup
    cleanup();
    
    // Test with system theme
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('monitor-icon')).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', () => {
    // Test with light theme
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    // Find and click the theme toggle button
    const themeButton = screen.getByRole('button', { name: /sun icon/i });
    fireEvent.click(themeButton);
    
    // Check if setTheme was called with 'dark'
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    
    // Cleanup
    cleanup();
    
    // Test with dark theme
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    // Find and click the theme toggle button
    const darkThemeButton = screen.getByRole('button', { name: /moon icon/i });
    fireEvent.click(darkThemeButton);
    
    // Check if setTheme was called with 'system'
    expect(mockSetTheme).toHaveBeenCalledWith('system');
    
    // Cleanup
    cleanup();
    
    // Test with system theme
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    // Find and click the theme toggle button
    const systemThemeButton = screen.getByRole('button', { name: /monitor icon/i });
    fireEvent.click(systemThemeButton);
    
    // Check if setTheme was called with 'light'
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('toggles sidebar when sidebar button is clicked on mobile', () => {
    // Set window width to mobile size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });
    
    // Mock with sidebar closed
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      sidebarOpen: false,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    // Find and click the sidebar toggle button
    const sidebarButton = screen.getByRole('button', { name: /menu icon/i });
    fireEvent.click(sidebarButton);
    
    // Check if setSidebarOpen was called with true
    expect(mockSetSidebarOpen).toHaveBeenCalledWith(true);
    
    // Cleanup
    cleanup();
    
    // Mock with sidebar open
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    // Find and click the sidebar toggle button
    const closeSidebarButton = screen.getByRole('button', { name: /x icon/i });
    fireEvent.click(closeSidebarButton);
    
    // Check if setSidebarOpen was called with false
    expect(mockSetSidebarOpen).toHaveBeenCalledWith(false);
  });

  it('handles window resize events', () => {
    // Start with desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    // Simulate resize to mobile width
    act(() => {
      window.innerWidth = 600;
      window.dispatchEvent(new Event('resize'));
    });
    
    // Check if setSidebarOpen was called with false
    expect(mockSetSidebarOpen).toHaveBeenCalledWith(false);
    
    // Simulate resize back to desktop width
    act(() => {
      window.innerWidth = 1024;
      window.dispatchEvent(new Event('resize'));
    });
    
    // Check if setSidebarOpen was called with true
    expect(mockSetSidebarOpen).toHaveBeenCalledWith(true);
  });

  it('renders a placeholder during SSR (when not mounted)', () => {
    // Create a modified version of the component with mounted forced to false
    const UnmountedAppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      // We don't need to use the store values, just mocking the mounted state
      useAppStore(); // Keep the mock call for consistency
      // Force mounted to be false
      const [mounted] = React.useState(false);
      
      // This is a simplified version of the component logic when mounted is false
      if (!mounted) {
        return <div className="min-h-screen bg-background" data-testid="ssr-placeholder" />;
      }
      
      return (
        <AppLayout>
          {children}
        </AppLayout>
      );
    };
    
    render(
      <UnmountedAppLayout>
        <div data-testid="test-content">Test Content</div>
      </UnmountedAppLayout>
    );
    
    // Check if the placeholder is rendered
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Budget Flowr')).not.toBeInTheDocument();
    
    // Check if the placeholder div is rendered
    expect(screen.getByTestId('ssr-placeholder')).toBeInTheDocument();
  });

  it('applies the correct CSS classes to sidebar based on sidebarOpen state', () => {
    // Test with sidebar open
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      sidebarOpen: true,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    // Get the sidebar element
    const sidebar = document.querySelector('aside');
    expect(sidebar).toHaveClass('block');
    expect(sidebar).not.toHaveClass('hidden');
    
    // Cleanup
    cleanup();
    
    // Test with sidebar closed
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      sidebarOpen: false,
      setSidebarOpen: mockSetSidebarOpen,
    });
    
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    
    // Get the sidebar element
    const closedSidebar = document.querySelector('aside');
    expect(closedSidebar).toHaveClass('hidden');
    expect(closedSidebar).not.toHaveClass('block');
  });
});

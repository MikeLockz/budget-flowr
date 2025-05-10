import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AppLayout } from './components/layout/app-layout';
import { Dashboard } from './pages/dashboard';
import { useEffect } from 'react';
import { useAppStore } from './store/app-store';
import { FilterProvider } from './contexts/FilterContext';

function App() {
  const { theme } = useAppStore();

  // Apply theme class to the document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark');
    
    // Apply theme based on store or system preference
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </FilterProvider>
    </QueryClientProvider>
  );
}

export default App;

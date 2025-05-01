import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderApp } from '../lib/render-utils';
import { initializeDatabase } from '../lib/db-utils';
import { act } from 'react-dom/test-utils';

// Mock dependencies
vi.mock('../lib/render-utils', () => ({
  renderApp: vi.fn()
}));

vi.mock('../lib/db-utils', () => ({
  initializeDatabase: vi.fn().mockResolvedValue(true)
}));

vi.mock('../App', () => ({
  __esModule: true,
  default: 'MockedApp'
}));

vi.mock('../index.css', () => ({}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn()
  }))
}));

describe('main.tsx', () => {
  let rootElement: HTMLElement;
  
  beforeEach(() => {
    // Setup DOM root element
    rootElement = document.createElement('div');
    rootElement.setAttribute('id', 'root');
    document.body.appendChild(rootElement);
    
    // Clear mocks
    vi.clearAllMocks();
    
    // Mock document.getElementById to return our test element
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'root') return rootElement;
      return null;
    });
  });
  
  afterEach(() => {
    // Cleanup
    if (document.body.contains(rootElement)) {
      document.body.removeChild(rootElement);
    }
    vi.restoreAllMocks();
  });

  it('initializes the database before rendering the app', async () => {
    // Import main.tsx which should execute the code we want to test
    await act(async () => {
      await import('../main');
    });
    
    // Verify database initialization was called
    expect(initializeDatabase).toHaveBeenCalled();
    
    // Verify renderApp was called after database initialization
    expect(renderApp).toHaveBeenCalledWith('MockedApp', rootElement);
  });
});

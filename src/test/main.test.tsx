import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderApp } from '../lib/render-utils';

// Mock dependencies
vi.mock('../lib/render-utils', () => ({
  renderApp: vi.fn()
}));

vi.mock('../App', () => ({
  __esModule: true,
  default: 'MockedApp'
}));

vi.mock('../index.css', () => ({}));

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

  it('imports App and calls renderApp with correct arguments', async () => {
    // Import main.tsx which should execute the code we want to test
    await import('../main');
    
    // Verify renderApp was called with App and the root element
    expect(renderApp).toHaveBeenCalledWith('MockedApp', rootElement);
    expect(renderApp).toHaveBeenCalledTimes(1);
  });
});

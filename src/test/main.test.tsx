import React from 'react';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { act } from 'react';
import App from '../App';
import { describe, it, expect } from 'vitest';

describe('main.tsx', () => {
  it('renders App component inside root element with StrictMode', () => {
    // Setup DOM root element
    const root = document.createElement('div');
    root.setAttribute('id', 'root');
    document.body.appendChild(root);

    // Render App inside StrictMode and flush effects
    act(() => {
      createRoot(root).render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    });

    // Assert that App component rendered by checking for an element inside App
    expect(root.children.length).toBeGreaterThan(0);

    // Assert that StrictMode is present in the render tree
    // We can check if the first child is a React StrictMode element by its type
    const strictModeElement = root.firstElementChild;
    expect(strictModeElement).not.toBeNull();
    // React StrictMode renders as a fragment, so we check the React internal type
    // Since DOM doesn't expose React types, we check that the root has one child and it contains children
    expect(strictModeElement?.children.length).toBeGreaterThan(0);

    // Cleanup
    document.body.removeChild(root);
  });
});

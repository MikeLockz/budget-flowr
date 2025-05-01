import React, { StrictMode } from 'react'
import { createRoot, Root } from 'react-dom/client'

/**
 * Renders a React component inside StrictMode into the specified DOM element
 * @param Component The React component to render
 * @param rootElement The DOM element to render into
 * @returns The root instance from createRoot
 * @throws Error if rootElement is null
 */
export function renderApp(
  Component: React.ComponentType,
  rootElement: HTMLElement | null
): Root {
  if (!rootElement) {
    throw new Error('Root element not found')
  }
  
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <Component />
    </StrictMode>
  )
  
  return root
}

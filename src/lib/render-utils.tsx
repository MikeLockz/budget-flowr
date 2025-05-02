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
  rootElement: HTMLElement | null,
  existingRoot?: Root
): Root {
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  // If existingRoot is provided, use it
  if (existingRoot) {
    existingRoot.render(
      <StrictMode>
        <Component />
      </StrictMode>
    )
    return existingRoot
  }

  // Check if rootElement already has a root stored on it (React 18 does not expose this, so we store it ourselves)
  // We can store the root on the element using a Symbol property to avoid collisions
  const rootSymbol = Symbol.for('react.root')
  let root: Root | undefined = (rootElement as HTMLElement & { [key: symbol]: Root })[rootSymbol]

  if (!root) {
    root = createRoot(rootElement)
    ;(rootElement as HTMLElement & { [key: symbol]: Root })[rootSymbol] = root
  }

  root.render(
    <StrictMode>
      <Component />
    </StrictMode>
  )

  return root
}

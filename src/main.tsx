import './index.css'
import App from './App.tsx'
import { renderApp } from './lib/render-utils'
import { initializeDatabase } from './lib/db-utils'
import React from 'react'
import { createRoot } from 'react-dom/client'

// Initialize the database before rendering the app
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

const root = createRoot(rootElement)

// Show loading state
root.render(
  <React.StrictMode>
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Initializing Database...</h2>
        <p>Please wait while we set up the application.</p>
      </div>
    </div>
  </React.StrictMode>
)

// Initialize database and then render the app
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully')
    renderApp(App, rootElement, root)
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    // Show error state
    root.render(
      <React.StrictMode>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-600">
            <h2 className="text-xl font-semibold mb-2">Database Error</h2>
            <p>There was a problem initializing the application database.</p>
            <p className="mt-2 text-sm">{error.message}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </React.StrictMode>
    )
  })

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Budget Flowr is a personal finance management system built as a client-side web application. It uses a dual-view accounting approach that tracks both cash-based transactions and amortized expenses. The application is designed to handle transaction management, capital asset tracking, virtual sinking funds, and financial analysis.

## Key Commands

### Development
```bash
# Start development server
npm run dev

# Build the project
npm run build

# Preview the production build
npm run preview
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run a specific test file
npm test -- src/test/dashboard.test.tsx

# Run tests with coverage
npm run test:coverage
```

### Linting
```bash
# Lint the entire codebase
npm run lint
```

## Database Architecture

The application uses IndexedDB (via Dexie.js) for client-side storage with the following core entities:

- **Transactions**: Financial transactions with details like date, amount, category
- **Categories**: Transaction classification system
- **Accounts**: Financial accounts (checking, savings, credit cards)
- **Assets**: Capital assets for depreciation tracking
- **SinkingFunds**: Virtual funds for future expenses

Database migrations are handled automatically through Dexie's versioning system.

## Key Implementation Details

### Data Flow

1. **Transaction Import**:
   - CSV files are parsed via `parseCSV` in `src/lib/import/csv-parser.ts`
   - Field mapping is handled by services in `src/lib/import/field-mapping-service.ts`
   - Deduplication is performed by `src/lib/import/transaction-deduplication.ts`

2. **Data Access**:
   - Repository pattern is used for database access in `src/lib/repositories.ts`
   - Each entity has its own repository class extending `BaseRepository`

3. **UI Components**:
   - Dashboard visualizations use Apache ECharts via wrapper components
   - Transaction grids use AG Grid
   - UI components are built with Shadcn UI (based on Radix UI primitives)

### State Management

- **React Query** (`@tanstack/react-query`): Used for database interaction and caching
- **Zustand**: Used for UI state management
- **Context API**: Used for filter state in `src/contexts/FilterContext.tsx`

## Testing Strategy

- **Unit Tests**: Testing individual utility functions and hooks
- **Component Tests**: Testing React components in isolation
- **Mock Dependencies**:
  - `fake-indexeddb` mocks IndexedDB in tests
  - AG Grid and ECharts are mocked in `src/test/setup.ts`

## Project Structure

- `/src/components`: UI components organized by function
- `/src/lib`: Core functionality and utilities
- `/src/pages`: Main application pages
- `/src/contexts`: React contexts
- `/src/hooks`: Custom React hooks
- `/src/store`: Zustand stores
- `/src/test`: Test files and utilities
- `/project-docs`: Documentation on app architecture and implementation

## Common Development Workflows

### Adding a New Feature

1. Create necessary database schema updates in `src/lib/db.ts` if needed
2. Implement repository methods in `src/lib/repositories.ts`
3. Add UI components in the appropriate location under `/src/components`
4. Wire up components to data sources using hooks or context
5. Add tests for new functionality

### Debugging Tips

- Use browser dev tools to inspect IndexedDB content
- `console.log` statements are used in the dashboard component for debugging filter states
- Test failing database operations by checking IndexedDB version conflicts
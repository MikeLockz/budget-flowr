# Technical Context: Personal Finance Management System

## Technologies Used
- **Frontend Framework**: React.js with TypeScript for building a robust and type-safe UI.
- **Build Tool**: Vite for fast development and optimized builds.
- **Styling**: Tailwind CSS combined with Shadcn UI components for accessible and customizable UI.
- **State Management**: TanStack Query for server state management; Zustand optionally for UI state.
- **Data Grid**: AG Grid Community for advanced data grid features and large dataset handling.
- **Data Visualization**: Apache ECharts and React Calendar Timeline for charts and timeline visualizations.
- **Local Storage**: IndexedDB accessed via Dexie.js for offline-first data persistence.
- **CSV Parsing**: PapaParse for efficient CSV file parsing.
- **Testing**: Vitest for comprehensive unit and integration testing with full coverage of application components.
- **Linting and Formatting**: ESLint and Prettier for code quality and consistency.

## Development Setup
- Node.js environment with npm/yarn for package management.
- TypeScript configuration for strict typing and code safety.
- Continuous integration pipelines for automated testing and deployment.
- Local development server powered by Vite.
- Husky for pre-commit hooks to ensure code quality.

## Testing Strategy
- Unit tests for all utility functions and hooks.
- Component tests for UI elements and their interactions.
- Integration tests for data flow and business logic.
- Database migration tests to verify schema upgrades.
- Import pipeline tests for CSV parsing, field mapping, and transaction creation.
- Deduplication tests to verify duplicate detection and handling.
- Test utilities for mocking database and rendering components.
- Test coverage required for all new features and functionality.

## Technical Constraints
- Offline-first design requiring robust local data storage and synchronization.
- Handling of large datasets (up to 10,000+ records) efficiently.
- Support for dual-view accounting with complex financial calculations.
- Efficient duplicate detection for large transaction imports.
- Responsive design for desktop and mobile devices.
- Security considerations including local encryption of sensitive data.

## Dependencies
- React and React DOM
- Vite and related plugins
- Tailwind CSS and PostCSS
- Dexie.js for IndexedDB abstraction
- AG Grid Community
- Apache ECharts
- TanStack Query
- PapaParse for CSV parsing
- Zustand (optional)
- Vitest, ESLint, Prettier
- Husky for git hooks

## Tool Usage Patterns
- Modular component development with hooks and context.
- Reactive data fetching and caching with TanStack Query.
- IndexedDB transactions managed via Dexie with live queries.
- Compound indexes for optimized database queries.
- CSV parsing with header detection and field mapping.
- Use of UUIDs for entity identification to facilitate future backend sync.
- Automated testing integrated into CI/CD pipelines.

# System Patterns: Personal Finance Management System

## System Architecture
- Client-side focused architecture with offline-first design.
- Local data storage using IndexedDB (via Dexie.js) for performance and offline capabilities.
- Modular React component structure for UI, with separation of concerns.
- State management using TanStack Query for server state and optional Zustand for UI state.
- Data visualization components integrated with Apache ECharts and React Calendar Timeline.
- Data grid management with AG Grid Community for handling large datasets.

## Key Technical Decisions
- Use of dual-view accounting model: cash-based and amortized expense views.
- IndexedDB chosen for local persistence to support offline-first and large data volumes.
- React with TypeScript for type safety and maintainability.
- Tailwind CSS and Shadcn UI for styling and accessible components.
- Use of UUIDs for entity identifiers to support future backend synchronization.
- Separation of concerns between data management, UI rendering, and business logic.

## Design Patterns
- Repository pattern for data access abstraction over IndexedDB.
- Observer pattern via Dexie-react-hooks for reactive UI updates.
- Command pattern for transaction management and undo/redo capabilities.
- Factory pattern for creating financial entities and reports.
- Strategy pattern for depreciation calculation methods.
- Test-driven development pattern for new features and functionality.

## Testing Patterns
- Unit tests for isolated functionality in utility functions and hooks.
- Component tests for UI rendering and interactions.
- Integration tests for data flow and business logic.
- Mock repositories and test utilities for consistent testing environment.
- Test coverage tracking to ensure comprehensive test coverage.

## Component Relationships
- Core data entities: User, Account, Transaction, Category, CapitalAsset, SinkingFund.
- UI components organized by feature areas: Transactions, Assets, Funds, Reports, Settings.
- Data flow managed through hooks and context providers.
- Integration points for import/export and backup modules.

## Critical Implementation Paths
- Transaction import, review, and categorization workflow.
- Capital asset lifecycle management including depreciation and maintenance.
- Virtual sinking fund creation and contribution tracking.
- Dual-view accounting engine for financial reporting.
- Offline data synchronization and backup mechanisms.

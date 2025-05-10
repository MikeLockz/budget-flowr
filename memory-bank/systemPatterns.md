# System Patterns: Personal Finance Management System

## System Architecture
- Client-side focused architecture with offline-first design.
- Local data storage using IndexedDB (via Dexie.js) for performance and offline capabilities.
- Modular React component structure for UI, with separation of concerns.
- State management using TanStack Query for server state and optional Zustand for UI state.
- Data visualization components integrated with Apache ECharts and React Calendar Timeline.
- Data grid management with AG Grid Community for handling large datasets.
- Import pipeline with modular components for CSV parsing, field mapping, preview, and import.

## Key Technical Decisions
- Use of dual-view accounting model: cash-based and amortized expense views.
- IndexedDB chosen for local persistence to support offline-first and large data volumes.
- React with TypeScript for type safety and maintainability.
- Tailwind CSS and Shadcn UI for styling and accessible components.
- Use of UUIDs for entity identifiers to support future backend synchronization.
- Separation of concerns between data management, UI rendering, and business logic.
- Compound indexes for efficient querying and duplicate detection.
- Multiple transaction types to support dual-view accounting concepts.
- Import session tracking for user feedback and history.

## Design Patterns
- Repository pattern for data access abstraction over IndexedDB.
- Observer pattern via Dexie-react-hooks for reactive UI updates.
- Command pattern for transaction management and undo/redo capabilities.
- Factory pattern for creating financial entities and reports.
- Strategy pattern for depreciation calculation methods.
- Migration pattern for database schema evolution and data transformation.
- Pipeline pattern for transaction import workflow.
- Adapter pattern for field mapping between CSV data and application entities.
- Type guard pattern for ensuring type safety with union types.
- Test-driven development pattern for new features and functionality.

## Database Versioning Patterns
- Explicit schema versioning with Dexie.js version() method.
- Incremental schema upgrades with version-specific migration logic.
- Dedicated migration functions for type-safe data transformations.
- Entity validation to ensure data integrity after migrations.
- Database utilities for initialization, version detection, and validation.
- Compound indexes for optimized querying patterns.
- Error handling and user feedback during database operations.
- Isolated test databases for testing schema upgrades and migrations.

## Testing Patterns
- Unit tests for isolated functionality in utility functions and hooks.
- Component tests for UI rendering and interactions.
- Integration tests for data flow and business logic.
- Database migration tests to verify schema upgrades and data transformations.
- Mock repositories and test utilities for consistent testing environment.
- Test coverage tracking to ensure comprehensive test coverage.
- Specific tests for import pipeline components.
- Deduplication testing to verify duplicate detection and handling.

## Component Relationships
- Core data entities: User, Account, Transaction, Category, CapitalAsset, SinkingFund, FieldMapping, ImportSession.
- UI components organized by feature areas: Transactions, Assets, Funds, Reports, Settings.
- Import pipeline components: CSVUpload, FieldMappingUI, TransactionPreview.
- Data flow managed through hooks and context providers.
- Integration points for import/export and backup modules.

## Critical Implementation Paths
- Transaction import, review, and categorization workflow:
  - CSV parsing and field mapping
  - Transaction preview and validation
  - Duplicate detection and handling
  - Import session tracking
- Capital asset lifecycle management including depreciation and maintenance.
- Virtual sinking fund creation and contribution tracking.
- Dual-view accounting engine for financial reporting.
- Offline data synchronization and backup mechanisms.

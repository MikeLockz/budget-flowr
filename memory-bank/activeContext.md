# Active Context: Personal Finance Management System

## Current Work Focus
- Implementing transaction import, categorization, and dual-view accounting features.
- Enhancing UI components for transaction management, including CSV upload, field mapping, and transaction preview.
- Developing capital asset tracking and depreciation functionality.
- Building and refining the dashboard for financial overview and insights, including charts for income vs expenses, category breakdown, and spending distribution.
- Ensuring comprehensive test coverage for all application components.
- Updating memory bank documentation to reflect current state and decisions.
- Managing database schema evolution, currently at version 4 with the addition of compound indexes for duplicate detection and imports table.
- Implementing transaction deduplication functionality to handle duplicate imports.

## Recent Changes
- Implemented versioned schema upgrades with migration logic in Dexie.js, now at version 4.
- Added fieldMappings table to support import field mapping functionality.
- Added compound index [date+amount+description] for efficient duplicate transaction detection.
- Added imports table to track import sessions and their results.
- Created database utilities for initialization, version detection, and validation.
- Added migration functions for handling data transformations between versions.
- Implemented comprehensive tests for database versioning and migrations.
- Updated application initialization to handle database setup before rendering.
- Added schema version 2 with accountId field for transactions.
- Developed CSV parsing and field mapping services for transaction import.
- Created UI components for CSV upload, field mapping, and transaction preview.
- Implemented import service to process and save imported transactions.
- Added transaction deduplication functionality to detect, remove, and merge duplicate transactions.
- Enhanced transaction mapper to support additional transaction types (Capital Transfer, Capital Inflow, True Expense, etc.).
- Began development of dashboard components for financial reporting, including summary cards and charts.
- Integrated transaction hooks for data fetching and manipulation.

## Next Steps
- Complete transaction import and categorization features.
- Refine transaction deduplication functionality with improved user interface for managing duplicates.
- Develop capital asset tracking and depreciation functionality.
- Create virtual sinking funds management.
- Build dual-view accounting engine for financial reporting.
- Continue enhancing dashboard features and UI/UX.
- Maintain and expand test coverage for all new features.

## Active Decisions
- Use versioned schema upgrades in Dexie.js to manage database evolution.
- Implement explicit migration functions for data transformations between versions.
- Validate data integrity after migrations to ensure consistency.
- Initialize database before rendering the application UI.
- Show appropriate loading and error states during database initialization.
- Require test coverage for all new features and functionality.
- Modularize transaction import functionality into parsing, mapping, preview, and import services.
- Use compound indexes for efficient duplicate detection during transaction import.
- Track import sessions to provide users with import history and statistics.
- Support multiple transaction types to enable dual-view accounting.
- Use React components with hooks for UI state and data management.

## Important Patterns
- Versioned database schema management with explicit upgrade functions.
- Type-safe data migration with validation.
- Database initialization with proper error handling.
- Repository pattern for data access abstraction.
- Reactive UI updates with Dexie-react-hooks.
- Test-driven development for new features.
- Modular import pipeline separating parsing, mapping, preview, and import steps.
- Compound indexes for efficient data querying.
- Deduplication strategies for maintaining data integrity.
- Component-driven UI with clear separation of concerns.

## Learnings and Insights
- Versioned schema upgrades provide a structured approach to database evolution.
- Explicit migration functions make data transformations clear and testable.
- Proper error handling during database initialization improves user experience.
- Type guards help ensure type safety when working with union types.
- Compound indexes significantly improve query performance for specific operations.
- Deduplication is a critical aspect of data import functionality to maintain data integrity.
- Supporting multiple transaction types enables more sophisticated financial analysis.
- Comprehensive test coverage for database operations is essential for reliability.
- Modular import pipeline improves maintainability and testability.
- Dashboard development benefits from reusable chart and grid components.
- Memory bank updates are critical to maintain project continuity.

# Active Context: Personal Finance Management System

## Current Work Focus
- Implementing transaction import, categorization, and dual-view accounting features.
- Enhancing UI components for transaction management, including CSV upload, field mapping, and transaction preview.
- Developing capital asset tracking and depreciation functionality.
- Building and refining the dashboard for financial overview and insights, including charts for income vs expenses, category breakdown, and spending distribution.
- Ensuring comprehensive test coverage for all application components.
- Updating memory bank documentation to reflect current state and decisions.
- Managing database schema evolution, currently at version 3 with the addition of the fieldMappings table.

## Recent Changes
- Implemented versioned schema upgrades with migration logic in Dexie.js, now at version 3.
- Added fieldMappings table to support import field mapping functionality.
- Created database utilities for initialization, version detection, and validation.
- Added migration functions for handling data transformations between versions.
- Implemented comprehensive tests for database versioning and migrations.
- Updated application initialization to handle database setup before rendering.
- Added schema version 2 with accountId field for transactions.
- Developed CSV parsing and field mapping services for transaction import.
- Created UI components for CSV upload, field mapping, and transaction preview.
- Implemented import service to process and save imported transactions.
- Began development of dashboard components for financial reporting, including summary cards and charts.
- Integrated transaction hooks for data fetching and manipulation.

## Next Steps
- Complete transaction import and categorization features.
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
- Use React components with hooks for UI state and data management.

## Important Patterns
- Versioned database schema management with explicit upgrade functions.
- Type-safe data migration with validation.
- Database initialization with proper error handling.
- Repository pattern for data access abstraction.
- Reactive UI updates with Dexie-react-hooks.
- Test-driven development for new features.
- Modular import pipeline separating parsing, mapping, preview, and import steps.
- Component-driven UI with clear separation of concerns.

## Learnings and Insights
- Versioned schema upgrades provide a structured approach to database evolution.
- Explicit migration functions make data transformations clear and testable.
- Proper error handling during database initialization improves user experience.
- Type guards help ensure type safety when working with union types.
- Comprehensive test coverage for database operations is essential for reliability.
- Modular import pipeline improves maintainability and testability.
- Dashboard development benefits from reusable chart and grid components.
- Memory bank updates are critical to maintain project continuity.

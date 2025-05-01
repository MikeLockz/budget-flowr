# Active Context: Personal Finance Management System

## Current Work Focus
- Implementing proper version upgrade strategy for Dexie.js database schema.
- Planning schema versioning and data migration to avoid primary key conflicts.
- Ensuring comprehensive test coverage for all application components.
- Updating memory bank documentation to reflect current state and decisions.

## Recent Changes
- Created Dexie.js database schema with core entities and auto-incrementing primary keys.
- Implemented repository pattern for data access abstraction.
- Updated transaction hooks to use Dexie.js for local data persistence.
- Identified and addressed database upgrade errors related to primary key changes.
- Added comprehensive test coverage for all existing application code.

## Next Steps
- Implement versioned schema upgrades with migration logic in Dexie.js.
- Test database initialization and upgrade flows.
- Continue development of transaction import, categorization, and dual-view accounting features.
- Ensure all new features and functionality include test coverage as they are developed.
- Maintain updated documentation in memory bank files.

## Active Decisions
- Adopt versioned schema upgrades in Dexie.js to manage database evolution.
- Use auto-incrementing primary keys consistently across all tables.
- Implement upgrade functions to handle data migration between versions.
- Require test coverage for all new features and functionality.

## Important Patterns
- Versioned database schema management.
- Data migration via Dexie.js upgrade functions.
- Repository pattern for data access.
- Reactive UI updates with Dexie-react-hooks.
- Test-driven development for new features.

## Learnings and Insights
- Changing primary key definitions requires careful version management.
- Early planning of database versioning prevents data loss and errors.
- Comprehensive test coverage improves code quality and reduces regressions.
- Memory bank updates are critical to maintain project continuity.

# Technology Stack

## Language & Runtime
- TypeScript/JavaScript (Node.js)

## Testing Framework
- Jest or Vitest for unit and integration tests
- fast-check for property-based testing
  - Minimum 100 iterations per property test
  - Each property test must reference the corresponding correctness property from design.md

## Architecture Pattern
- Functional pipeline architecture with clear separation of concerns
- Pure functions for calculations and transformations
- Immutable data structures

## Key Dependencies
- fast-check: Property-based testing library

## Common Commands

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run property-based tests only
npm test -- property

# Run with coverage
npm test -- --coverage
```

### Development
```bash
# Install dependencies
npm install

# Type checking
npm run type-check

# Linting
npm run lint
```

## Testing Standards

### Property-Based Tests
- Tag each property test with a comment: `// Feature: transfer-routing-algorithm, Property X: [description]`
- Use smart generators for realistic test data (accounts, transfer matrices, goals, dates)
- Test all 33 correctness properties defined in design.md

### Unit Tests
- Cover specific examples, edge cases, and error conditions
- Test business day logic thoroughly (weekends, month boundaries)
- Validate error handling (past deadline, insufficient funds, no path)


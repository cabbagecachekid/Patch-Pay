# Project Structure

## Specs Directory
`.kiro/specs/` - Contains feature specifications using the spec framework

Each spec includes:
- `requirements.md` - User stories and acceptance criteria
- `design.md` - Architecture, data models, correctness properties, and testing strategy
- `tasks.md` - Implementation plan with checkboxes

### Active Specs
- `transfer-routing-algorithm/` - Money transfer routing optimization system

## Steering Directory
`.kiro/steering/` - AI assistant guidance documents (always included in context)

## Architecture Organization

The codebase follows a functional pipeline architecture:

```
Input Validation → Path Discovery → Route Generation → 
Cost Calculation → Risk Assessment → Route Categorization → Output Formatting
```

### Recommended Code Organization
```
src/
  types/           # Core interfaces and enums
  validation/      # Input validation functions
  balance/         # Available balance calculations
  time/            # Business day and timing utilities
  paths/           # Path discovery and graph traversal
  combinations/    # Source account combination generation
  routes/          # Route building and construction
  costs/           # Fee calculation and normalization
  risk/            # Risk assessment (timing, reliability, complexity)
  categorization/  # Route selection (cheapest, fastest, recommended)
  errors/          # Error handling and types
  index.ts         # Main calculateOptimalRoutes function

tests/
  unit/            # Unit tests for specific scenarios
  property/        # Property-based tests (fast-check)
  integration/     # End-to-end tests
```

## Key Principles

- **Separation of Concerns**: Each component has a single, well-defined responsibility
- **Testability**: Pure functions enable easy unit and property testing
- **Immutability**: Data structures are not mutated; transformations create new objects
- **Error Handling**: Fail fast with clear error messages; no partial results on errors

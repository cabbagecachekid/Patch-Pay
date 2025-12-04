# Design Document

## Overview

The Transfer Routing Algorithm system is a financial optimization engine that calculates optimal money transfer routes from multiple source accounts to a target account. The system evaluates all possible transfer combinations and ranks them across three dimensions: cost (total fees), speed (arrival time), and risk (timing, reliability, and complexity factors). The system returns three categorized routes—cheapest, fastest, and recommended—allowing users to make informed decisions based on their priorities.

The system handles complex scenarios including multi-hop transfers, weekend/business day calculations, pending transaction considerations, and various edge cases such as insufficient funds or missing transfer paths.

## Architecture

The system follows a functional pipeline architecture with clear separation of concerns:

```
Input Validation → Path Discovery → Route Generation → Cost Calculation → Risk Assessment → Route Categorization → Output Formatting
```

### High-Level Components

1. **Input Validator**: Validates goal parameters, accounts, and transfer matrix
2. **Path Finder**: Discovers all valid transfer paths from sources to target
3. **Combination Generator**: Creates all valid source account combinations that meet the goal amount
4. **Route Builder**: Constructs complete routes with transfer steps
5. **Cost Calculator**: Computes total fees and normalized costs
6. **Time Estimator**: Calculates arrival times considering business days and transfer speeds
7. **Risk Assessor**: Evaluates timing, reliability, and complexity risks
8. **Route Categorizer**: Selects cheapest, fastest, and recommended routes
9. **Output Formatter**: Structures the final response with detailed route information

## Components and Interfaces

### Core Types

```typescript
interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  pendingTransactions: Transaction[];
  institutionType: "traditional_bank" | "neobank";
  metadata: {
    lastUpdated: Date;
    isActive: boolean;
  };
}

enum AccountType {
  CHECKING = "checking",
  SAVINGS = "savings",
  CASH_APP = "cash_app",
  VENMO = "venmo",
  PAYPAL = "paypal",
  OTHER = "other"
}

interface Transaction {
  id: string;
  accountId: string;
  amount: number; // Negative for debits, positive for credits
  date: Date;
  status: TransactionStatus;
  description: string;
  category?: string;
}

enum TransactionStatus {
  PENDING = "pending",
  CLEARED = "cleared",
  FAILED = "failed"
}

interface TransferRelationship {
  fromAccountId: string;
  toAccountId: string;
  speed: TransferSpeed;
  fee: number | null; // null = free, number = fixed fee in dollars
  isAvailable: boolean;
}

enum TransferSpeed {
  INSTANT = "instant",
  SAME_DAY = "same_day",
  ONE_DAY = "1_day",
  THREE_DAY = "3_day"
}

interface Goal {
  targetAccountId: string;
  amount: number;
  deadline: Date;
}

interface Route {
  category: "cheapest" | "fastest" | "recommended";
  steps: TransferStep[];
  totalFees: number;
  estimatedArrival: Date;
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  reasoning: string;
}

interface TransferStep {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  method: TransferSpeed;
  fee: number;
  estimatedArrival: Date;
}

interface RoutingResult {
  routes: Route[];
  allRoutesRisky?: boolean;
}

interface RoutingError {
  error: "insufficient_funds" | "no_path" | "past_deadline";
  message: string;
  shortfall?: number;
  suggestion?: string;
}
```

### Main Function Interface

```typescript
function calculateOptimalRoutes(
  goal: Goal,
  accounts: Account[],
  transferMatrix: TransferRelationship[]
): RoutingResult | RoutingError
```

### Component Interfaces

```typescript
// Input Validation
function validateInputs(
  goal: Goal,
  accounts: Account[],
  transferMatrix: TransferRelationship[]
): ValidationResult

// Available Balance Calculation
function calculateAvailableBalance(account: Account): number

// Path Discovery
function findAllPathsToTarget(
  targetAccountId: string,
  transferMatrix: TransferRelationship[]
): Map<string, TransferRelationship[]>

// Combination Generation
function generateValidCombinations(
  accounts: Account[],
  goalAmount: number,
  pathsToTarget: Map<string, TransferRelationship[]>
): AccountCombination[]

// Route Building
function buildRoute(
  combination: AccountCombination,
  pathsToTarget: Map<string, TransferRelationship[]>,
  goalAmount: number,
  currentTime: Date
): Route

// Time Estimation
function estimateArrivalTime(
  transferSpeed: TransferSpeed,
  initiationTime: Date
): Date

function isBusinessDay(date: Date): boolean

function addBusinessDays(startDate: Date, days: number): Date

// Cost Calculation
function calculateTotalFees(steps: TransferStep[]): number

function normalizeCosts(routes: Route[]): Map<Route, number>

// Risk Assessment
function calculateRiskScore(
  route: Route,
  deadline: Date
): { score: number; timing: number; reliability: number; complexity: number }

function classifyRiskLevel(riskScore: number): "low" | "medium" | "high"

// Route Categorization
function selectCheapestRoute(routes: Route[]): Route

function selectFastestRoute(routes: Route[]): Route

function selectRecommendedRoute(
  routes: Route[],
  deadline: Date
): Route
```

## Data Models

### Available Balance Calculation

```typescript
availableBalance = account.balance - sum(pendingDebits)
```

Where `pendingDebits` are transactions with negative amounts and status = PENDING.

### Transfer Path Representation

A transfer path is represented as a sequence of transfer relationships from a source account to the target account. For direct transfers, the path contains a single relationship. For multi-hop transfers, the path contains multiple relationships.

```typescript
interface TransferPath {
  sourceAccountId: string;
  targetAccountId: string;
  hops: TransferRelationship[];
  totalSteps: number;
}
```

### Route Scoring Model

The recommended route uses a weighted scoring formula:

```typescript
score = (100 - normalizedCost) * 0.4 + (100 - normalizedTime) * 0.3 + (100 - riskScore) * 0.3
```

Where:
- `normalizedCost = (totalFees / maxFeesInAllRoutes) * 100`
- `normalizedTime = (arrivalDelay / maxDelayInAllRoutes) * 100`
- `arrivalDelay = estimatedArrival - currentTime`

### Risk Score Model

```typescript
riskScore = (timingRisk * 0.5) + (reliabilityRisk * 0.3) + (complexityRisk * 0.2)
```

**Timing Risk:**
- Buffer > 48 hours: 0
- Buffer 24-48 hours: 20
- Buffer 6-24 hours: 50
- Buffer < 6 hours: 80
- After deadline: 100

**Reliability Risk:**
- All instant: 0
- Mix of instant and ACH: 30
- All ACH: 50

**Complexity Risk:**
- 1 step: 0
- 2-3 steps: 20
- 4+ steps: 40

## Correc
tness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Available balance calculation
*For any* account with pending transactions, the available balance should equal the account balance minus the sum of all pending debit amounts.
**Validates: Requirements 1.3**

### Property 2: Source account identification
*For any* set of accounts, the system should identify exactly those accounts with available balance greater than zero as valid source accounts.
**Validates: Requirements 1.2**

### Property 3: Combination completeness
*For any* set of source accounts and goal amount, all generated combinations should sum to at least the goal amount, and no valid combination should be missing.
**Validates: Requirements 2.1**

### Property 4: Pending transaction exclusion
*For any* account combination, funds locked in pending transactions should never be included in the available amount for transfers.
**Validates: Requirements 2.2**

### Property 5: Transfer matrix compliance
*For any* generated route, all transfer steps should use only relationships defined in the transfer matrix.
**Validates: Requirements 2.3**

### Property 6: Path discovery completeness
*For any* transfer matrix with multiple paths to the target account, the system should discover and evaluate all possible paths.
**Validates: Requirements 2.4**

### Property 7: Balance sufficiency
*For any* generated combination, all included source accounts should have sufficient available balance for their portion of the transfer.
**Validates: Requirements 2.5**

### Property 8: Fee calculation accuracy
*For any* route, the totalFees should equal the sum of all individual step fees, treating null fees as zero.
**Validates: Requirements 3.1, 3.2, 7.3**

### Property 9: Cost normalization
*For any* set of routes, normalized costs should be calculated as (totalFees / maxFeesInAllRoutes) * 100.
**Validates: Requirements 3.3**

### Property 10: Cheapest route selection
*For any* set of routes, the cheapest route should have totalFees less than or equal to all other routes.
**Validates: Requirements 3.4**

### Property 11: Instant transfer timing
*For any* transfer using instant method, the estimated arrival should be current time plus 5 minutes.
**Validates: Requirements 4.1**

### Property 12: Same-day transfer timing (business hours)
*For any* same-day transfer initiated before 5pm EST on a business day, the estimated arrival should be end of current business day.
**Validates: Requirements 4.2**

### Property 13: Same-day transfer timing (after hours)
*For any* same-day transfer initiated after 5pm EST or on a weekend, the estimated arrival should be end of next business day.
**Validates: Requirements 4.3**

### Property 14: One-day ACH timing (weekday)
*For any* 1-day transfer initiated Monday through Thursday before 5pm EST, the estimated arrival should be the next business day.
**Validates: Requirements 4.4**

### Property 15: One-day ACH timing (weekend)
*For any* 1-day transfer initiated Friday through Sunday, the estimated arrival should be Tuesday.
**Validates: Requirements 4.5, 9.3**

### Property 16: Three-day ACH timing
*For any* 3-day transfer, the estimated arrival should be exactly 3 business days after initiation, skipping weekends.
**Validates: Requirements 4.6**

### Property 17: Route arrival time calculation
*For any* route with multiple steps, the route's estimated arrival should equal the latest (maximum) completion time among all steps.
**Validates: Requirements 4.7, 7.4**

### Property 18: Fastest route selection
*For any* set of routes, the fastest route should have estimated arrival time less than or equal to all other routes.
**Validates: Requirements 4.8**

### Property 19: Risk score calculation
*For any* route, the risk score should equal (timingRisk * 0.5) + (reliabilityRisk * 0.3) + (complexityRisk * 0.2), where each component is calculated according to the specified rules.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 20: Timing risk calculation
*For any* route and deadline, timing risk should be: 0 if buffer > 48hrs, 20 if 24-48hrs, 50 if 6-24hrs, 80 if < 6hrs, 100 if after deadline.
**Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8**

### Property 21: Reliability risk calculation
*For any* route, reliability risk should be: 0 if all instant, 30 if mixed methods, 50 if all ACH.
**Validates: Requirements 5.9, 5.10, 5.11**

### Property 22: Complexity risk calculation
*For any* route, complexity risk should be: 0 if 1 step, 20 if 2-3 steps, 40 if 4+ steps.
**Validates: Requirements 5.12, 5.13, 5.14**

### Property 23: Risk level classification
*For any* route, risk level should be: "low" if score 0-30, "medium" if 31-60, "high" if 61-100.
**Validates: Requirements 5.15, 5.16, 5.17**

### Property 24: Three route categories
*For any* valid routing request, the system should return exactly three routes with categories: cheapest, fastest, and recommended.
**Validates: Requirements 6.1**

### Property 25: Recommended route scoring
*For any* set of routes, the recommended route should have the highest score calculated as: (100 - normalizedCost) * 0.4 + (100 - normalizedTime) * 0.3 + (100 - riskScore) * 0.3.
**Validates: Requirements 6.2, 6.3, 6.4, 6.5**

### Property 26: High risk warning
*For any* routing result where all routes have risk scores exceeding 70, the response should include allRoutesRisky flag set to true and still return all three routes.
**Validates: Requirements 6.6, 6.7**

### Property 27: Route step completeness
*For any* returned route, all transfer steps should be included in sequence with complete information (fromAccountId, toAccountId, amount, method, fee, estimatedArrival).
**Validates: Requirements 7.1, 7.2**

### Property 28: Route metadata completeness
*For any* returned route, the route should include riskLevel, riskScore, and a non-empty reasoning string.
**Validates: Requirements 7.5, 7.6**

### Property 29: Insufficient funds error
*For any* request where total available funds are less than the goal amount, the system should return an error with code "insufficient_funds" and the calculated shortfall, with no route options.
**Validates: Requirements 1.4, 8.2, 8.5**

### Property 30: Error excludes routes
*For any* error response (past_deadline, insufficient_funds, no_path), the response should not include any route options.
**Validates: Requirements 8.5**

### Property 31: Business day classification
*For any* date, the system should classify Monday through Friday as business days and Saturday through Sunday as non-business days.
**Validates: Requirements 9.1, 9.2**

### Property 32: Instant transfer weekend availability
*For any* instant transfer initiated on a weekend, the transfer should complete normally (within 5 minutes) without delay to Monday.
**Validates: Requirements 9.4**

### Property 33: No negative balances
*For any* generated route, when all transfers are executed in sequence, no account balance should become negative at any point.
**Validates: Requirements 9.5**

## Error Handling

The system handles three primary error categories:

### 1. Past Deadline Error
- **Trigger**: `goal.deadline < currentTime`
- **Response**: `{ error: "past_deadline", message: "Deadline has already passed" }`
- **Validation**: Input validation phase, before any route calculation

### 2. Insufficient Funds Error
- **Trigger**: `sum(availableBalances) < goal.amount`
- **Response**: `{ error: "insufficient_funds", shortfall: goal.amount - sum(availableBalances) }`
- **Validation**: After calculating available balances, before combination generation

### 3. No Path Error
- **Trigger**: No transfer relationships lead to target account
- **Response**: `{ error: "no_path", suggestion: intermediateAccountId | undefined }`
- **Validation**: After path discovery phase
- **Enhancement**: If an intermediate account exists that connects to both sources and target, suggest it

### Error Handling Principles
- Fail fast: Validate inputs before expensive computations
- Clear messages: Provide actionable error information
- No partial results: Errors never include route options
- Graceful degradation: High-risk routes are returned with warnings rather than errors

## Testing Strategy

The Transfer Routing Algorithm will use a dual testing approach combining unit tests for specific scenarios and property-based tests for universal correctness guarantees.

### Unit Testing Approach

Unit tests will cover:

1. **Specific Examples**
   - Simple case: 1 source account, direct transfer to target
   - Complex case: 3 source accounts, multiple paths, mixed transfer speeds
   - Exact amount case: Goal amount exactly matches available balance

2. **Edge Cases**
   - Weekend deadline with ACH transfers
   - Friday afternoon initiation (crosses weekend)
   - All routes exceed risk threshold (allRoutesRisky flag)
   - Null fees in transfer relationships

3. **Error Conditions**
   - Past deadline rejection
   - Insufficient funds with shortfall calculation
   - No path to target account
   - Invalid account IDs

4. **Business Day Logic**
   - Weekend ACH delays
   - Business day counting across month boundaries
   - Holiday handling (if implemented)

### Property-Based Testing Approach

**Testing Framework**: We will use **fast-check** for TypeScript/JavaScript property-based testing.

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test will include a comment explicitly referencing the correctness property from this design document using the format:
```typescript
// Feature: transfer-routing-algorithm, Property X: [property description]
```

**Property Test Coverage**:

Each of the 33 correctness properties listed above will be implemented as a property-based test. The tests will use smart generators that:

1. **Account Generators**
   - Generate accounts with realistic balances ($0 - $10,000)
   - Include pending transactions (0-5 per account)
   - Mix account types (checking, savings, cash apps)
   - Ensure some accounts have zero or negative available balance

2. **Transfer Matrix Generators**
   - Generate connected graphs (ensure paths exist)
   - Generate disconnected graphs (test no-path errors)
   - Mix transfer speeds (instant, same-day, 1-day, 3-day)
   - Include null and non-null fees
   - Create multi-hop scenarios

3. **Goal Generators**
   - Generate amounts within and exceeding available funds
   - Generate deadlines in past, near future, and far future
   - Generate deadlines on weekdays and weekends
   - Create tight deadline scenarios (< 6 hour buffer)

4. **Date/Time Generators**
   - Generate dates across weekdays and weekends
   - Generate times before and after 5pm EST cutoff
   - Generate dates that span month/year boundaries

**Key Property Tests**:

- **Calculation Properties** (1, 8, 9, 17, 19-23): Verify mathematical correctness of formulas
- **Selection Properties** (10, 18, 25): Verify optimal route selection logic
- **Timing Properties** (11-16): Verify business day and transfer speed calculations
- **Completeness Properties** (3, 6, 24, 27, 28): Verify no missing data or routes
- **Constraint Properties** (4, 5, 7, 33): Verify business rules are enforced
- **Error Properties** (29, 30): Verify error handling and mutual exclusivity with routes

### Integration Testing

Integration tests will verify:
- End-to-end flow from input validation through route categorization
- Interaction between path discovery and route building
- Consistency between risk calculation and route selection
- Proper error propagation through the pipeline

### Test Data Strategy

- Use realistic financial amounts and account structures
- Test with various graph topologies (linear, branching, cyclic)
- Include edge cases in both unit and property tests
- Maintain a suite of regression test cases for discovered bugs

## Implementation Notes

### Performance Considerations

1. **Combination Generation**: For N source accounts, the number of combinations can be 2^N. Implement pruning strategies:
   - Early termination when combination exceeds goal amount
   - Skip accounts with zero available balance
   - Limit maximum combination size (e.g., max 5 accounts per route)

2. **Path Finding**: Use memoization to cache discovered paths between account pairs

3. **Route Evaluation**: Calculate risk scores and costs in parallel where possible

### Business Day Calculation

Implement a robust business day calculator that:
- Handles weekend detection
- Accounts for time zones (EST for cutoff times)
- Can be extended to support holidays
- Efficiently adds N business days to a date

### Extensibility

The design supports future enhancements:
- Holiday calendars for more accurate business day calculations
- Dynamic fee structures (percentage-based fees)
- Multi-currency support
- Transfer limits and daily caps
- Account-specific transfer restrictions
- Optimization for specific user preferences (e.g., "minimize steps")


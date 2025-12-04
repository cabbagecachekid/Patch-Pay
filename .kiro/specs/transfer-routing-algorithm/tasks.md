# Implementation Plan

- [x] 1. Set up project structure and core types
  - Create TypeScript project with package.json (dependencies: typescript, vitest, fast-check, @types/node)
  - Configure TypeScript (tsconfig.json) with strict mode
  - Set up Vitest configuration (vitest.config.ts)
  - Create src/ directory structure (types/, validation/, balance/, time/, paths/, combinations/, routes/, costs/, risk/, categorization/, errors/)
  - Define all core interfaces and types in src/types/index.ts (Account, Transaction, TransferRelationship, Goal, Route, TransferStep, etc.)
  - Define enums (AccountType, TransactionStatus, TransferSpeed)
  - _Requirements: All_

- [x] 2. Implement business day utilities
  - Create src/time/businessDays.ts
  - Write isBusinessDay function (Mon-Fri check)
  - Write addBusinessDays function (skip weekends)
  - Write getNextBusinessDay function
  - _Requirements: 9.1, 9.2_

- [x] 2.1 Write property tests for business day logic
  - **Property 31: Business day classification**
  - **Validates: Requirements 9.1, 9.2**

- [x] 3. Implement transfer timing estimation
  - Create src/time/transferTiming.ts
  - Write estimateInstantArrival function (current + 5 min)
  - Write estimateSameDayArrival function (handle 5pm EST cutoff, weekends)
  - Write estimateOneDayArrival function (handle Mon-Thu vs Fri-Sun)
  - Write estimateThreeDayArrival function (add 3 business days)
  - Write main estimateArrivalTime function that dispatches based on TransferSpeed
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 3.1 Write property tests for transfer timing
  - **Property 11: Instant transfer timing**
  - **Property 12: Same-day transfer timing (business hours)**
  - **Property 13: Same-day transfer timing (after hours)**
  - **Property 14: One-day ACH timing (weekday)**
  - **Property 15: One-day ACH timing (weekend)**
  - **Property 16: Three-day ACH timing**
  - **Property 32: Instant transfer weekend availability**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.4**

- [x] 4. Implement available balance calculation
  - Create src/balance/availableBalance.ts
  - Write calculateAvailableBalance function (balance - pending debits)
  - Handle edge cases (no pending transactions, all credits, all debits)
  - _Requirements: 1.3_

- [x] 4.1 Write property test for available balance calculation
  - **Property 1: Available balance calculation**
  - **Validates: Requirements 1.3**

- [x] 5. Implement source account identification
  - Create src/balance/sourceAccounts.ts
  - Write identifySourceAccounts function (filter accounts with available balance > 0)
  - Use calculateAvailableBalance from previous task
  - _Requirements: 1.2_

- [x] 5.1 Write property test for source account identification
  - **Property 2: Source account identification**
  - **Validates: Requirements 1.2**

- [x] 6. Implement path discovery
  - Create src/paths/pathFinder.ts
  - Write findAllPathsToTarget function using BFS/DFS graph traversal
  - Return Map<sourceAccountId, TransferRelationship[]> representing paths
  - Handle direct transfers (1 hop) and multi-hop transfers
  - Return empty paths for unreachable accounts
  - _Requirements: 1.5, 2.3, 2.4, 8.3_

- [x] 6.1 Write property tests for path discovery
  - **Property 5: Transfer matrix compliance**
  - **Property 6: Path discovery completeness**
  - **Validates: Requirements 2.3, 2.4**

- [x] 7. Implement combination generation
  - Create src/combinations/combinationGenerator.ts
  - Write generateValidCombinations function (all subsets summing to >= goal amount)
  - Exclude combinations using unavailable funds
  - Implement pruning for performance (early termination, max 5 accounts)
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 7.1 Write property tests for combination generation
  - **Property 3: Combination completeness**
  - **Property 4: Pending transaction exclusion**
  - **Property 7: Balance sufficiency**
  - **Validates: Requirements 2.1, 2.2, 2.5**

- [x] 8. Implement cost calculation utilities
  - Create src/costs/costCalculator.ts
  - Write calculateTotalFees function (sum step fees, treat null as 0)
  - Write normalizeCosts function (percentage of max fees)
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8.1 Write property tests for cost calculation
  - **Property 8: Fee calculation accuracy**
  - **Property 9: Cost normalization**
  - **Validates: Requirements 3.1, 3.2, 3.3, 7.3**

- [x] 9. Implement risk assessment
  - Create src/risk/riskCalculator.ts
  - Write calculateTimingRisk function (buffer-based: 0/20/50/80/100)
  - Write calculateReliabilityRisk function (method-based: 0/30/50)
  - Write calculateComplexityRisk function (step-based: 0/20/40)
  - Write calculateRiskScore function (weighted sum: 0.5/0.3/0.2)
  - Write classifyRiskLevel function (low/medium/high thresholds)
  - _Requirements: 5.1-5.17_

- [x] 9.1 Write property tests for risk assessment
  - **Property 19: Risk score calculation**
  - **Property 20: Timing risk calculation**
  - **Property 21: Reliability risk calculation**
  - **Property 22: Complexity risk calculation**
  - **Property 23: Risk level classification**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15, 5.16, 5.17**

- [x] 10.Implement route building
  - Create src/routes/routeBuilder.ts
  - Write buildRoute function (combination → complete route with steps)
  - For each source account, create transfer steps using discovered paths
  - Calculate transfer amounts (proportional or greedy allocation)
  - Look up transfer method and fee from transfer matrix
  - Calculate estimated arrival for each step using timing functions
  - Calculate route arrival as max of all step arrivals
  - Ensure no account goes negative during transfers
  - _Requirements: 2.3, 4.7, 7.1, 7.2, 7.4, 9.5_

- [x] 10.1 Write property tests for route building
  - **Property 17: Route arrival time calculation**
  - **Property 27: Route step completeness**
  - **Property 33: No negative balances**
  - **Validates: Requirements 4.7, 7.1, 7.2, 7.4, 9.5**

- [x] 11.Implement route categorization
  - Create src/categorization/routeSelector.ts
  - Write selectCheapestRoute function (min totalFees)
  - Write selectFastestRoute function (min estimatedArrival)
  - Write calculateRecommendedScore function (weighted: cost 40%, time 30%, risk 30%)
  - Write selectRecommendedRoute function (max score)
  - Write generateReasoning function (explain selection for each category)
  - _Requirements: 3.4, 3.5, 4.8, 6.1, 6.2, 6.3, 6.4, 6.5, 7.6_

- [x] 11.1 Write property tests for route categorization
  - **Property 10: Cheapest route selection**
  - **Property 18: Fastest route selection**
  - **Property 24: Three route categories**
  - **Property 25: Recommended route scoring**
  - **Property 28: Route metadata completeness**
  - **Validates: Requirements 3.4, 4.8, 6.1, 6.2, 6.3, 6.4, 6.5, 7.5, 7.6**

- [x] 12.Implement high-risk warning logic
  - Create src/categorization/riskWarning.ts
  - Write checkAllRoutesRisky function (all risk scores > 70)
  - Return allRoutesRisky flag when condition is met
  - _Requirements: 6.6, 6.7_

- [x] 12.1 Write property test for high-risk warning
  - **Property 26: High risk warning**
  - **Validates: Requirements 6.6, 6.7**

- [x] 13.  Implement error handling
  - Create src/errors/errorHandlers.ts
  - Write checkPastDeadline function (deadline < current time)
  - Write checkInsufficientFunds function (calculate shortfall)
  - Write checkNoPath function (detect unreachable target)
  - Write createErrorResponse function (format error with no routes)
  - Define error types (RoutingError interface)
  - _Requirements: 1.4, 8.1, 8.2, 8.3, 8.5_

- [x] 13.1 Write property tests for error handling
  - **Property 29: Insufficient funds error**
  - **Property 30: Error excludes routes**
  - **Validates: Requirements 1.4, 8.2, 8.5**

- [x] 14.Implement input validation
  - Create src/validation/inputValidator.ts
  - Write validateGoal function (deadline not in past, amount > 0, valid account ID)
  - Write validateAccounts function (non-empty, valid structure)
  - Write validateTransferMatrix function (valid account references, valid speeds)
  - _Requirements: 1.1, 8.1_

- [x] 15.Implement main routing algorithm
  - Create src/index.ts
  - Implement calculateOptimalRoutes function
  - Wire together full pipeline:
    1. Validate inputs
    2. Check for past deadline error
    3. Calculate available balances
    4. Check for insufficient funds error
    5. Discover paths to target
    6. Check for no path error
    7. Generate valid combinations
    8. Build routes for each combination
    9. Calculate costs and risks for all routes
    10. Select cheapest, fastest, and recommended routes
    11. Check for high-risk warning
    12. Format and return response
  - _Requirements: All_

- [x] 15.1 Write additional integration tests for edge cases
  - Test edge case: weekend deadline with ACH transfer
  - Test edge case: exact amount match (goal equals available balance)
  - Test complex case: multiple source accounts with different paths and speeds

- [x] 16.  Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify all 33 properties are tested
  - Ensure all tests pass, ask the user if questions arise

- [x] 17. Add performance optimizations
  - Add memoization to path discovery (cache paths between account pairs)
  - Implement early termination in combination generation (stop when enough combinations found)
  - Add maximum combination size limit (default 5 accounts)
  - _Requirements: Performance considerations from design_

- [x] 18. Final checkpoint - Ensure all tests pass
  - Run full test suite with coverage
  - Verify 100+ iterations per property test
  - Ensure all tests pass, ask the user if questions arise

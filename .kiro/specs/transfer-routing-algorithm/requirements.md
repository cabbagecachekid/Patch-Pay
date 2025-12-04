# Requirements Document

## Introduction

The Transfer Routing Algorithm system calculates optimal routes to transfer money from multiple source accounts to a target account. The system evaluates all possible transfer combinations and provides three categorized routes (cheapest, fastest, and recommended) that balance cost, speed, and risk factors. The system must handle various edge cases including insufficient funds, missing transfer paths, and deadline constraints.

## Glossary

- **Transfer Routing System**: The software system that calculates optimal money transfer routes
- **Source Account**: An account from which money can be transferred
- **Target Account**: The destination account that should receive the transferred funds
- **Transfer Relationship**: A defined connection between two accounts specifying transfer speed and fees
- **Route**: A sequence of transfer steps from source account(s) to target account
- **Risk Score**: A numerical value (0-100) representing the risk level of a transfer route
- **Business Day**: Monday through Friday, excluding weekends
- **Instant Transfer**: A transfer that completes within 0-5 minutes (available 24/7)
- **Same Day Transfer**: A transfer that completes within the same business day
- **ACH Transfer**: Automated Clearing House transfer with 1-day or 3-day completion time
- **Available Balance**: Account balance minus pending transactions
- **Timing Risk**: Risk component based on time buffer before deadline
- **Reliability Risk**: Risk component based on transfer method reliability
- **Complexity Risk**: Risk component based on number of transfer steps

## Requirements

### Requirement 1

**User Story:** As a user, I want to transfer a specific amount to a target account by a deadline, so that I can ensure funds arrive on time with optimal cost and risk balance.

#### Acceptance Criteria

1. WHEN a user provides a goal with targetAccountId, amount, and deadline, THE Transfer Routing System SHALL validate that the deadline is not in the past
2. WHEN a user provides a goal amount, THE Transfer Routing System SHALL identify all source accounts with available balance greater than zero
3. WHEN calculating available balance, THE Transfer Routing System SHALL subtract pending transactions from the account balance
4. WHEN the sum of all available balances is less than the goal amount, THE Transfer Routing System SHALL return an error with the calculated shortfall
5. WHEN no transfer relationships exist to the target account, THE Transfer Routing System SHALL return an error indicating no path exists

### Requirement 2

**User Story:** As a user, I want the system to find all valid transfer combinations, so that I can choose from multiple routing options.

#### Acceptance Criteria

1. WHEN identifying valid combinations, THE Transfer Routing System SHALL generate all combinations of source accounts that sum to at least the goal amount
2. WHEN generating combinations, THE Transfer Routing System SHALL exclude any funds that are locked in pending transactions
3. WHEN evaluating transfer paths, THE Transfer Routing System SHALL use the transfer matrix to determine valid connections between accounts
4. WHEN multiple paths exist to the target account, THE Transfer Routing System SHALL evaluate all possible routing combinations
5. WHEN a source account has insufficient balance for a combination, THE Transfer Routing System SHALL exclude that combination from consideration

### Requirement 3

**User Story:** As a user, I want the system to calculate transfer costs accurately, so that I can understand the financial impact of each route.

#### Acceptance Criteria

1. WHEN calculating route costs, THE Transfer Routing System SHALL sum all transfer fees for each step in the route
2. WHEN a transfer relationship has a null fee, THE Transfer Routing System SHALL treat the fee as zero dollars
3. WHEN comparing routes, THE Transfer Routing System SHALL normalize costs as a percentage of the maximum fees across all routes
4. WHEN calculating the cheapest route, THE Transfer Routing System SHALL select the combination with the minimum total fees
5. WHEN the cheapest route arrives after the deadline, THE Transfer Routing System SHALL mark it as risky

### Requirement 4

**User Story:** As a user, I want the system to estimate arrival times accurately, so that I can ensure funds arrive before my deadline.

#### Acceptance Criteria

1. WHEN a transfer uses instant method, THE Transfer Routing System SHALL set the estimated arrival to current time plus 5 minutes
2. WHEN a transfer uses same-day method and is initiated before 5pm EST on a business day, THE Transfer Routing System SHALL set arrival to end of current business day
3. WHEN a transfer uses same-day method and is initiated after 5pm EST or on a weekend, THE Transfer Routing System SHALL set arrival to end of next business day
4. WHEN a transfer uses 1-day method and is initiated Monday through Thursday before 5pm EST, THE Transfer Routing System SHALL set arrival to next business day
5. WHEN a transfer uses 1-day method and is initiated Friday through Sunday, THE Transfer Routing System SHALL set arrival to Tuesday
6. WHEN a transfer uses 3-day method, THE Transfer Routing System SHALL add 3 business days to the current time skipping weekends
7. WHEN calculating route arrival time, THE Transfer Routing System SHALL use the latest completion time among all steps in the route
8. WHEN calculating the fastest route, THE Transfer Routing System SHALL select the combination with the minimum estimated arrival time

### Requirement 5

**User Story:** As a user, I want the system to assess transfer risk, so that I can make informed decisions about route selection.

#### Acceptance Criteria

1. WHEN calculating risk score, THE Transfer Routing System SHALL compute timing risk weighted at 50 percent
2. WHEN calculating risk score, THE Transfer Routing System SHALL compute reliability risk weighted at 30 percent
3. WHEN calculating risk score, THE Transfer Routing System SHALL compute complexity risk weighted at 20 percent
4. WHEN the time buffer before deadline exceeds 48 hours, THE Transfer Routing System SHALL assign timing risk of 0
5. WHEN the time buffer is between 24 and 48 hours, THE Transfer Routing System SHALL assign timing risk of 20
6. WHEN the time buffer is between 6 and 24 hours, THE Transfer Routing System SHALL assign timing risk of 50
7. WHEN the time buffer is less than 6 hours, THE Transfer Routing System SHALL assign timing risk of 80
8. WHEN the estimated arrival is after the deadline, THE Transfer Routing System SHALL assign timing risk of 100
9. WHEN all transfers use instant method, THE Transfer Routing System SHALL assign reliability risk of 0
10. WHEN transfers use a mix of instant and ACH methods, THE Transfer Routing System SHALL assign reliability risk of 30
11. WHEN all transfers use ACH method, THE Transfer Routing System SHALL assign reliability risk of 50
12. WHEN a route has 1 transfer step, THE Transfer Routing System SHALL assign complexity risk of 0
13. WHEN a route has 2 to 3 transfer steps, THE Transfer Routing System SHALL assign complexity risk of 20
14. WHEN a route has 4 or more transfer steps, THE Transfer Routing System SHALL assign complexity risk of 40
15. WHEN the risk score is 0 to 30, THE Transfer Routing System SHALL classify the risk level as low
16. WHEN the risk score is 31 to 60, THE Transfer Routing System SHALL classify the risk level as medium
17. WHEN the risk score is 61 to 100, THE Transfer Routing System SHALL classify the risk level as high

### Requirement 6

**User Story:** As a user, I want to receive three categorized route options, so that I can choose based on my priorities (cost, speed, or balance).

#### Acceptance Criteria

1. WHEN returning routes, THE Transfer Routing System SHALL provide exactly three routes: cheapest, fastest, and recommended
2. WHEN calculating the recommended route, THE Transfer Routing System SHALL use normalized cost weighted at 40 percent
3. WHEN calculating the recommended route, THE Transfer Routing System SHALL use normalized time weighted at 30 percent
4. WHEN calculating the recommended route, THE Transfer Routing System SHALL use risk score weighted at 30 percent
5. WHEN calculating the recommended route score, THE Transfer Routing System SHALL select the route with the highest weighted score
6. WHEN all routes have risk scores exceeding 70, THE Transfer Routing System SHALL include an allRoutesRisky flag set to true in the response
7. WHEN all routes have risk scores exceeding 70, THE Transfer Routing System SHALL still return all three categorized routes

### Requirement 7

**User Story:** As a user, I want detailed information about each route, so that I can understand the transfer steps and make informed decisions.

#### Acceptance Criteria

1. WHEN returning a route, THE Transfer Routing System SHALL include all transfer steps in sequence
2. WHEN returning a transfer step, THE Transfer Routing System SHALL include fromAccountId, toAccountId, amount, method, fee, and estimatedArrival
3. WHEN returning a route, THE Transfer Routing System SHALL include totalFees as the sum of all step fees
4. WHEN returning a route, THE Transfer Routing System SHALL include estimatedArrival as the latest step completion time
5. WHEN returning a route, THE Transfer Routing System SHALL include both riskLevel classification and numerical riskScore
6. WHEN returning a route, THE Transfer Routing System SHALL include a reasoning string explaining why this route was selected for its category

### Requirement 8

**User Story:** As a user, I want clear error messages for invalid scenarios, so that I can understand why my transfer request cannot be fulfilled.

#### Acceptance Criteria

1. WHEN the goal deadline is before the current time, THE Transfer Routing System SHALL return an error with code "past_deadline"
2. WHEN total available funds are insufficient, THE Transfer Routing System SHALL return an error with code "insufficient_funds" and the calculated shortfall amount
3. WHEN no transfer path exists to the target account, THE Transfer Routing System SHALL return an error with code "no_path"
4. WHEN no transfer path exists to the target account, THE Transfer Routing System SHALL suggest an intermediate account if one exists
5. WHEN an error occurs, THE Transfer Routing System SHALL not return any route options

### Requirement 9

**User Story:** As a system administrator, I want the system to enforce business rules consistently, so that transfers are processed according to banking standards.

#### Acceptance Criteria

1. WHEN processing transfers, THE Transfer Routing System SHALL treat Monday through Friday as business days
2. WHEN processing transfers, THE Transfer Routing System SHALL treat Saturday and Sunday as non-business days
3. WHEN calculating ACH transfer arrival on weekends, THE Transfer Routing System SHALL delay completion to the next Monday morning
4. WHEN processing instant transfers, THE Transfer Routing System SHALL allow 24/7 availability including weekends
5. WHEN calculating routes, THE Transfer Routing System SHALL ensure no account balance goes negative
6. WHEN applying transfer fees, THE Transfer Routing System SHALL treat fees as fixed dollar amounts per relationship

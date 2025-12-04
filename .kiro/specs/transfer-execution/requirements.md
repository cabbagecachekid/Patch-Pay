# Requirements Document

## Introduction

This feature extends the existing transfer routing calculator to execute actual money transfers using Lightning Network and traditional payment APIs. The system will transform calculated optimal routes into real financial transactions, starting with Lightning Network for Bitcoin transfers and providing hooks for traditional banking APIs (Plaid, Stripe) for fiat transfers.

## Glossary

- **Transfer Execution Engine**: The system component responsible for executing calculated transfer routes
- **Lightning Network**: A Layer 2 Bitcoin payment protocol enabling fast, low-cost transactions
- **Payment Provider**: External API service that facilitates actual money movement (e.g., LNbits, Strike, Plaid)
- **Route Executor**: Component that orchestrates multi-hop transfers following a calculated route
- **Transaction Monitor**: Component that tracks transfer status and handles failures
- **Idempotency Key**: Unique identifier ensuring a transfer is executed exactly once
- **Settlement**: Confirmation that funds have been successfully transferred and are available
- **Rollback**: Process of reversing completed transfers when a multi-hop route fails partway through

## Requirements

### Requirement 1

**User Story:** As a user, I want to execute Lightning Network transfers following calculated routes, so that I can actually move Bitcoin between my wallets using the optimal path.

#### Acceptance Criteria

1. WHEN a user selects a calculated route and confirms execution THEN the Transfer Execution Engine SHALL initiate Lightning Network payments following the route sequence
2. WHEN executing a multi-hop Lightning route THEN the Transfer Execution Engine SHALL wait for settlement confirmation before initiating the next hop
3. WHEN a Lightning payment fails THEN the Transfer Execution Engine SHALL halt execution and report the failure with specific error details
4. WHEN all hops in a Lightning route complete successfully THEN the Transfer Execution Engine SHALL return a success status with transaction IDs for each hop
5. WHEN executing a Lightning payment THEN the Transfer Execution Engine SHALL use idempotency keys to prevent duplicate transfers

### Requirement 2

**User Story:** As a user, I want to connect my Lightning wallet to the system, so that the application can execute transfers on my behalf.

#### Acceptance Criteria

1. WHEN a user provides Lightning wallet credentials THEN the system SHALL validate the connection and store encrypted credentials
2. WHEN the system connects to a Lightning wallet THEN the system SHALL fetch and display the current balance
3. WHEN wallet credentials are invalid THEN the system SHALL reject the connection and provide clear error messaging
4. WHEN a user disconnects a wallet THEN the system SHALL remove all stored credentials and revoke access
5. WHEN multiple Lightning wallets are connected THEN the system SHALL allow the user to select which wallet to use for each transfer

### Requirement 3

**User Story:** As a user, I want to see real-time status updates during transfer execution, so that I know what's happening with my money.

#### Acceptance Criteria

1. WHEN a transfer execution begins THEN the Transaction Monitor SHALL display the current status as "initiating"
2. WHEN each hop in a route completes THEN the Transaction Monitor SHALL update the status to show progress through the route
3. WHEN a transfer is awaiting settlement THEN the Transaction Monitor SHALL display "pending settlement" with estimated completion time
4. WHEN a transfer completes successfully THEN the Transaction Monitor SHALL display "completed" with final transaction details
5. WHEN a transfer fails THEN the Transaction Monitor SHALL display "failed" with the specific failure reason and which hop failed

### Requirement 4

**User Story:** As a user, I want the system to handle partial route failures gracefully, so that I don't lose money if something goes wrong mid-transfer.

#### Acceptance Criteria

1. WHEN a hop fails in a multi-hop route THEN the system SHALL halt further execution immediately
2. WHEN a failure occurs after successful hops THEN the system SHALL report which hops succeeded and where the failure occurred
3. WHEN a transfer fails THEN the system SHALL provide clear guidance on next steps for the user
4. WHEN the system detects a failure THEN the system SHALL log complete failure details for debugging
5. WHEN network connectivity is lost during execution THEN the system SHALL detect the timeout and mark the transfer as "unknown status" requiring manual verification

### Requirement 5

**User Story:** As a developer, I want a provider abstraction layer, so that I can add support for different payment APIs without changing core execution logic.

#### Acceptance Criteria

1. WHEN implementing a new payment provider THEN the provider SHALL implement a standard interface with methods for initiate, check status, and cancel
2. WHEN the Route Executor needs to execute a hop THEN the Route Executor SHALL select the appropriate provider based on the transfer type
3. WHEN a provider is unavailable THEN the system SHALL detect the unavailability and report it before attempting execution
4. WHEN multiple providers support the same transfer type THEN the system SHALL allow configuration of provider priority
5. WHEN a provider returns an error THEN the system SHALL normalize the error into a standard format

### Requirement 6

**User Story:** As a user, I want to execute transfers in testnet/sandbox mode, so that I can verify routes work correctly before using real money.

#### Acceptance Criteria

1. WHEN testnet mode is enabled THEN the system SHALL only connect to testnet/sandbox endpoints for all providers
2. WHEN executing a transfer in testnet mode THEN the system SHALL display a clear indicator that this is not real money
3. WHEN switching between testnet and mainnet THEN the system SHALL require explicit user confirmation
4. WHEN testnet mode is active THEN the system SHALL prevent any connection to mainnet endpoints
5. WHEN displaying balances in testnet mode THEN the system SHALL clearly label them as testnet balances

### Requirement 7

**User Story:** As a user, I want to set maximum amounts and confirmation requirements, so that I maintain control over my funds.

#### Acceptance Criteria

1. WHEN a transfer amount exceeds a user-configured threshold THEN the system SHALL require explicit confirmation before execution
2. WHEN a user sets a daily transfer limit THEN the system SHALL track cumulative transfers and prevent execution beyond the limit
3. WHEN a high-risk route is selected THEN the system SHALL display additional warnings and require confirmation
4. WHEN the system requires confirmation THEN the system SHALL display complete transfer details including all fees and timing
5. WHEN a user cancels a confirmation prompt THEN the system SHALL abort the transfer without executing any hops

### Requirement 8

**User Story:** As a user, I want to view a history of executed transfers, so that I can track my transactions and verify they completed correctly.

#### Acceptance Criteria

1. WHEN a transfer execution completes THEN the system SHALL store a complete record including route, amounts, fees, and timestamps
2. WHEN a user views transfer history THEN the system SHALL display all executed transfers sorted by date
3. WHEN viewing a historical transfer THEN the system SHALL show the complete route with status of each hop
4. WHEN a transfer failed THEN the history SHALL clearly indicate the failure point and reason
5. WHEN exporting transfer history THEN the system SHALL provide data in a standard format with all transaction IDs

### Requirement 9

**User Story:** As a developer, I want comprehensive error handling and retry logic, so that transient failures don't cause unnecessary transfer failures.

#### Acceptance Criteria

1. WHEN a provider returns a transient error THEN the system SHALL retry the operation with exponential backoff
2. WHEN maximum retry attempts are reached THEN the system SHALL fail the transfer and report the error
3. WHEN a network timeout occurs THEN the system SHALL retry with a longer timeout before failing
4. WHEN a provider returns a permanent error THEN the system SHALL not retry and immediately fail the transfer
5. WHEN retrying an operation THEN the system SHALL use the same idempotency key to prevent duplicate transfers

### Requirement 10

**User Story:** As a user, I want to add traditional banking support via Plaid or Stripe, so that I can execute fiat transfers alongside Lightning transfers.

#### Acceptance Criteria

1. WHEN a user connects a bank account via Plaid THEN the system SHALL validate the connection and fetch account details
2. WHEN executing an ACH transfer THEN the system SHALL use the appropriate provider API to initiate the transfer
3. WHEN a fiat transfer is pending THEN the system SHALL display estimated settlement time based on the transfer type
4. WHEN mixing Lightning and fiat transfers in a route THEN the system SHALL execute each hop with the appropriate provider
5. WHEN a fiat transfer requires additional verification THEN the system SHALL prompt the user and pause execution until verified

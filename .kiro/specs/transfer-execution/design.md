# Design Document

## Overview

This feature adds real transfer execution capabilities to the existing routing calculator. The system will execute calculated routes by integrating with Lightning Network APIs (primarily LNbits and Strike) and traditional payment providers (Plaid, Stripe). The design emphasizes safety, idempotency, and clear separation between route calculation and execution.

## Architecture

The execution system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                              │
│  (Route Selection, Execution Confirmation, Status)       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Transfer Execution Engine                   │
│  (Orchestration, State Management, Idempotency)         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 Route Executor                           │
│  (Multi-hop Sequencing, Settlement Waiting)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Provider Abstraction Layer                  │
│  (Unified Interface for All Payment Providers)          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌──────────────┬──────────────┬──────────────┬───────────┐
│   Lightning  │    Plaid     │   Stripe     │  Future   │
│   Provider   │   Provider   │   Provider   │ Providers │
└──────────────┴──────────────┴──────────────┴───────────┘
```

## Components and Interfaces

### Transfer Execution Engine

Core orchestrator responsible for executing transfers safely.

```typescript
interface TransferExecutionEngine {
  executeRoute(
    route: CalculatedRoute,
    options: ExecutionOptions
  ): Promise<ExecutionResult>;
  
  getExecutionStatus(executionId: string): Promise<ExecutionStatus>;
  
  cancelExecution(executionId: string): Promise<CancelResult>;
}

interface ExecutionOptions {
  testMode: boolean;
  confirmationRequired: boolean;
  maxRetries: number;
  timeoutMs: number;
}

interface ExecutionResult {
  executionId: string;
  status: 'completed' | 'failed' | 'partial';
  completedHops: HopResult[];
  failedHop?: HopResult;
  totalFeePaid: number;
  totalDuration: number;
}
```

### Provider Abstraction Layer

Unified interface for all payment providers.

```typescript
interface PaymentProvider {
  readonly name: string;
  readonly supportedTypes: TransferType[];
  
  initialize(config: ProviderConfig): Promise<void>;
  
  validateConnection(): Promise<boolean>;
  
  initiateTransfer(request: TransferRequest): Promise<TransferResponse>;
  
  checkStatus(transferId: string): Promise<TransferStatus>;
  
  getBalance(accountId: string): Promise<Balance>;
}

interface TransferRequest {
  idempotencyKey: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

interface TransferResponse {
  transferId: string;
  status: 'pending' | 'completed' | 'failed';
  estimatedSettlement?: Date;
  actualFee?: number;
}
```

### Lightning Provider Implementation

```typescript
class LightningProvider implements PaymentProvider {
  name = 'lightning';
  supportedTypes = ['lightning'];
  
  private client: LNbitsClient | StrikeClient;
  
  async initiateTransfer(request: TransferRequest): Promise<TransferResponse> {
    // Create Lightning invoice or payment
    // Handle bolt11 invoice generation/payment
    // Return transfer response with Lightning-specific details
  }
  
  async checkStatus(transferId: string): Promise<TransferStatus> {
    // Query Lightning payment status
    // Map to standard status format
  }
}
```

### Route Executor

Handles multi-hop transfer sequencing.

```typescript
interface RouteExecutor {
  executeMultiHop(
    route: CalculatedRoute,
    providers: Map<string, PaymentProvider>
  ): AsyncGenerator<HopProgress, ExecutionResult>;
}

interface HopProgress {
  hopIndex: number;
  status: 'initiating' | 'pending' | 'completed' | 'failed';
  transferId?: string;
  error?: Error;
}
```

### Transaction Monitor

Tracks execution status and provides real-time updates.

```typescript
interface TransactionMonitor {
  subscribe(executionId: string): Observable<ExecutionUpdate>;
  
  getHistory(filters: HistoryFilters): Promise<ExecutionRecord[]>;
  
  exportHistory(format: 'json' | 'csv'): Promise<string>;
}

interface ExecutionUpdate {
  executionId: string;
  timestamp: Date;
  type: 'status_change' | 'hop_completed' | 'error';
  data: any;
}
```

## Data Models

### Execution Record

```typescript
interface ExecutionRecord {
  id: string;
  userId: string;
  route: CalculatedRoute;
  status: ExecutionStatus;
  hops: HopRecord[];
  createdAt: Date;
  completedAt?: Date;
  totalFeePaid: number;
  testMode: boolean;
}

interface HopRecord {
  index: number;
  fromAccount: string;
  toAccount: string;
  amount: number;
  provider: string;
  transferId?: string;
  status: 'pending' | 'completed' | 'failed';
  fee: number;
  initiatedAt: Date;
  completedAt?: Date;
  error?: string;
}
```

### Provider Configuration

```typescript
interface ProviderConfig {
  name: string;
  type: 'lightning' | 'ach' | 'wire';
  credentials: EncryptedCredentials;
  endpoints: {
    mainnet: string;
    testnet: string;
  };
  enabled: boolean;
  priority: number;
}

interface EncryptedCredentials {
  apiKey?: string;
  apiSecret?: string;
  macaroon?: string; // For LND
  accessToken?: string;
}
```

## Corr
ectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing the correctness properties, let me analyze the testability of each acceptance criterion:


### Property 1: Sequential hop execution
*For any* multi-hop route, when executing the route, hop N+1 should never be initiated before hop N has settled successfully.
**Validates: Requirements 1.2**

### Property 2: Execution halts on failure
*For any* multi-hop route, if a hop fails at position N, then no hops at position > N should be executed.
**Validates: Requirements 1.3, 4.1**

### Property 3: Success includes all transaction IDs
*For any* successfully completed route execution, the result should contain a transaction ID for each hop in the route.
**Validates: Requirements 1.4**

### Property 4: Idempotency prevents duplicates
*For any* transfer request, executing the same request twice with the same idempotency key should result in only one actual transfer being initiated.
**Validates: Requirements 1.5, 9.5**

### Property 5: Invalid credentials rejected
*For any* invalid wallet credentials, the connection attempt should be rejected and no credentials should be stored.
**Validates: Requirements 2.3**

### Property 6: Disconnect removes credentials
*For any* connected wallet, after disconnecting, querying for stored credentials should return none.
**Validates: Requirements 2.4**

### Property 7: Status progression is monotonic
*For any* transfer execution, the status should progress through states in order: initiating → pending → (completed | failed), never moving backwards.
**Validates: Requirements 3.1, 3.2, 3.4, 3.5**

### Property 8: Failure reporting completeness
*For any* failed transfer, the failure report should include which hops succeeded, which hop failed, and the specific error reason.
**Validates: Requirements 4.2, 4.4**

### Property 9: Provider selection correctness
*For any* hop with a specific transfer type, the Route Executor should select a provider that supports that transfer type.
**Validates: Requirements 5.2**

### Property 10: Provider unavailability detection
*For any* unavailable provider, attempting to use it should result in an error before any transfer is initiated.
**Validates: Requirements 5.3**

### Property 11: Error normalization consistency
*For any* provider error, the normalized error should contain a standard error code, message, and the original provider error details.
**Validates: Requirements 5.5**

### Property 12: Testnet endpoint isolation
*For any* provider when testnet mode is enabled, all connection attempts should only use testnet/sandbox endpoints, never mainnet endpoints.
**Validates: Requirements 6.1, 6.4**

### Property 13: Amount threshold enforcement
*For any* transfer where the amount exceeds the configured threshold, the system should require confirmation before execution.
**Validates: Requirements 7.1**

### Property 14: Daily limit enforcement
*For any* sequence of transfers within a 24-hour period, the cumulative amount should never exceed the configured daily limit.
**Validates: Requirements 7.2**

### Property 15: Cancellation prevents execution
*For any* transfer where the user cancels the confirmation, no hops should be executed and no funds should be moved.
**Validates: Requirements 7.5**

### Property 16: History record completeness
*For any* completed transfer, the stored history record should contain the complete route, all amounts, all fees, and timestamps for each hop.
**Validates: Requirements 8.1**

### Property 17: History sorting correctness
*For any* transfer history query, the results should be sorted by date in descending order (newest first).
**Validates: Requirements 8.2**

### Property 18: Retry with exponential backoff
*For any* transient error, the retry delays should follow exponential backoff: delay(n) >= delay(n-1) * backoff_factor.
**Validates: Requirements 9.1**

### Property 19: Max retries enforcement
*For any* operation that fails, the number of retry attempts should never exceed the configured maximum.
**Validates: Requirements 9.2**

### Property 20: Permanent errors skip retry
*For any* permanent error (e.g., insufficient funds, invalid account), the system should not retry and should immediately fail.
**Validates: Requirements 9.4**

### Property 21: Mixed route provider selection
*For any* route containing both Lightning and fiat hops, each hop should be executed with a provider appropriate for its type.
**Validates: Requirements 10.4**

## Error Handling

### Error Categories

1. **Transient Errors** (retry with backoff):
   - Network timeouts
   - Provider rate limiting
   - Temporary provider unavailability
   - Lightning routing failures

2. **Permanent Errors** (fail immediately):
   - Insufficient funds
   - Invalid account/credentials
   - Unsupported currency
   - Amount below/above limits

3. **Unknown Status** (requires manual verification):
   - Network loss during execution
   - Provider timeout without clear response
   - Ambiguous provider response

### Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: 3;
  initialDelayMs: 1000;
  backoffFactor: 2;
  maxDelayMs: 30000;
}

// Retry delays: 1s, 2s, 4s
```

### Idempotency Implementation

- Generate UUID v4 for each transfer request
- Store idempotency key with transfer record
- Provider APIs must accept idempotency keys
- Duplicate requests return original result

## Testing Strategy

### Unit Tests

- Provider interface implementations
- Error normalization logic
- Idempotency key generation and validation
- Status state transitions
- Retry logic and backoff calculations
- Credential encryption/decryption
- History filtering and sorting

### Property-Based Tests

- Use fast-check for property testing
- Minimum 100 iterations per property
- Each property test must reference the corresponding correctness property from this document
- Tag format: `// Feature: transfer-execution, Property X: [description]`

**Test Generators:**

```typescript
// Generate random routes with varying hop counts
const routeArbitrary = fc.record({
  hops: fc.array(hopArbitrary, { minLength: 1, maxLength: 5 }),
  totalAmount: fc.integer({ min: 1, max: 1000000 }),
  totalFee: fc.integer({ min: 0, max: 10000 })
});

// Generate random transfer requests
const transferRequestArbitrary = fc.record({
  idempotencyKey: fc.uuid(),
  fromAccount: fc.string(),
  toAccount: fc.string(),
  amount: fc.integer({ min: 1, max: 1000000 }),
  currency: fc.constantFrom('BTC', 'USD', 'EUR')
});

// Generate random provider errors
const providerErrorArbitrary = fc.oneof(
  fc.constant({ type: 'transient', code: 'TIMEOUT' }),
  fc.constant({ type: 'permanent', code: 'INSUFFICIENT_FUNDS' }),
  fc.constant({ type: 'transient', code: 'RATE_LIMIT' })
);
```

### Integration Tests

- End-to-end execution with testnet providers
- Multi-hop route execution
- Failure recovery scenarios
- Provider switching
- Credential management flow

### Security Testing

- Credential encryption strength
- API key storage security
- Idempotency key uniqueness
- Rate limiting effectiveness
- Input validation completeness

## Security Considerations

### Credential Storage

- Encrypt all API keys and secrets at rest
- Use AES-256-GCM encryption
- Store encryption key in secure keychain/vault
- Never log credentials
- Rotate keys periodically

### API Security

- Use HTTPS for all provider communications
- Validate SSL certificates
- Implement request signing where supported
- Rate limit API calls
- Timeout long-running requests

### Transaction Security

- Require confirmation for amounts above threshold
- Implement daily transfer limits
- Log all execution attempts
- Support 2FA for high-value transfers
- Provide transaction receipts

## Performance Considerations

- Cache provider connections
- Batch status checks where possible
- Use connection pooling
- Implement request queuing for rate limits
- Optimize database queries for history

## Deployment Strategy

### Phase 1: Lightning Network (Testnet)
- Implement LNbits provider
- Add execution engine core
- Build UI for execution and monitoring
- Test with testnet Bitcoin

### Phase 2: Lightning Network (Mainnet)
- Security audit
- Add confirmation thresholds
- Enable mainnet with limits
- Monitor and iterate

### Phase 3: Traditional Banking
- Add Plaid provider
- Add Stripe provider
- Implement ACH transfers
- Handle longer settlement times

### Phase 4: Advanced Features
- Automatic route re-execution on failure
- Partial route optimization
- Multi-currency support
- Advanced analytics

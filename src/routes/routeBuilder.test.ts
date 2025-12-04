/**
 * Tests for route building functionality
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildRoute } from './routeBuilder';
import { calculateAvailableBalance } from '../balance/availableBalance';
import {
  Account,
  AccountCombination,
  AccountType,
  TransferRelationship,
  TransferSpeed,
  TransactionStatus
} from '../types';

describe('buildRoute', () => {
  const currentTime = new Date('2024-01-15T10:00:00Z'); // Monday 10am UTC
  
  it('should build a route with a single direct transfer', () => {
    // Setup: One source account with direct path to target
    const sourceAccount: Account = {
      id: 'source1',
      name: 'Checking',
      type: AccountType.CHECKING,
      balance: 1000,
      pendingTransactions: [],
      institutionType: 'traditional_bank',
      metadata: {
        lastUpdated: new Date(),
        isActive: true
      }
    };
    
    const combination: AccountCombination = {
      accounts: [sourceAccount],
      totalAvailable: 1000
    };
    
    const transferRelationship: TransferRelationship = {
      fromAccountId: 'source1',
      toAccountId: 'target1',
      speed: TransferSpeed.INSTANT,
      fee: 2.50,
      isAvailable: true
    };
    
    const pathsToTarget = new Map([
      ['source1', [transferRelationship]]
    ]);
    
    const transferMatrix = [transferRelationship];
    const goalAmount = 500;
    
    // Execute
    const route = buildRoute(
      combination,
      pathsToTarget,
      transferMatrix,
      goalAmount,
      currentTime
    );
    
    // Verify
    expect(route.steps).toHaveLength(1);
    expect(route.steps[0].fromAccountId).toBe('source1');
    expect(route.steps[0].toAccountId).toBe('target1');
    expect(route.steps[0].amount).toBe(500);
    expect(route.steps[0].method).toBe(TransferSpeed.INSTANT);
    expect(route.steps[0].fee).toBe(2.50);
    expect(route.totalFees).toBe(2.50);
    
    // Instant transfer should arrive in 5 minutes
    const expectedArrival = new Date(currentTime);
    expectedArrival.setMinutes(expectedArrival.getMinutes() + 5);
    expect(route.estimatedArrival.getTime()).toBe(expectedArrival.getTime());
  });
  
  it('should build a route with multiple source accounts', () => {
    // Setup: Two source accounts with direct paths to target
    const account1: Account = {
      id: 'source1',
      name: 'Checking',
      type: AccountType.CHECKING,
      balance: 600,
      pendingTransactions: [],
      institutionType: 'traditional_bank',
      metadata: {
        lastUpdated: new Date(),
        isActive: true
      }
    };
    
    const account2: Account = {
      id: 'source2',
      name: 'Savings',
      type: AccountType.SAVINGS,
      balance: 400,
      pendingTransactions: [],
      institutionType: 'traditional_bank',
      metadata: {
        lastUpdated: new Date(),
        isActive: true
      }
    };
    
    const combination: AccountCombination = {
      accounts: [account1, account2],
      totalAvailable: 1000
    };
    
    const rel1: TransferRelationship = {
      fromAccountId: 'source1',
      toAccountId: 'target1',
      speed: TransferSpeed.INSTANT,
      fee: 1.00,
      isAvailable: true
    };
    
    const rel2: TransferRelationship = {
      fromAccountId: 'source2',
      toAccountId: 'target1',
      speed: TransferSpeed.SAME_DAY,
      fee: 0,
      isAvailable: true
    };
    
    const pathsToTarget = new Map([
      ['source1', [rel1]],
      ['source2', [rel2]]
    ]);
    
    const transferMatrix = [rel1, rel2];
    const goalAmount = 800;
    
    // Execute
    const route = buildRoute(
      combination,
      pathsToTarget,
      transferMatrix,
      goalAmount,
      currentTime
    );
    
    // Verify
    expect(route.steps).toHaveLength(2);
    
    // Check that both accounts are used
    const fromAccounts = route.steps.map(s => s.fromAccountId).sort();
    expect(fromAccounts).toEqual(['source1', 'source2']);
    
    // Check that amounts sum to goal amount
    const totalAmount = route.steps.reduce((sum, step) => sum + step.amount, 0);
    expect(totalAmount).toBe(goalAmount);
    
    // Check total fees
    expect(route.totalFees).toBe(1.00);
    
    // Route arrival should be the max of all step arrivals (same-day is slower)
    expect(route.estimatedArrival.getTime()).toBeGreaterThan(currentTime.getTime());
  });
  
  it('should handle multi-hop transfers', () => {
    // Setup: Source -> Intermediate -> Target
    const sourceAccount: Account = {
      id: 'source1',
      name: 'Checking',
      type: AccountType.CHECKING,
      balance: 1000,
      pendingTransactions: [],
      institutionType: 'traditional_bank',
      metadata: {
        lastUpdated: new Date(),
        isActive: true
      }
    };
    
    const combination: AccountCombination = {
      accounts: [sourceAccount],
      totalAvailable: 1000
    };
    
    const hop1: TransferRelationship = {
      fromAccountId: 'source1',
      toAccountId: 'intermediate',
      speed: TransferSpeed.INSTANT,
      fee: 1.00,
      isAvailable: true
    };
    
    const hop2: TransferRelationship = {
      fromAccountId: 'intermediate',
      toAccountId: 'target1',
      speed: TransferSpeed.INSTANT,
      fee: 1.50,
      isAvailable: true
    };
    
    const pathsToTarget = new Map([
      ['source1', [hop1, hop2]]
    ]);
    
    const transferMatrix = [hop1, hop2];
    const goalAmount = 500;
    
    // Execute
    const route = buildRoute(
      combination,
      pathsToTarget,
      transferMatrix,
      goalAmount,
      currentTime
    );
    
    // Verify
    expect(route.steps).toHaveLength(2);
    expect(route.steps[0].fromAccountId).toBe('source1');
    expect(route.steps[0].toAccountId).toBe('intermediate');
    expect(route.steps[0].amount).toBe(500);
    expect(route.steps[1].fromAccountId).toBe('intermediate');
    expect(route.steps[1].toAccountId).toBe('target1');
    expect(route.steps[1].amount).toBe(500);
    expect(route.totalFees).toBe(2.50);
    
    // Second step should start after first step completes
    expect(route.steps[1].estimatedArrival.getTime()).toBeGreaterThan(
      route.steps[0].estimatedArrival.getTime()
    );
  });
  
  it('should treat null fees as zero', () => {
    const sourceAccount: Account = {
      id: 'source1',
      name: 'Checking',
      type: AccountType.CHECKING,
      balance: 1000,
      pendingTransactions: [],
      institutionType: 'traditional_bank',
      metadata: {
        lastUpdated: new Date(),
        isActive: true
      }
    };
    
    const combination: AccountCombination = {
      accounts: [sourceAccount],
      totalAvailable: 1000
    };
    
    const transferRelationship: TransferRelationship = {
      fromAccountId: 'source1',
      toAccountId: 'target1',
      speed: TransferSpeed.INSTANT,
      fee: null, // Free transfer
      isAvailable: true
    };
    
    const pathsToTarget = new Map([
      ['source1', [transferRelationship]]
    ]);
    
    const transferMatrix = [transferRelationship];
    const goalAmount = 500;
    
    // Execute
    const route = buildRoute(
      combination,
      pathsToTarget,
      transferMatrix,
      goalAmount,
      currentTime
    );
    
    // Verify
    expect(route.steps[0].fee).toBe(0);
    expect(route.totalFees).toBe(0);
  });
  
  it('should not allocate more than available balance', () => {
    // Setup: Account with pending transactions
    const sourceAccount: Account = {
      id: 'source1',
      name: 'Checking',
      type: AccountType.CHECKING,
      balance: 1000,
      pendingTransactions: [
        {
          id: 'tx1',
          accountId: 'source1',
          amount: -200, // Pending debit
          date: new Date(),
          status: TransactionStatus.PENDING,
          description: 'Pending payment'
        }
      ],
      institutionType: 'traditional_bank',
      metadata: {
        lastUpdated: new Date(),
        isActive: true
      }
    };
    
    const combination: AccountCombination = {
      accounts: [sourceAccount],
      totalAvailable: 800 // 1000 - 200 pending
    };
    
    const transferRelationship: TransferRelationship = {
      fromAccountId: 'source1',
      toAccountId: 'target1',
      speed: TransferSpeed.INSTANT,
      fee: 0,
      isAvailable: true
    };
    
    const pathsToTarget = new Map([
      ['source1', [transferRelationship]]
    ]);
    
    const transferMatrix = [transferRelationship];
    const goalAmount = 800;
    
    // Execute
    const route = buildRoute(
      combination,
      pathsToTarget,
      transferMatrix,
      goalAmount,
      currentTime
    );
    
    // Verify: Should allocate exactly the available balance
    expect(route.steps[0].amount).toBeLessThanOrEqual(800);
  });
});

/**
 * Property-based tests for route building
 * 
 * Feature: transfer-routing-algorithm
 * Property 17: Route arrival time calculation
 * Property 27: Route step completeness
 * Property 33: No negative balances
 * Validates: Requirements 4.7, 7.1, 7.2, 7.4, 9.5
 */

describe('Route Building - Property Tests', () => {
  describe('Property 17: Route arrival time calculation', () => {
    it('should set route arrival to the maximum of all step arrivals', () => {
      fc.assert(
        fc.property(
          // Generate a combination with 1-3 source accounts
          fc.record({
            accounts: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                name: fc.string({ minLength: 1 }),
                type: fc.constantFrom(...Object.values(AccountType)),
                balance: fc.float({ min: 100, max: 10000, noNaN: true }),
                pendingTransactions: fc.constant([]),
                institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
                metadata: fc.record({
                  lastUpdated: fc.date(),
                  isActive: fc.constant(true)
                })
              }),
              { minLength: 1, maxLength: 3 }
            ).map(accounts => {
              // Ensure unique IDs
              return accounts.map((acc, idx) => ({ ...acc, id: `source${idx}` }));
            }),
            totalAvailable: fc.float({ min: 100, max: 30000, noNaN: true })
          }),
          // Generate transfer speeds for each account (mix of speeds)
          fc.array(fc.constantFrom(...Object.values(TransferSpeed)), { minLength: 1, maxLength: 3 }),
          // Generate current time
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          // Generate goal amount
          fc.float({ min: 50, max: 1000, noNaN: true }),
          (combination: AccountCombination, speeds: TransferSpeed[], currentTime: Date, goalAmount: number) => {
            // Ensure we have matching speeds for accounts
            const accountSpeeds = speeds.slice(0, combination.accounts.length);
            
            // Build paths to target for each account
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            const transferMatrix: TransferRelationship[] = [];
            
            combination.accounts.forEach((account, idx) => {
              const relationship: TransferRelationship = {
                fromAccountId: account.id,
                toAccountId: 'target',
                speed: accountSpeeds[idx] || TransferSpeed.INSTANT,
                fee: 0,
                isAvailable: true
              };
              
              pathsToTarget.set(account.id, [relationship]);
              transferMatrix.push(relationship);
            });
            
            // Build the route
            const route = buildRoute(
              combination,
              pathsToTarget,
              transferMatrix,
              goalAmount,
              currentTime
            );
            
            // Property: Route arrival should equal the maximum of all step arrivals
            const maxStepArrival = Math.max(
              ...route.steps.map(step => step.estimatedArrival.getTime())
            );
            
            expect(route.estimatedArrival.getTime()).toBe(maxStepArrival);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have route arrival >= all individual step arrivals', () => {
      fc.assert(
        fc.property(
          // Generate multi-hop scenario
          fc.record({
            accounts: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                name: fc.string({ minLength: 1 }),
                type: fc.constantFrom(...Object.values(AccountType)),
                balance: fc.float({ min: 100, max: 10000, noNaN: true }),
                pendingTransactions: fc.constant([]),
                institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
                metadata: fc.record({
                  lastUpdated: fc.date(),
                  isActive: fc.constant(true)
                })
              }),
              { minLength: 1, maxLength: 2 }
            ).map(accounts => {
              return accounts.map((acc, idx) => ({ ...acc, id: `source${idx}` }));
            }),
            totalAvailable: fc.float({ min: 100, max: 20000, noNaN: true })
          }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          fc.float({ min: 50, max: 500, noNaN: true }),
          fc.boolean(), // Whether to use multi-hop
          (combination: AccountCombination, currentTime: Date, goalAmount: number, useMultiHop: boolean) => {
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            const transferMatrix: TransferRelationship[] = [];
            
            combination.accounts.forEach((account) => {
              if (useMultiHop && combination.accounts.length === 1) {
                // Create a 2-hop path: source -> intermediate -> target
                const hop1: TransferRelationship = {
                  fromAccountId: account.id,
                  toAccountId: 'intermediate',
                  speed: TransferSpeed.INSTANT,
                  fee: 1,
                  isAvailable: true
                };
                
                const hop2: TransferRelationship = {
                  fromAccountId: 'intermediate',
                  toAccountId: 'target',
                  speed: TransferSpeed.SAME_DAY,
                  fee: 1,
                  isAvailable: true
                };
                
                pathsToTarget.set(account.id, [hop1, hop2]);
                transferMatrix.push(hop1, hop2);
              } else {
                // Direct path
                const relationship: TransferRelationship = {
                  fromAccountId: account.id,
                  toAccountId: 'target',
                  speed: TransferSpeed.INSTANT,
                  fee: 0,
                  isAvailable: true
                };
                
                pathsToTarget.set(account.id, [relationship]);
                transferMatrix.push(relationship);
              }
            });
            
            const route = buildRoute(
              combination,
              pathsToTarget,
              transferMatrix,
              goalAmount,
              currentTime
            );
            
            // Property: Route arrival should be >= all step arrivals
            route.steps.forEach(step => {
              expect(route.estimatedArrival.getTime()).toBeGreaterThanOrEqual(
                step.estimatedArrival.getTime()
              );
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 27: Route step completeness', () => {
    it('should include all required fields in every transfer step', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.float({ min: 100, max: 10000, noNaN: true }),
              pendingTransactions: fc.constant([]),
              institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
              metadata: fc.record({
                lastUpdated: fc.date(),
                isActive: fc.constant(true)
              })
            }),
            { minLength: 1, maxLength: 3 }
          ).map(accounts => {
            return accounts.map((acc, idx) => ({ ...acc, id: `source${idx}` }));
          }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          fc.float({ min: 50, max: 1000, noNaN: true }),
          (accounts: Account[], currentTime: Date, goalAmount: number) => {
            // Calculate proper totalAvailable
            const totalAvailable = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            
            // Skip if goal exceeds available
            if (goalAmount > totalAvailable) {
              return true;
            }
            
            const combination: AccountCombination = {
              accounts,
              totalAvailable
            };
            
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            const transferMatrix: TransferRelationship[] = [];
            
            combination.accounts.forEach((account) => {
              const relationship: TransferRelationship = {
                fromAccountId: account.id,
                toAccountId: 'target',
                speed: TransferSpeed.INSTANT,
                fee: Math.random() > 0.5 ? 2.50 : 0,
                isAvailable: true
              };
              
              pathsToTarget.set(account.id, [relationship]);
              transferMatrix.push(relationship);
            });
            
            const route = buildRoute(
              combination,
              pathsToTarget,
              transferMatrix,
              goalAmount,
              currentTime
            );
            
            // Property: Every step should have all required fields
            route.steps.forEach(step => {
              // Check all required fields are present and valid
              expect(step.fromAccountId).toBeDefined();
              expect(typeof step.fromAccountId).toBe('string');
              expect(step.fromAccountId.length).toBeGreaterThan(0);
              
              expect(step.toAccountId).toBeDefined();
              expect(typeof step.toAccountId).toBe('string');
              expect(step.toAccountId.length).toBeGreaterThan(0);
              
              expect(step.amount).toBeDefined();
              expect(typeof step.amount).toBe('number');
              expect(step.amount).toBeGreaterThanOrEqual(0); // Allow 0 for proportional allocation edge cases
              
              expect(step.method).toBeDefined();
              expect(Object.values(TransferSpeed)).toContain(step.method);
              
              expect(step.fee).toBeDefined();
              expect(typeof step.fee).toBe('number');
              expect(step.fee).toBeGreaterThanOrEqual(0);
              
              expect(step.estimatedArrival).toBeDefined();
              expect(step.estimatedArrival).toBeInstanceOf(Date);
              expect(step.estimatedArrival.getTime()).toBeGreaterThan(currentTime.getTime());
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create steps in sequence with valid account connections', () => {
      fc.assert(
        fc.property(
          fc.record({
            accounts: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                name: fc.string({ minLength: 1 }),
                type: fc.constantFrom(...Object.values(AccountType)),
                balance: fc.float({ min: 500, max: 10000, noNaN: true }),
                pendingTransactions: fc.constant([]),
                institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
                metadata: fc.record({
                  lastUpdated: fc.date(),
                  isActive: fc.constant(true)
                })
              }),
              { minLength: 1, maxLength: 1 }
            ).map(accounts => {
              return accounts.map((acc, idx) => ({ ...acc, id: `source${idx}` }));
            }),
            totalAvailable: fc.float({ min: 500, max: 10000, noNaN: true })
          }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          fc.float({ min: 100, max: 400, noNaN: true }),
          (combination: AccountCombination, currentTime: Date, goalAmount: number) => {
            // Create a multi-hop path to test sequence
            const account = combination.accounts[0];
            const hop1: TransferRelationship = {
              fromAccountId: account.id,
              toAccountId: 'intermediate',
              speed: TransferSpeed.INSTANT,
              fee: 1,
              isAvailable: true
            };
            
            const hop2: TransferRelationship = {
              fromAccountId: 'intermediate',
              toAccountId: 'target',
              speed: TransferSpeed.INSTANT,
              fee: 1.5,
              isAvailable: true
            };
            
            const pathsToTarget = new Map([
              [account.id, [hop1, hop2]]
            ]);
            
            const route = buildRoute(
              combination,
              pathsToTarget,
              [hop1, hop2],
              goalAmount,
              currentTime
            );
            
            // Property: Steps should form a valid sequence
            expect(route.steps.length).toBe(2);
            
            // First step should start from source
            expect(route.steps[0].fromAccountId).toBe(account.id);
            expect(route.steps[0].toAccountId).toBe('intermediate');
            
            // Second step should continue from where first step ended
            expect(route.steps[1].fromAccountId).toBe('intermediate');
            expect(route.steps[1].toAccountId).toBe('target');
            
            // Both steps should transfer the same amount (full amount through each hop)
            expect(route.steps[0].amount).toBe(route.steps[1].amount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 33: No negative balances', () => {
    it('should never allocate more than available balance from any account', () => {
      fc.assert(
        fc.property(
          fc.record({
            accounts: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                name: fc.string({ minLength: 1 }),
                type: fc.constantFrom(...Object.values(AccountType)),
                balance: fc.float({ min: 100, max: 5000, noNaN: true }),
                pendingTransactions: fc.array(
                  fc.record({
                    id: fc.string({ minLength: 1 }),
                    accountId: fc.string({ minLength: 1 }),
                    amount: fc.float({ min: -100, max: -1, noNaN: true }), // Pending debits
                    date: fc.date(),
                    status: fc.constant(TransactionStatus.PENDING),
                    description: fc.string(),
                    category: fc.option(fc.string(), { nil: undefined })
                  }),
                  { maxLength: 3 }
                ),
                institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
                metadata: fc.record({
                  lastUpdated: fc.date(),
                  isActive: fc.constant(true)
                })
              }),
              { minLength: 1, maxLength: 4 }
            ).map(accounts => {
              return accounts.map((acc, idx) => ({ ...acc, id: `source${idx}` }));
            })
          }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          (combination: { accounts: Account[] }, currentTime: Date) => {
            // Calculate available balances
            const availableBalances = new Map<string, number>();
            let totalAvailable = 0;
            
            combination.accounts.forEach(account => {
              const available = calculateAvailableBalance(account);
              availableBalances.set(account.id, available);
              totalAvailable += available;
            });
            
            // Only test if we have positive available balance
            if (totalAvailable <= 0) {
              return true; // Skip this test case
            }
            
            const accountCombination: AccountCombination = {
              accounts: combination.accounts,
              totalAvailable
            };
            
            // Goal amount should be <= total available
            const goalAmount = Math.min(totalAvailable * 0.9, totalAvailable - 1);
            
            if (goalAmount <= 0) {
              return true; // Skip this test case
            }
            
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            const transferMatrix: TransferRelationship[] = [];
            
            combination.accounts.forEach((account) => {
              const relationship: TransferRelationship = {
                fromAccountId: account.id,
                toAccountId: 'target',
                speed: TransferSpeed.INSTANT,
                fee: 0,
                isAvailable: true
              };
              
              pathsToTarget.set(account.id, [relationship]);
              transferMatrix.push(relationship);
            });
            
            const route = buildRoute(
              accountCombination,
              pathsToTarget,
              transferMatrix,
              goalAmount,
              currentTime
            );
            
            // Property: No account should have more allocated than its available balance
            const allocatedAmounts = new Map<string, number>();
            
            route.steps.forEach(step => {
              const currentAllocation = allocatedAmounts.get(step.fromAccountId) || 0;
              allocatedAmounts.set(step.fromAccountId, currentAllocation + step.amount);
            });
            
            allocatedAmounts.forEach((allocated, accountId) => {
              const available = availableBalances.get(accountId);
              expect(available).toBeDefined();
              
              // Allow small floating point tolerance
              expect(allocated).toBeLessThanOrEqual(available! + 0.01);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect pending transactions when allocating amounts', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            name: fc.string({ minLength: 1 }),
            type: fc.constantFrom(...Object.values(AccountType)),
            balance: fc.float({ min: 1000, max: 5000, noNaN: true }),
            pendingTransactions: fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                accountId: fc.string({ minLength: 1 }),
                amount: fc.float({ min: -500, max: -10, noNaN: true }), // Pending debits
                date: fc.date(),
                status: fc.constant(TransactionStatus.PENDING),
                description: fc.string(),
                category: fc.option(fc.string(), { nil: undefined })
              }),
              { minLength: 1, maxLength: 3 }
            ),
            institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
            metadata: fc.record({
              lastUpdated: fc.date(),
              isActive: fc.constant(true)
            })
          }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          (account: Account, currentTime: Date) => {
            account.id = 'source1'; // Ensure consistent ID
            
            const availableBalance = calculateAvailableBalance(account);
            
            // Skip if available balance is too low
            if (availableBalance <= 10) {
              return true;
            }
            
            const combination: AccountCombination = {
              accounts: [account],
              totalAvailable: availableBalance
            };
            
            const goalAmount = Math.min(availableBalance * 0.8, availableBalance - 5);
            
            const relationship: TransferRelationship = {
              fromAccountId: account.id,
              toAccountId: 'target',
              speed: TransferSpeed.INSTANT,
              fee: 0,
              isAvailable: true
            };
            
            const pathsToTarget = new Map([
              [account.id, [relationship]]
            ]);
            
            const route = buildRoute(
              combination,
              pathsToTarget,
              [relationship],
              goalAmount,
              currentTime
            );
            
            // Property: Allocated amount should not exceed available balance
            const allocatedAmount = route.steps.reduce((sum, step) => sum + step.amount, 0);
            
            expect(allocatedAmount).toBeLessThanOrEqual(availableBalance + 0.01);
            
            // The account balance minus pending debits should not go negative
            const pendingDebits = account.pendingTransactions
              .filter(t => t.status === TransactionStatus.PENDING && t.amount < 0)
              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            expect(account.balance - pendingDebits - allocatedAmount).toBeGreaterThanOrEqual(-0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

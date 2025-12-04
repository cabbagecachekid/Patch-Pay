/**
 * Property-based tests for combination generation
 * 
 * Feature: transfer-routing-algorithm, Property 3: Combination completeness
 * Feature: transfer-routing-algorithm, Property 4: Pending transaction exclusion
 * Feature: transfer-routing-algorithm, Property 7: Balance sufficiency
 * Validates: Requirements 2.1, 2.2, 2.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateValidCombinations } from './combinationGenerator';
import { calculateAvailableBalance } from '../balance/availableBalance';
import { Account, TransferRelationship, AccountType, TransactionStatus } from '../types';

describe('Combination Generation - Property Tests', () => {
  describe('Property 3: Combination completeness', () => {
    it('should generate all combinations that sum to at least the goal amount', () => {
      fc.assert(
        fc.property(
          // Generate accounts with available balances
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.float({ min: 100, max: 5000, noNaN: true }),
              pendingTransactions: fc.constant([]), // No pending for simplicity
              institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
              metadata: fc.record({
                lastUpdated: fc.date(),
                isActive: fc.boolean()
              })
            }),
            { minLength: 2, maxLength: 6 }
          ),
          fc.float({ min: 100, max: 3000, noNaN: true }),
          (accounts: Account[], goalAmount: number) => {
            // Create paths to target for all accounts
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            accounts.forEach(account => {
              pathsToTarget.set(account.id, [
                {
                  fromAccountId: account.id,
                  toAccountId: 'target',
                  speed: 'instant' as any,
                  fee: 0,
                  isAvailable: true
                }
              ]);
            });
            
            const combinations = generateValidCombinations(accounts, goalAmount, pathsToTarget);
            
            // All returned combinations should sum to at least the goal amount
            for (const combo of combinations) {
              expect(combo.totalAvailable).toBeGreaterThanOrEqual(goalAmount - 0.01);
            }
            
            // Verify totalAvailable is calculated correctly
            for (const combo of combinations) {
              const calculatedTotal = combo.accounts.reduce(
                (sum, acc) => sum + calculateAvailableBalance(acc),
                0
              );
              expect(Math.abs(combo.totalAvailable - calculatedTotal)).toBeLessThan(0.01);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include combinations that sum to less than the goal amount', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.float({ min: 50, max: 500, noNaN: true }),
              pendingTransactions: fc.constant([]),
              institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
              metadata: fc.record({
                lastUpdated: fc.date(),
                isActive: fc.boolean()
              })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          fc.float({ min: 100, max: 1000, noNaN: true }),
          (accounts: Account[], goalAmount: number) => {
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            accounts.forEach(account => {
              pathsToTarget.set(account.id, [
                {
                  fromAccountId: account.id,
                  toAccountId: 'target',
                  speed: 'instant' as any,
                  fee: 0,
                  isAvailable: true
                }
              ]);
            });
            
            const combinations = generateValidCombinations(accounts, goalAmount, pathsToTarget);
            
            // Every combination must meet or exceed the goal
            for (const combo of combinations) {
              const total = combo.accounts.reduce(
                (sum, acc) => sum + calculateAvailableBalance(acc),
                0
              );
              expect(total).toBeGreaterThanOrEqual(goalAmount - 0.01);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Pending transaction exclusion', () => {
    it('should exclude funds locked in pending transactions from available amounts', () => {
      fc.assert(
        fc.property(
          fc.array(
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
                isActive: fc.boolean()
              })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          fc.float({ min: 500, max: 2000, noNaN: true }),
          (accounts: Account[], goalAmount: number) => {
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            accounts.forEach(account => {
              pathsToTarget.set(account.id, [
                {
                  fromAccountId: account.id,
                  toAccountId: 'target',
                  speed: 'instant' as any,
                  fee: 0,
                  isAvailable: true
                }
              ]);
            });
            
            const combinations = generateValidCombinations(accounts, goalAmount, pathsToTarget);
            
            // For each combination, verify that totalAvailable uses available balance (not raw balance)
            for (const combo of combinations) {
              const totalUsingAvailableBalance = combo.accounts.reduce(
                (sum, acc) => sum + calculateAvailableBalance(acc),
                0
              );
              
              const totalUsingRawBalance = combo.accounts.reduce(
                (sum, acc) => sum + acc.balance,
                0
              );
              
              // totalAvailable should match available balance calculation
              expect(Math.abs(combo.totalAvailable - totalUsingAvailableBalance)).toBeLessThan(0.01);
              
              // If there are pending debits, available should be less than raw balance
              const hasPendingDebits = combo.accounts.some(
                acc => acc.pendingTransactions.some(
                  t => t.status === TransactionStatus.PENDING && t.amount < 0
                )
              );
              
              if (hasPendingDebits) {
                expect(totalUsingAvailableBalance).toBeLessThan(totalUsingRawBalance);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include accounts with zero available balance due to pending transactions', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            // Account with zero available balance (balance = pending debits)
            fc.record({
              id: fc.constant('zero-balance'),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.constant(1000),
              pendingTransactions: fc.constant([
                {
                  id: 'pending-1',
                  accountId: 'zero-balance',
                  amount: -1000, // Exactly cancels balance
                  date: new Date(),
                  status: TransactionStatus.PENDING,
                  description: 'Pending debit',
                  category: undefined
                }
              ]),
              institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
              metadata: fc.record({
                lastUpdated: fc.date(),
                isActive: fc.boolean()
              })
            }),
            // Other accounts with positive available balance
            fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                name: fc.string({ minLength: 1 }),
                type: fc.constantFrom(...Object.values(AccountType)),
                balance: fc.float({ min: 500, max: 2000, noNaN: true }),
                pendingTransactions: fc.constant([]),
                institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
                metadata: fc.record({
                  lastUpdated: fc.date(),
                  isActive: fc.boolean()
                })
              }),
              { minLength: 2, maxLength: 4 }
            )
          ),
          ([zeroBalanceAccount, otherAccounts]: [Account, Account[]]) => {
            const allAccounts = [zeroBalanceAccount, ...otherAccounts];
            const goalAmount = 500;
            
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            allAccounts.forEach(account => {
              pathsToTarget.set(account.id, [
                {
                  fromAccountId: account.id,
                  toAccountId: 'target',
                  speed: 'instant' as any,
                  fee: 0,
                  isAvailable: true
                }
              ]);
            });
            
            const combinations = generateValidCombinations(allAccounts, goalAmount, pathsToTarget);
            
            // The zero-balance account should not appear in any combination
            for (const combo of combinations) {
              const hasZeroBalanceAccount = combo.accounts.some(acc => acc.id === 'zero-balance');
              expect(hasZeroBalanceAccount).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Balance sufficiency', () => {
    it('should ensure all included source accounts have sufficient available balance', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.float({ min: 100, max: 5000, noNaN: true }),
              pendingTransactions: fc.array(
                fc.record({
                  id: fc.string({ minLength: 1 }),
                  accountId: fc.string({ minLength: 1 }),
                  amount: fc.float({ min: -200, max: 200, noNaN: true }),
                  date: fc.date(),
                  status: fc.constantFrom(...Object.values(TransactionStatus)),
                  description: fc.string(),
                  category: fc.option(fc.string(), { nil: undefined })
                }),
                { maxLength: 3 }
              ),
              institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
              metadata: fc.record({
                lastUpdated: fc.date(),
                isActive: fc.boolean()
              })
            }),
            { minLength: 2, maxLength: 6 }
          ),
          fc.float({ min: 100, max: 3000, noNaN: true }),
          (accounts: Account[], goalAmount: number) => {
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            accounts.forEach(account => {
              pathsToTarget.set(account.id, [
                {
                  fromAccountId: account.id,
                  toAccountId: 'target',
                  speed: 'instant' as any,
                  fee: 0,
                  isAvailable: true
                }
              ]);
            });
            
            const combinations = generateValidCombinations(accounts, goalAmount, pathsToTarget);
            
            // Every account in every combination must have positive available balance
            for (const combo of combinations) {
              for (const account of combo.accounts) {
                const availableBalance = calculateAvailableBalance(account);
                expect(availableBalance).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only include accounts with paths to the target', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            // Accounts with paths
            fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                name: fc.string({ minLength: 1 }),
                type: fc.constantFrom(...Object.values(AccountType)),
                balance: fc.float({ min: 500, max: 2000, noNaN: true }),
                pendingTransactions: fc.constant([]),
                institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
                metadata: fc.record({
                  lastUpdated: fc.date(),
                  isActive: fc.boolean()
                })
              }),
              { minLength: 2, maxLength: 4 }
            ),
            // Accounts without paths
            fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 10 }),
                name: fc.string({ minLength: 1 }),
                type: fc.constantFrom(...Object.values(AccountType)),
                balance: fc.float({ min: 500, max: 2000, noNaN: true }),
                pendingTransactions: fc.constant([]),
                institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
                metadata: fc.record({
                  lastUpdated: fc.date(),
                  isActive: fc.boolean()
                })
              }),
              { minLength: 1, maxLength: 3 }
            )
          ),
          ([accountsWithPaths, accountsWithoutPaths]: [Account[], Account[]]) => {
            // Ensure all account IDs are unique
            const allIds = [...accountsWithPaths.map(a => a.id), ...accountsWithoutPaths.map(a => a.id)];
            const uniqueIds = new Set(allIds);
            fc.pre(allIds.length === uniqueIds.size);
            
            const allAccounts = [...accountsWithPaths, ...accountsWithoutPaths];
            const goalAmount = 500;
            
            // Only create paths for the first group
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            accountsWithPaths.forEach(account => {
              pathsToTarget.set(account.id, [
                {
                  fromAccountId: account.id,
                  toAccountId: 'target',
                  speed: 'instant' as any,
                  fee: 0,
                  isAvailable: true
                }
              ]);
            });
            
            // Accounts without paths get empty arrays
            accountsWithoutPaths.forEach(account => {
              pathsToTarget.set(account.id, []);
            });
            
            const combinations = generateValidCombinations(allAccounts, goalAmount, pathsToTarget);
            
            // No combination should include accounts without paths
            const accountsWithoutPathsIds = new Set(accountsWithoutPaths.map(a => a.id));
            for (const combo of combinations) {
              for (const account of combo.accounts) {
                expect(accountsWithoutPathsIds.has(account.id)).toBe(false);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect the maximum 5 accounts constraint', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.float({ min: 100, max: 1000, noNaN: true }),
              pendingTransactions: fc.constant([]),
              institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
              metadata: fc.record({
                lastUpdated: fc.date(),
                isActive: fc.boolean()
              })
            }),
            { minLength: 6, maxLength: 10 } // More than 5 accounts
          ),
          fc.float({ min: 50, max: 500, noNaN: true }),
          (accounts: Account[], goalAmount: number) => {
            const pathsToTarget = new Map<string, TransferRelationship[]>();
            accounts.forEach(account => {
              pathsToTarget.set(account.id, [
                {
                  fromAccountId: account.id,
                  toAccountId: 'target',
                  speed: 'instant' as any,
                  fee: 0,
                  isAvailable: true
                }
              ]);
            });
            
            const combinations = generateValidCombinations(accounts, goalAmount, pathsToTarget);
            
            // No combination should have more than 5 accounts
            for (const combo of combinations) {
              expect(combo.accounts.length).toBeLessThanOrEqual(5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

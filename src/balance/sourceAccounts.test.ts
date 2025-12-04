/**
 * Property-based tests for source account identification
 * 
 * Feature: transfer-routing-algorithm, Property 2: Source account identification
 * Validates: Requirements 1.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { identifySourceAccounts } from './sourceAccounts';
import { calculateAvailableBalance } from './availableBalance';
import { Account, Transaction, TransactionStatus, AccountType } from '../types';

describe('Source Account Identification - Property Tests', () => {
  describe('Property 2: Source account identification', () => {
    it('should identify exactly those accounts with available balance > 0', () => {
      fc.assert(
        fc.property(
          // Generate an array of accounts with varying balances and pending transactions
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.float({ min: -1000, max: 10000, noNaN: true }),
              pendingTransactions: fc.array(
                fc.record({
                  id: fc.string({ minLength: 1 }),
                  accountId: fc.string({ minLength: 1 }),
                  amount: fc.float({ min: -1000, max: 1000, noNaN: true }),
                  date: fc.date(),
                  status: fc.constantFrom(...Object.values(TransactionStatus)),
                  description: fc.string(),
                  category: fc.option(fc.string(), { nil: undefined })
                }),
                { maxLength: 10 }
              ),
              institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
              metadata: fc.record({
                lastUpdated: fc.date(),
                isActive: fc.boolean()
              })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (accounts: Account[]) => {
            const result = identifySourceAccounts(accounts);
            
            // Every account in the result should have available balance > 0
            for (const account of result) {
              const availableBalance = calculateAvailableBalance(account);
              expect(availableBalance).toBeGreaterThan(0);
            }
            
            // Every account with available balance > 0 should be in the result
            for (const account of accounts) {
              const availableBalance = calculateAvailableBalance(account);
              const isInResult = result.some(a => a.id === account.id);
              
              if (availableBalance > 0) {
                expect(isInResult).toBe(true);
              } else {
                expect(isInResult).toBe(false);
              }
            }
            
            // The result should have the correct length
            const expectedCount = accounts.filter(a => calculateAvailableBalance(a) > 0).length;
            expect(result.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty array when all accounts have zero or negative available balance', () => {
      fc.assert(
        fc.property(
          // Generate accounts with zero or negative available balance
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.float({ min: 0, max: 1000, noNaN: true }),
              pendingTransactions: fc.array(
                fc.record({
                  id: fc.string({ minLength: 1 }),
                  accountId: fc.string({ minLength: 1 }),
                  // Generate large pending debits to ensure negative available balance
                  amount: fc.float({ min: -2000, max: -1000, noNaN: true }),
                  date: fc.date(),
                  status: fc.constant(TransactionStatus.PENDING),
                  description: fc.string(),
                  category: fc.option(fc.string(), { nil: undefined })
                }),
                { minLength: 1, maxLength: 5 }
              ),
              institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
              metadata: fc.record({
                lastUpdated: fc.date(),
                isActive: fc.boolean()
              })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (accounts: Account[]) => {
            const result = identifySourceAccounts(accounts);
            
            // Verify all accounts actually have non-positive available balance
            const allNonPositive = accounts.every(a => calculateAvailableBalance(a) <= 0);
            
            if (allNonPositive) {
              expect(result).toEqual([]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all accounts when all have positive available balance', () => {
      fc.assert(
        fc.property(
          // Generate accounts with guaranteed positive available balance
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.float({ min: 1000, max: 10000, noNaN: true }),
              pendingTransactions: fc.array(
                fc.record({
                  id: fc.string({ minLength: 1 }),
                  accountId: fc.string({ minLength: 1 }),
                  // Small debits to ensure balance stays positive
                  amount: fc.float({ min: -100, max: 100, noNaN: true }),
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
            { minLength: 1, maxLength: 10 }
          ),
          (accounts: Account[]) => {
            const result = identifySourceAccounts(accounts);
            
            // Verify all accounts actually have positive available balance
            const allPositive = accounts.every(a => calculateAvailableBalance(a) > 0);
            
            if (allPositive) {
              expect(result.length).toBe(accounts.length);
              // All original accounts should be in the result
              for (const account of accounts) {
                expect(result.some(a => a.id === account.id)).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty account array', () => {
      const result = identifySourceAccounts([]);
      expect(result).toEqual([]);
    });

    it('should preserve account object references for identified accounts', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 }),
              type: fc.constantFrom(...Object.values(AccountType)),
              balance: fc.float({ min: 100, max: 10000, noNaN: true }),
              pendingTransactions: fc.constant([]),
              institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
              metadata: fc.record({
                lastUpdated: fc.date(),
                isActive: fc.boolean()
              })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (accounts: Account[]) => {
            const result = identifySourceAccounts(accounts);
            
            // Each result account should be the exact same reference as in the input
            for (const resultAccount of result) {
              const originalAccount = accounts.find(a => a.id === resultAccount.id);
              expect(resultAccount).toBe(originalAccount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

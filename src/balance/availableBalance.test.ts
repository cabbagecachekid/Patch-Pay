/**
 * Property-based tests for available balance calculation
 * 
 * Feature: transfer-routing-algorithm, Property 1: Available balance calculation
 * Validates: Requirements 1.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateAvailableBalance } from './availableBalance';
import { Account, Transaction, TransactionStatus, AccountType } from '../types';

describe('Available Balance Calculation - Property Tests', () => {
  describe('Property 1: Available balance calculation', () => {
    it('should equal account balance minus sum of pending debit amounts', () => {
      fc.assert(
        fc.property(
          // Generate account with random balance and pending transactions
          fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            type: fc.constantFrom(...Object.values(AccountType)),
            balance: fc.float({ min: 0, max: 10000, noNaN: true }),
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
          (account: Account) => {
            const result = calculateAvailableBalance(account);
            
            // Calculate expected available balance manually
            const pendingDebits = account.pendingTransactions
              .filter(t => t.status === TransactionStatus.PENDING && t.amount < 0)
              .reduce((sum, t) => sum + t.amount, 0);
            
            const expected = account.balance + pendingDebits; // pendingDebits is negative
            
            // Use approximate equality for floating point comparison
            expect(Math.abs(result - expected)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return account balance when there are no pending transactions', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            type: fc.constantFrom(...Object.values(AccountType)),
            balance: fc.float({ min: 0, max: 10000, noNaN: true }),
            pendingTransactions: fc.constant([]),
            institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
            metadata: fc.record({
              lastUpdated: fc.date(),
              isActive: fc.boolean()
            })
          }),
          (account: Account) => {
            const result = calculateAvailableBalance(account);
            
            expect(Math.abs(result - account.balance)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return account balance when all pending transactions are credits', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            type: fc.constantFrom(...Object.values(AccountType)),
            balance: fc.float({ min: 0, max: 10000, noNaN: true }),
            pendingTransactions: fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                accountId: fc.string({ minLength: 1 }),
                amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }), // Only positive amounts
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
          (account: Account) => {
            const result = calculateAvailableBalance(account);
            
            // When all pending transactions are credits, available balance should equal account balance
            expect(Math.abs(result - account.balance)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should subtract only pending debits, not cleared or failed transactions', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            type: fc.constantFrom(...Object.values(AccountType)),
            balance: fc.float({ min: 1000, max: 10000, noNaN: true }),
            pendingTransactions: fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                accountId: fc.string({ minLength: 1 }),
                amount: fc.float({ min: Math.fround(-1000), max: Math.fround(-0.01), noNaN: true }), // Only debits
                date: fc.date(),
                status: fc.constantFrom(TransactionStatus.CLEARED, TransactionStatus.FAILED),
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
          (account: Account) => {
            const result = calculateAvailableBalance(account);
            
            // Cleared and failed transactions should not affect available balance
            expect(Math.abs(result - account.balance)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle accounts with only pending debits correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1 }),
            name: fc.string({ minLength: 1 }),
            type: fc.constantFrom(...Object.values(AccountType)),
            balance: fc.float({ min: 1000, max: 10000, noNaN: true }),
            pendingTransactions: fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                accountId: fc.string({ minLength: 1 }),
                amount: fc.float({ min: Math.fround(-500), max: Math.fround(-0.01), noNaN: true }), // Only debits
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
          (account: Account) => {
            const result = calculateAvailableBalance(account);
            
            // Calculate expected: balance minus all pending debits
            const totalPendingDebits = account.pendingTransactions
              .reduce((sum, t) => sum + t.amount, 0);
            
            const expected = account.balance + totalPendingDebits; // totalPendingDebits is negative
            
            expect(Math.abs(result - expected)).toBeLessThan(0.01);
            // Available balance should be less than account balance
            expect(result).toBeLessThan(account.balance);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

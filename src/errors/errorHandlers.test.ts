/**
 * Property-based tests for error handling
 * 
 * Feature: transfer-routing-algorithm, Property 29: Insufficient funds error
 * Feature: transfer-routing-algorithm, Property 30: Error excludes routes
 * Validates: Requirements 1.4, 8.2, 8.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  checkPastDeadline,
  checkInsufficientFunds,
  checkNoPath,
  createErrorResponse
} from './errorHandlers';
import { Account, AccountType, TransactionStatus, TransferRelationship, TransferSpeed } from '../types';

describe('Error Handling - Property Tests', () => {
  describe('Property 29: Insufficient funds error', () => {
    it('should return insufficient_funds error when total available funds are less than goal amount', () => {
      fc.assert(
        fc.property(
          // Generate accounts with controlled total balance
          fc.tuple(
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
                    amount: fc.float({ min: -100, max: 0, noNaN: true }), // Only debits
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
                  isActive: fc.boolean()
                })
              }),
              { minLength: 1, maxLength: 5 }
            ),
            fc.float({ min: 5000, max: 10000, noNaN: true }) // Goal amount larger than possible balance
          ),
          ([accounts, goalAmount]: [Account[], number]) => {
            const result = checkInsufficientFunds(accounts, goalAmount);
            
            // Calculate total available balance manually
            const totalAvailable = accounts.reduce((sum, account) => {
              const pendingDebits = account.pendingTransactions
                .filter(t => t.status === TransactionStatus.PENDING && t.amount < 0)
                .reduce((s, t) => s + t.amount, 0);
              return sum + account.balance + pendingDebits;
            }, 0);
            
            if (totalAvailable < goalAmount) {
              expect(result.insufficient).toBe(true);
              expect(result.shortfall).toBeCloseTo(goalAmount - totalAvailable, 2);
              expect(result.shortfall).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return correct shortfall amount when funds are insufficient', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                name: fc.string({ minLength: 1 }),
                type: fc.constantFrom(...Object.values(AccountType)),
                balance: fc.float({ min: 0, max: 500, noNaN: true }),
                pendingTransactions: fc.constant([]),
                institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
                metadata: fc.record({
                  lastUpdated: fc.date(),
                  isActive: fc.boolean()
                })
              }),
              { minLength: 1, maxLength: 3 }
            ),
            fc.float({ min: 2000, max: 5000, noNaN: true })
          ),
          ([accounts, goalAmount]: [Account[], number]) => {
            const result = checkInsufficientFunds(accounts, goalAmount);
            
            const totalAvailable = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            const expectedShortfall = goalAmount - totalAvailable;
            
            expect(result.insufficient).toBe(true);
            expect(result.shortfall).toBeCloseTo(expectedShortfall, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return insufficient=false when funds are sufficient', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.array(
              fc.record({
                id: fc.string({ minLength: 1 }),
                name: fc.string({ minLength: 1 }),
                type: fc.constantFrom(...Object.values(AccountType)),
                balance: fc.float({ min: 1000, max: 5000, noNaN: true }),
                pendingTransactions: fc.constant([]),
                institutionType: fc.constantFrom('traditional_bank', 'neobank') as fc.Arbitrary<'traditional_bank' | 'neobank'>,
                metadata: fc.record({
                  lastUpdated: fc.date(),
                  isActive: fc.boolean()
                })
              }),
              { minLength: 1, maxLength: 3 }
            ),
            fc.float({ min: 10, max: 500, noNaN: true })
          ),
          ([accounts, goalAmount]: [Account[], number]) => {
            const result = checkInsufficientFunds(accounts, goalAmount);
            
            const totalAvailable = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            
            if (totalAvailable >= goalAmount) {
              expect(result.insufficient).toBe(false);
              expect(result.shortfall).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create error response with shortfall for insufficient funds', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          (shortfall: number) => {
            const error = createErrorResponse('insufficient_funds', shortfall);
            
            expect(error.error).toBe('insufficient_funds');
            expect(error.message).toContain('Insufficient funds');
            expect(error.message).toContain(shortfall.toFixed(2));
            expect(error.shortfall).toBe(shortfall);
            // Validates Requirements 8.5: Error should not include routes
            expect(error).not.toHaveProperty('routes');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 30: Error excludes routes', () => {
    it('should not include routes property in past_deadline error', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const error = createErrorResponse('past_deadline');
            
            expect(error.error).toBe('past_deadline');
            expect(error.message).toBe('Deadline has already passed');
            // Validates Requirements 8.5: Error should not include routes
            expect(error).not.toHaveProperty('routes');
            expect(Object.keys(error)).toEqual(['error', 'message']);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include routes property in insufficient_funds error', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
          (shortfall: number) => {
            const error = createErrorResponse('insufficient_funds', shortfall);
            
            expect(error.error).toBe('insufficient_funds');
            // Validates Requirements 8.5: Error should not include routes
            expect(error).not.toHaveProperty('routes');
            expect(Object.keys(error).sort()).toEqual(['error', 'message', 'shortfall'].sort());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include routes property in no_path error', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          (suggestion: string | undefined) => {
            const error = createErrorResponse('no_path', undefined, suggestion);
            
            expect(error.error).toBe('no_path');
            expect(error.message).toContain('No transfer path exists');
            // Validates Requirements 8.5: Error should not include routes
            expect(error).not.toHaveProperty('routes');
            
            if (suggestion) {
              expect(error.suggestion).toBe(suggestion);
              expect(error.message).toContain(suggestion);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure all error types exclude routes property', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('past_deadline', 'insufficient_funds', 'no_path') as fc.Arbitrary<'past_deadline' | 'insufficient_funds' | 'no_path'>,
          fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }), { nil: undefined }),
          fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          (errorType, shortfall, suggestion) => {
            const error = createErrorResponse(errorType, shortfall, suggestion);
            
            expect(error.error).toBe(errorType);
            expect(error.message).toBeTruthy();
            // Validates Requirements 8.5: Error should not include routes
            expect(error).not.toHaveProperty('routes');
            expect(error).not.toHaveProperty('allRoutesRisky');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional error handling properties', () => {
    it('should correctly identify past deadlines', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.integer({ min: 1, max: 86400000 }), // 1ms to 1 day in milliseconds
          (currentTime: Date, offset: number) => {
            const pastDeadline = new Date(currentTime.getTime() - offset);
            const futureDeadline = new Date(currentTime.getTime() + offset);
            
            expect(checkPastDeadline(pastDeadline, currentTime)).toBe(true);
            expect(checkPastDeadline(futureDeadline, currentTime)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify no path scenarios', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
          (targetId: string, unconnectedId: string, sourceIds: string[]) => {
            // Create transfer matrix with no connections to target
            const transferMatrix: TransferRelationship[] = sourceIds.map(sourceId => ({
              fromAccountId: sourceId,
              toAccountId: unconnectedId, // Not the target
              speed: TransferSpeed.INSTANT,
              fee: 0,
              isAvailable: true
            }));
            
            const result = checkNoPath(targetId, transferMatrix, sourceIds);
            
            if (targetId !== unconnectedId && !sourceIds.includes(targetId)) {
              expect(result.noPath).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

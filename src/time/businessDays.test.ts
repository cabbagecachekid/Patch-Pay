/**
 * Property-based tests for business day utilities
 * 
 * Feature: transfer-routing-algorithm, Property 31: Business day classification
 * Validates: Requirements 9.1, 9.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isBusinessDay, addBusinessDays, getNextBusinessDay } from './businessDays';

describe('Business Day Utilities - Property Tests', () => {
  describe('Property 31: Business day classification', () => {
    it('should classify Monday through Friday as business days', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const dayOfWeek = date.getUTCDay();
            const expectedBusinessDay = dayOfWeek >= 1 && dayOfWeek <= 5;
            const actualBusinessDay = isBusinessDay(date);
            
            expect(actualBusinessDay).toBe(expectedBusinessDay);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify Saturday and Sunday as non-business days', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const dayOfWeek = date.getUTCDay();
            
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              // Saturday or Sunday should not be business days
              expect(isBusinessDay(date)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('addBusinessDays - Properties', () => {
    it('should never return a weekend date when adding business days', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          fc.integer({ min: 1, max: 20 }),
          (startDate, daysToAdd) => {
            const result = addBusinessDays(startDate, daysToAdd);
            
            // The result should be a business day
            expect(isBusinessDay(result)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should add exactly N business days (not calendar days)', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          fc.integer({ min: 1, max: 10 }),
          (startDate, daysToAdd) => {
            const result = addBusinessDays(startDate, daysToAdd);
            
            // Count business days between start and result
            let count = 0;
            const current = new Date(startDate);
            
            while (current < result) {
              current.setUTCDate(current.getUTCDate() + 1);
              if (isBusinessDay(current)) {
                count++;
              }
            }
            
            expect(count).toBe(daysToAdd);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return the same date when adding 0 business days', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (startDate) => {
            const result = addBusinessDays(startDate, 0);
            
            expect(result.getTime()).toBe(startDate.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always move forward in time when adding positive business days', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          fc.integer({ min: 1, max: 20 }),
          (startDate, daysToAdd) => {
            const result = addBusinessDays(startDate, daysToAdd);
            
            expect(result.getTime()).toBeGreaterThan(startDate.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('getNextBusinessDay - Properties', () => {
    it('should always return a business day', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const result = getNextBusinessDay(date);
            
            expect(isBusinessDay(result)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return a date in the future', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const result = getNextBusinessDay(date);
            
            expect(result.getTime()).toBeGreaterThan(date.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return Monday when given Friday, Saturday, or Sunday', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const dayOfWeek = date.getUTCDay();
            
            if (dayOfWeek === 5) {
              // Friday -> next business day should be Monday (3 days later)
              const result = getNextBusinessDay(date);
              expect(result.getUTCDay()).toBe(1); // Monday
            } else if (dayOfWeek === 6) {
              // Saturday -> next business day should be Monday (2 days later)
              const result = getNextBusinessDay(date);
              expect(result.getUTCDay()).toBe(1); // Monday
            } else if (dayOfWeek === 0) {
              // Sunday -> next business day should be Monday (1 day later)
              const result = getNextBusinessDay(date);
              expect(result.getUTCDay()).toBe(1); // Monday
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return the next weekday when given a weekday', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const dayOfWeek = date.getUTCDay();
            
            if (dayOfWeek >= 1 && dayOfWeek <= 4) {
              // Monday through Thursday -> next business day should be tomorrow
              const result = getNextBusinessDay(date);
              const expectedDay = dayOfWeek + 1;
              expect(result.getUTCDay()).toBe(expectedDay);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

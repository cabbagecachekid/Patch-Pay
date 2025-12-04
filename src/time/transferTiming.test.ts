/**
 * Property-based tests for transfer timing estimation
 * 
 * Feature: transfer-routing-algorithm
 * Properties: 11, 12, 13, 14, 15, 16, 32
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  estimateInstantArrival,
  estimateSameDayArrival,
  estimateOneDayArrival,
  estimateThreeDayArrival,
  estimateArrivalTime
} from './transferTiming.js';
import { TransferSpeed } from '../types/index.js';
import { isBusinessDay, addBusinessDays } from './businessDays.js';

/**
 * EST timezone offset in hours (UTC-5)
 */
const EST_OFFSET_HOURS = -5;
const EST_OFFSET_MS = EST_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Helper to get EST date components from a UTC date
 * Returns an object with year, month, day, hour in EST
 */
function getESTComponents(date: Date): { year: number; month: number; day: number; hour: number; dayOfWeek: number } {
  // Shift the time by EST offset to get EST time
  const estMs = date.getTime() + EST_OFFSET_MS;
  const estDate = new Date(estMs);
  
  return {
    year: estDate.getUTCFullYear(),
    month: estDate.getUTCMonth(),
    day: estDate.getUTCDate(),
    hour: estDate.getUTCHours(),
    dayOfWeek: estDate.getUTCDay()
  };
}

/**
 * Helper to create a UTC date from EST components
 */
function createUTCFromEST(year: number, month: number, day: number, hour: number = 0, minute: number = 0): Date {
  // Create a date in "EST" (treating UTC as EST)
  const estDate = new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
  // Shift back to UTC
  return new Date(estDate.getTime() - EST_OFFSET_MS);
}

/**
 * Helper to check if a date is before 5pm EST on a business day
 * Matches the implementation's isBeforeCutoff logic
 */
function isBeforeFivePmEST(date: Date): boolean {
  const est = getESTComponents(date);
  
  // Check if it's a business day in EST
  const estDate = createUTCFromEST(est.year, est.month, est.day);
  if (!isBusinessDay(estDate)) {
    return false;
  }
  
  return est.hour < 17;
}

describe('Transfer Timing Estimation - Property Tests', () => {
  
  describe('Property 11: Instant transfer timing', () => {
    it('should set arrival to current time plus 5 minutes for any initiation time', () => {
      // Feature: transfer-routing-algorithm, Property 11: Instant transfer timing
      // Validates: Requirements 4.1
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (initiationTime) => {
            const arrival = estimateInstantArrival(initiationTime);
            
            // Calculate expected arrival (5 minutes later)
            const expected = new Date(initiationTime);
            expected.setMinutes(expected.getMinutes() + 5);
            
            // Should be exactly 5 minutes later
            const diffMs = arrival.getTime() - initiationTime.getTime();
            const diffMinutes = diffMs / (1000 * 60);
            
            expect(diffMinutes).toBe(5);
            expect(arrival.getTime()).toBe(expected.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 32: Instant transfer weekend availability', () => {
    it('should complete instant transfers on weekends without delay to Monday', () => {
      // Feature: transfer-routing-algorithm, Property 32: Instant transfer weekend availability
      // Validates: Requirements 9.4
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const dayOfWeek = date.getDay();
            
            // Only test weekend dates
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              const arrival = estimateInstantArrival(date);
              
              // Should still be 5 minutes later, not delayed to Monday
              const diffMs = arrival.getTime() - date.getTime();
              const diffMinutes = diffMs / (1000 * 60);
              
              expect(diffMinutes).toBe(5);
              
              // The arrival day should be the same or next day (if crossing midnight)
              // but definitely not Monday unless it naturally falls on Monday
              const daysDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              expect(daysDiff).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Same-day transfer timing (business hours)', () => {
    it('should arrive by end of current business day when initiated before 5pm EST on a business day', () => {
      // Feature: transfer-routing-algorithm, Property 12: Same-day transfer timing (business hours)
      // Validates: Requirements 4.2
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            // Only test business days before 5pm EST
            if (isBeforeFivePmEST(date)) {
              const arrival = estimateSameDayArrival(date);
              
              // Get EST components for both dates
              const estInit = getESTComponents(date);
              const estArr = getESTComponents(arrival);
              
              // Arrival should be on the same EST calendar day
              expect(estArr.year).toBe(estInit.year);
              expect(estArr.month).toBe(estInit.month);
              expect(estArr.day).toBe(estInit.day);
              
              // Arrival should be at 5pm EST (17:00)
              expect(estArr.hour).toBe(17);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: Same-day transfer timing (after hours)', () => {
    it('should arrive by end of next business day when initiated after 5pm EST or on weekend', () => {
      // Feature: transfer-routing-algorithm, Property 13: Same-day transfer timing (after hours)
      // Validates: Requirements 4.3
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const estInit = getESTComponents(date);
            const estInitDate = createUTCFromEST(estInit.year, estInit.month, estInit.day);
            
            const isAfterHours = isBusinessDay(estInitDate) && !isBeforeFivePmEST(date);
            const isWeekend = !isBusinessDay(estInitDate);
            
            // Only test after hours or weekend
            if (isAfterHours || isWeekend) {
              const arrival = estimateSameDayArrival(date);
              const estArr = getESTComponents(arrival);
              const estArrDate = createUTCFromEST(estArr.year, estArr.month, estArr.day);
              
              // Should arrive on a business day (in EST)
              expect(isBusinessDay(estArrDate)).toBe(true);
              
              // Should be in the future
              expect(arrival.getTime()).toBeGreaterThan(date.getTime());
              
              // Should be at 5pm EST
              expect(estArr.hour).toBe(17);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: One-day ACH timing (weekday)', () => {
    it('should arrive next business day when initiated Mon-Thu before 5pm EST', () => {
      // Feature: transfer-routing-algorithm, Property 14: One-day ACH timing (weekday)
      // Validates: Requirements 4.4
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const estInit = getESTComponents(date);
            const dayOfWeek = estInit.dayOfWeek;
            
            // Only test Mon-Thu before 5pm EST
            if (dayOfWeek >= 1 && dayOfWeek <= 4 && isBeforeFivePmEST(date)) {
              const arrival = estimateOneDayArrival(date);
              const estArr = getESTComponents(arrival);
              
              // Should arrive on a business day (in EST)
              const estArrDate = createUTCFromEST(estArr.year, estArr.month, estArr.day);
              expect(isBusinessDay(estArrDate)).toBe(true);
              
              // Should be the next business day (tomorrow in EST for Mon-Thu)
              // Calculate expected tomorrow by adding 1 day to the EST date
              const estInitDate = createUTCFromEST(estInit.year, estInit.month, estInit.day);
              const expectedTomorrow = new Date(estInitDate);
              expectedTomorrow.setUTCDate(expectedTomorrow.getUTCDate() + 1);
              const expectedComponents = getESTComponents(expectedTomorrow);
              
              expect(estArr.year).toBe(expectedComponents.year);
              expect(estArr.month).toBe(expectedComponents.month);
              expect(estArr.day).toBe(expectedComponents.day);
              expect(estArr.dayOfWeek).toBe(dayOfWeek + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: One-day ACH timing (weekend)', () => {
    it('should arrive Tuesday when initiated Friday through Sunday', () => {
      // Feature: transfer-routing-algorithm, Property 15: One-day ACH timing (weekend)
      // Validates: Requirements 4.5, 9.3
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const estInit = getESTComponents(date);
            const dayOfWeek = estInit.dayOfWeek;
            
            // Test Friday, Saturday, Sunday in EST
            // Also test Thursday after 5pm EST (which effectively becomes Friday)
            const isFriday = dayOfWeek === 5;
            const isSaturday = dayOfWeek === 6;
            const isSunday = dayOfWeek === 0;
            const isThursdayAfterCutoff = dayOfWeek === 4 && !isBeforeFivePmEST(date);
            
            if (isFriday || isSaturday || isSunday || isThursdayAfterCutoff) {
              const arrival = estimateOneDayArrival(date);
              const estArr = getESTComponents(arrival);
              
              // Should arrive on Tuesday (day 2) in EST
              expect(estArr.dayOfWeek).toBe(2);
              
              // Should be a business day (in EST)
              const estArrDate = createUTCFromEST(estArr.year, estArr.month, estArr.day);
              expect(isBusinessDay(estArrDate)).toBe(true);
              
              // Should be in the future
              expect(arrival.getTime()).toBeGreaterThan(date.getTime());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 16: Three-day ACH timing', () => {
    it('should add exactly 3 business days, skipping weekends', () => {
      // Feature: transfer-routing-algorithm, Property 16: Three-day ACH timing
      // Validates: Requirements 4.6
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          (initiationTime) => {
            const arrival = estimateThreeDayArrival(initiationTime);
            
            // Count business days between initiation and arrival (in EST)
            // The implementation adds 3 business days FROM initiation
            // So if we start on Monday, we should arrive on Thursday (Mon->Tue->Wed->Thu = 3 days forward)
            const estInit = getESTComponents(initiationTime);
            const estArr = getESTComponents(arrival);
            
            // Create EST dates as UTC for comparison
            const initDate = createUTCFromEST(estInit.year, estInit.month, estInit.day);
            const arrivalDate = createUTCFromEST(estArr.year, estArr.month, estArr.day);
            
            // Count business days by simulating addBusinessDays
            let count = 0;
            const testDate = new Date(initDate);
            while (count < 3) {
              testDate.setUTCDate(testDate.getUTCDate() + 1);
              if (isBusinessDay(testDate)) {
                count++;
              }
            }
            
            // The test date should now match the arrival date
            expect(testDate.getUTCFullYear()).toBe(arrivalDate.getUTCFullYear());
            expect(testDate.getUTCMonth()).toBe(arrivalDate.getUTCMonth());
            expect(testDate.getUTCDate()).toBe(arrivalDate.getUTCDate());
            
            // Arrival should be on a business day (in EST)
            expect(isBusinessDay(arrivalDate)).toBe(true);
            
            // Should be in the future
            expect(arrival.getTime()).toBeGreaterThan(initiationTime.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have arrival date match 3 business days from initiation', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          (initiationTime) => {
            const arrival = estimateThreeDayArrival(initiationTime);
            
            // The arrival should be 3 business days after initiation (in EST calendar days)
            // Count business days from initiation EST date to arrival EST date
            const estInit = getESTComponents(initiationTime);
            const estArr = getESTComponents(arrival);
            
            let count = 0;
            const current = createUTCFromEST(estInit.year, estInit.month, estInit.day);
            const arrivalDate = createUTCFromEST(estArr.year, estArr.month, estArr.day);
            
            while (current < arrivalDate) {
              current.setUTCDate(current.getUTCDate() + 1);
              if (isBusinessDay(current)) {
                count++;
              }
            }
            
            // Should be exactly 3 business days
            expect(count).toBe(3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('estimateArrivalTime - Dispatcher', () => {
    it('should correctly dispatch to instant arrival for INSTANT speed', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const arrival = estimateArrivalTime(TransferSpeed.INSTANT, date);
            const expected = estimateInstantArrival(date);
            
            expect(arrival.getTime()).toBe(expected.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly dispatch to same-day arrival for SAME_DAY speed', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const arrival = estimateArrivalTime(TransferSpeed.SAME_DAY, date);
            const expected = estimateSameDayArrival(date);
            
            expect(arrival.getTime()).toBe(expected.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly dispatch to one-day arrival for ONE_DAY speed', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          (date) => {
            const arrival = estimateArrivalTime(TransferSpeed.ONE_DAY, date);
            const expected = estimateOneDayArrival(date);
            
            expect(arrival.getTime()).toBe(expected.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly dispatch to three-day arrival for THREE_DAY speed', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          (date) => {
            const arrival = estimateArrivalTime(TransferSpeed.THREE_DAY, date);
            const expected = estimateThreeDayArrival(date);
            
            expect(arrival.getTime()).toBe(expected.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

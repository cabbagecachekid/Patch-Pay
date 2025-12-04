/**
 * Property-based tests for risk assessment
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateTimingRisk,
  calculateReliabilityRisk,
  calculateComplexityRisk,
  calculateRiskScore,
  classifyRiskLevel
} from './riskCalculator';
import { Route, TransferSpeed, TransferStep } from '../types';

// Helper to create a minimal route for testing
function createTestRoute(
  steps: TransferStep[],
  estimatedArrival: Date
): Route {
  const totalFees = steps.reduce((sum, step) => sum + step.fee, 0);
  
  return {
    category: 'recommended',
    steps,
    totalFees,
    estimatedArrival,
    riskLevel: 'low',
    riskScore: 0,
    reasoning: 'Test route'
  };
}

// Arbitrary for transfer steps
const arbTransferStep = (method: TransferSpeed, arrival: Date): fc.Arbitrary<TransferStep> => {
  return fc.record({
    fromAccountId: fc.string({ minLength: 1 }),
    toAccountId: fc.string({ minLength: 1 }),
    amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    method: fc.constant(method),
    fee: fc.double({ min: 0, max: 100, noNaN: true }),
    estimatedArrival: fc.constant(arrival)
  });
};

describe('Risk Calculator - Property Tests', () => {
  // Feature: transfer-routing-algorithm, Property 20: Timing risk calculation
  describe('Property 20: Timing risk calculation', () => {
    it('should return 100 when estimated arrival is after deadline', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 1000 }),
          (deadline, delayMs) => {
            const estimatedArrival = new Date(deadline.getTime() + delayMs);
            const risk = calculateTimingRisk(estimatedArrival, deadline);
            expect(risk).toBe(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 when buffer exceeds 48 hours', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 49, max: 1000 }),
          (deadline, bufferHours) => {
            const bufferMs = bufferHours * 60 * 60 * 1000;
            const estimatedArrival = new Date(deadline.getTime() - bufferMs);
            const risk = calculateTimingRisk(estimatedArrival, deadline);
            expect(risk).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 20 when buffer is between 24 and 48 hours', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.double({ min: 24, max: 48, noNaN: true }),
          (deadline, bufferHours) => {
            const bufferMs = bufferHours * 60 * 60 * 1000;
            const estimatedArrival = new Date(deadline.getTime() - bufferMs);
            const risk = calculateTimingRisk(estimatedArrival, deadline);
            expect(risk).toBe(20);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 50 when buffer is between 6 and 24 hours', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.double({ min: 6.01, max: 23.99, noNaN: true }),
          (deadline, bufferHours) => {
            const bufferMs = bufferHours * 60 * 60 * 1000;
            const estimatedArrival = new Date(deadline.getTime() - bufferMs);
            const risk = calculateTimingRisk(estimatedArrival, deadline);
            expect(risk).toBe(50);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 80 when buffer is less than 6 hours', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.double({ min: 0, max: 5.99, noNaN: true, noDefaultInfinity: true }),
          (deadline, bufferHours) => {
            const bufferMs = bufferHours * 60 * 60 * 1000;
            const estimatedArrival = new Date(deadline.getTime() - bufferMs);
            const risk = calculateTimingRisk(estimatedArrival, deadline);
            expect(risk).toBe(80);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: transfer-routing-algorithm, Property 21: Reliability risk calculation
  describe('Property 21: Reliability risk calculation', () => {
    it('should return 0 when all transfers use instant method', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          (stepCount, arrival) => {
            const steps = Array.from({ length: stepCount }, (_, i) =>
              fc.sample(arbTransferStep(TransferSpeed.INSTANT, arrival), 1)[0]
            );
            const route = createTestRoute(steps, arrival);
            const risk = calculateReliabilityRisk(route);
            expect(risk).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 30 when transfers use mix of instant and ACH methods', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.constantFrom(TransferSpeed.SAME_DAY, TransferSpeed.ONE_DAY, TransferSpeed.THREE_DAY),
          (arrival, achMethod) => {
            const instantStep = fc.sample(arbTransferStep(TransferSpeed.INSTANT, arrival), 1)[0];
            const achStep = fc.sample(arbTransferStep(achMethod, arrival), 1)[0];
            const route = createTestRoute([instantStep, achStep], arrival);
            const risk = calculateReliabilityRisk(route);
            expect(risk).toBe(30);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 50 when all transfers use ACH method', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.constantFrom(TransferSpeed.SAME_DAY, TransferSpeed.ONE_DAY, TransferSpeed.THREE_DAY),
          (stepCount, arrival, achMethod) => {
            const steps = Array.from({ length: stepCount }, (_, i) =>
              fc.sample(arbTransferStep(achMethod, arrival), 1)[0]
            );
            const route = createTestRoute(steps, arrival);
            const risk = calculateReliabilityRisk(route);
            expect(risk).toBe(50);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: transfer-routing-algorithm, Property 22: Complexity risk calculation
  describe('Property 22: Complexity risk calculation', () => {
    it('should return 0 when route has 1 step', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          (arrival) => {
            const step = fc.sample(arbTransferStep(TransferSpeed.INSTANT, arrival), 1)[0];
            const route = createTestRoute([step], arrival);
            const risk = calculateComplexityRisk(route);
            expect(risk).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 20 when route has 2-3 steps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 3 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          (stepCount, arrival) => {
            const steps = Array.from({ length: stepCount }, (_, i) =>
              fc.sample(arbTransferStep(TransferSpeed.INSTANT, arrival), 1)[0]
            );
            const route = createTestRoute(steps, arrival);
            const risk = calculateComplexityRisk(route);
            expect(risk).toBe(20);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 40 when route has 4 or more steps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 4, max: 10 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          (stepCount, arrival) => {
            const steps = Array.from({ length: stepCount }, (_, i) =>
              fc.sample(arbTransferStep(TransferSpeed.INSTANT, arrival), 1)[0]
            );
            const route = createTestRoute(steps, arrival);
            const risk = calculateComplexityRisk(route);
            expect(risk).toBe(40);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: transfer-routing-algorithm, Property 23: Risk level classification
  describe('Property 23: Risk level classification', () => {
    it('should return "low" when risk score is 0-30', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 30, noNaN: true }),
          (score) => {
            const level = classifyRiskLevel(score);
            expect(level).toBe('low');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "medium" when risk score is 31-60', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 31, max: 60, noNaN: true }),
          (score) => {
            const level = classifyRiskLevel(score);
            expect(level).toBe('medium');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return "high" when risk score is 61-100', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 61, max: 100, noNaN: true }),
          (score) => {
            const level = classifyRiskLevel(score);
            expect(level).toBe('high');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: transfer-routing-algorithm, Property 19: Risk score calculation
  describe('Property 19: Risk score calculation', () => {
    it('should calculate risk score as weighted sum: timing*0.5 + reliability*0.3 + complexity*0.2', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: 1, max: 100 }),
          fc.constantFrom(TransferSpeed.INSTANT, TransferSpeed.SAME_DAY, TransferSpeed.ONE_DAY, TransferSpeed.THREE_DAY),
          (stepCount, baseDate, hoursUntilDeadline, method) => {
            const arrival = baseDate;
            const deadline = new Date(baseDate.getTime() + hoursUntilDeadline * 60 * 60 * 1000);
            
            const steps = Array.from({ length: stepCount }, (_, i) =>
              fc.sample(arbTransferStep(method, arrival), 1)[0]
            );
            const route = createTestRoute(steps, arrival);
            
            const assessment = calculateRiskScore(route, deadline);
            
            // Verify the weighted formula
            const expectedScore = 
              (assessment.timing * 0.5) + 
              (assessment.reliability * 0.3) + 
              (assessment.complexity * 0.2);
            
            expect(assessment.score).toBeCloseTo(expectedScore, 5);
            
            // Verify individual components are calculated correctly
            expect(assessment.timing).toBe(calculateTimingRisk(arrival, deadline));
            expect(assessment.reliability).toBe(calculateReliabilityRisk(route));
            expect(assessment.complexity).toBe(calculateComplexityRisk(route));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return risk score between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          fc.integer({ min: -100, max: 200 }),
          fc.constantFrom(TransferSpeed.INSTANT, TransferSpeed.SAME_DAY, TransferSpeed.ONE_DAY, TransferSpeed.THREE_DAY),
          (stepCount, baseDate, hoursUntilDeadline, method) => {
            const arrival = baseDate;
            const deadline = new Date(baseDate.getTime() + hoursUntilDeadline * 60 * 60 * 1000);
            
            const steps = Array.from({ length: stepCount }, (_, i) =>
              fc.sample(arbTransferStep(method, arrival), 1)[0]
            );
            const route = createTestRoute(steps, arrival);
            
            const assessment = calculateRiskScore(route, deadline);
            
            expect(assessment.score).toBeGreaterThanOrEqual(0);
            expect(assessment.score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

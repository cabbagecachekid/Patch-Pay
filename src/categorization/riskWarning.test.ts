/**
 * Tests for high-risk warning logic
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { checkAllRoutesRisky } from './riskWarning';
import { Route, TransferSpeed } from '../types';

describe('Risk Warning - checkAllRoutesRisky', () => {
  it('should return true when all routes have risk scores > 70', () => {
    const routes: Route[] = [
      {
        category: 'cheapest',
        steps: [],
        totalFees: 0,
        estimatedArrival: new Date(),
        riskLevel: 'high',
        riskScore: 75,
        reasoning: 'Test route 1'
      },
      {
        category: 'fastest',
        steps: [],
        totalFees: 0,
        estimatedArrival: new Date(),
        riskLevel: 'high',
        riskScore: 80,
        reasoning: 'Test route 2'
      },
      {
        category: 'recommended',
        steps: [],
        totalFees: 0,
        estimatedArrival: new Date(),
        riskLevel: 'high',
        riskScore: 71,
        reasoning: 'Test route 3'
      }
    ];

    expect(checkAllRoutesRisky(routes)).toBe(true);
  });

  it('should return false when at least one route has risk score <= 70', () => {
    const routes: Route[] = [
      {
        category: 'cheapest',
        steps: [],
        totalFees: 0,
        estimatedArrival: new Date(),
        riskLevel: 'high',
        riskScore: 75,
        reasoning: 'Test route 1'
      },
      {
        category: 'fastest',
        steps: [],
        totalFees: 0,
        estimatedArrival: new Date(),
        riskLevel: 'medium',
        riskScore: 60,
        reasoning: 'Test route 2'
      },
      {
        category: 'recommended',
        steps: [],
        totalFees: 0,
        estimatedArrival: new Date(),
        riskLevel: 'high',
        riskScore: 80,
        reasoning: 'Test route 3'
      }
    ];

    expect(checkAllRoutesRisky(routes)).toBe(false);
  });

  it('should return false when routes array is empty', () => {
    expect(checkAllRoutesRisky([])).toBe(false);
  });

  it('should return false when exactly one route has risk score of 70', () => {
    const routes: Route[] = [
      {
        category: 'cheapest',
        steps: [],
        totalFees: 0,
        estimatedArrival: new Date(),
        riskLevel: 'high',
        riskScore: 70,
        reasoning: 'Test route at threshold'
      }
    ];

    expect(checkAllRoutesRisky(routes)).toBe(false);
  });

  it('should return true when all routes have very high risk scores', () => {
    const routes: Route[] = [
      {
        category: 'cheapest',
        steps: [],
        totalFees: 0,
        estimatedArrival: new Date(),
        riskLevel: 'high',
        riskScore: 95,
        reasoning: 'Test route 1'
      },
      {
        category: 'fastest',
        steps: [],
        totalFees: 0,
        estimatedArrival: new Date(),
        riskLevel: 'high',
        riskScore: 100,
        reasoning: 'Test route 2'
      }
    ];

    expect(checkAllRoutesRisky(routes)).toBe(true);
  });
});

// Feature: transfer-routing-algorithm, Property 26: High risk warning
describe('Property 26: High risk warning', () => {
  // Arbitrary for routes with specific risk score ranges
  const arbRouteWithRiskScore = (minScore: number, maxScore: number): fc.Arbitrary<Route> => {
    return fc.record({
      category: fc.constantFrom('cheapest' as const, 'fastest' as const, 'recommended' as const),
      steps: fc.constant([]),
      totalFees: fc.double({ min: 0, max: 100, noNaN: true }),
      estimatedArrival: fc.date(),
      riskLevel: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
      riskScore: fc.double({ min: minScore, max: maxScore, noNaN: true }),
      reasoning: fc.string({ minLength: 1 })
    });
  };

  it('should set allRoutesRisky to true when all routes have risk scores > 70', () => {
    fc.assert(
      fc.property(
        fc.array(arbRouteWithRiskScore(70.01, 100), { minLength: 1, maxLength: 10 }),
        (routes) => {
          const result = checkAllRoutesRisky(routes);
          
          // When all routes have risk scores > 70, should return true
          expect(result).toBe(true);
          
          // Verify all routes actually have risk scores > 70
          expect(routes.every(r => r.riskScore > 70)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set allRoutesRisky to false when at least one route has risk score <= 70', () => {
    fc.assert(
      fc.property(
        // Generate at least one route with score <= 70
        arbRouteWithRiskScore(0, 70),
        // And potentially some routes with score > 70
        fc.array(arbRouteWithRiskScore(0, 100), { maxLength: 5 }),
        (lowRiskRoute, otherRoutes) => {
          const routes = [lowRiskRoute, ...otherRoutes];
          const result = checkAllRoutesRisky(routes);
          
          // When at least one route has risk score <= 70, should return false
          expect(result).toBe(false);
          
          // Verify at least one route has risk score <= 70
          expect(routes.some(r => r.riskScore <= 70)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false for empty route arrays', () => {
    fc.assert(
      fc.property(
        fc.constant([]),
        (routes) => {
          const result = checkAllRoutesRisky(routes);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary case where risk score is exactly 70', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            category: fc.constantFrom('cheapest' as const, 'fastest' as const, 'recommended' as const),
            steps: fc.constant([]),
            totalFees: fc.double({ min: 0, max: 100, noNaN: true }),
            estimatedArrival: fc.date(),
            riskLevel: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
            riskScore: fc.constant(70),
            reasoning: fc.string({ minLength: 1 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (routes) => {
          const result = checkAllRoutesRisky(routes);
          
          // Risk score of exactly 70 should NOT trigger the warning (must be > 70)
          expect(result).toBe(false);
          
          // Verify all routes have risk score of 70
          expect(routes.every(r => r.riskScore === 70)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

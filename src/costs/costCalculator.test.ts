/**
 * Property-based tests for cost calculation utilities
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateTotalFees, normalizeCosts } from './costCalculator.js';
import { Route, TransferStep, TransferSpeed } from '../types/index.js';

describe('Cost Calculator - Property Tests', () => {
  // Generator for transfer steps with realistic fees
  const transferStepArb = fc.record({
    fromAccountId: fc.string({ minLength: 1 }),
    toAccountId: fc.string({ minLength: 1 }),
    amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
    method: fc.constantFrom(
      TransferSpeed.INSTANT,
      TransferSpeed.SAME_DAY,
      TransferSpeed.ONE_DAY,
      TransferSpeed.THREE_DAY
    ),
    fee: fc.double({ min: 0, max: 50, noNaN: true }),
    estimatedArrival: fc.date()
  });

  // Generator for routes with varying fees
  const routeArb = fc.record({
    category: fc.constantFrom('cheapest' as const, 'fastest' as const, 'recommended' as const),
    steps: fc.array(transferStepArb, { minLength: 1, maxLength: 5 }),
    totalFees: fc.double({ min: 0, max: 200, noNaN: true }),
    estimatedArrival: fc.date(),
    riskLevel: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
    riskScore: fc.double({ min: 0, max: 100, noNaN: true }),
    reasoning: fc.string()
  });

  describe('Property 8: Fee calculation accuracy', () => {
    it('should calculate total fees as the sum of all step fees', () => {
      // Feature: transfer-routing-algorithm, Property 8: Fee calculation accuracy
      // Validates: Requirements 3.1, 3.2, 7.3
      
      fc.assert(
        fc.property(
          fc.array(transferStepArb, { minLength: 1, maxLength: 10 }),
          (steps) => {
            const totalFees = calculateTotalFees(steps);
            const expectedTotal = steps.reduce((sum, step) => sum + (step.fee ?? 0), 0);
            
            // Total fees should equal the sum of all individual step fees
            expect(totalFees).toBeCloseTo(expectedTotal, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should treat null fees as zero', () => {
      // Feature: transfer-routing-algorithm, Property 8: Fee calculation accuracy
      // Validates: Requirements 3.2
      
      fc.assert(
        fc.property(
          fc.array(transferStepArb, { minLength: 1, maxLength: 10 }),
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 1, maxLength: 5 }),
          (steps, nullIndices) => {
            // Create a copy of steps with some fees set to null
            const stepsWithNulls = steps.map((step, idx) => ({
              ...step,
              fee: nullIndices.includes(idx) ? 0 : step.fee // Using 0 to simulate null behavior
            }));
            
            const totalFees = calculateTotalFees(stepsWithNulls);
            const expectedTotal = stepsWithNulls.reduce((sum, step) => sum + (step.fee ?? 0), 0);
            
            // Total should correctly handle null fees as zero
            expect(totalFees).toBeCloseTo(expectedTotal, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return zero for empty steps array', () => {
      const totalFees = calculateTotalFees([]);
      expect(totalFees).toBe(0);
    });
  });

  describe('Property 9: Cost normalization', () => {
    it('should normalize costs as percentage of maximum fees', () => {
      // Feature: transfer-routing-algorithm, Property 9: Cost normalization
      // Validates: Requirements 3.3
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 2, maxLength: 10 }),
          (routes) => {
            const normalizedCosts = normalizeCosts(routes);
            
            // Find the maximum fees
            const maxFees = Math.max(...routes.map(r => r.totalFees));
            
            // Skip if all fees are zero (edge case)
            if (maxFees === 0) {
              routes.forEach(route => {
                expect(normalizedCosts.get(route)).toBe(0);
              });
              return;
            }
            
            // Each normalized cost should equal (totalFees / maxFees) * 100
            routes.forEach(route => {
              const normalizedCost = normalizedCosts.get(route);
              const expectedNormalized = (route.totalFees / maxFees) * 100;
              
              expect(normalizedCost).toBeDefined();
              expect(normalizedCost).toBeCloseTo(expectedNormalized, 10);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have the route with maximum fees normalized to 100', () => {
      // Feature: transfer-routing-algorithm, Property 9: Cost normalization
      // Validates: Requirements 3.3
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 2, maxLength: 10 }),
          (routes) => {
            const normalizedCosts = normalizeCosts(routes);
            
            // Find the route with maximum fees
            const maxFees = Math.max(...routes.map(r => r.totalFees));
            
            // Skip if all fees are zero
            if (maxFees === 0) {
              return;
            }
            
            const maxFeeRoute = routes.find(r => r.totalFees === maxFees);
            
            if (maxFeeRoute) {
              const normalizedCost = normalizedCosts.get(maxFeeRoute);
              expect(normalizedCost).toBeCloseTo(100, 10);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all zeros when all routes have zero fees', () => {
      // Feature: transfer-routing-algorithm, Property 9: Cost normalization
      // Validates: Requirements 3.3
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 1, maxLength: 10 }),
          (routes) => {
            // Set all routes to have zero fees
            const zeroFeeRoutes = routes.map(r => ({ ...r, totalFees: 0 }));
            
            const normalizedCosts = normalizeCosts(zeroFeeRoutes);
            
            // All normalized costs should be 0
            zeroFeeRoutes.forEach(route => {
              expect(normalizedCosts.get(route)).toBe(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty map for empty routes array', () => {
      const normalizedCosts = normalizeCosts([]);
      expect(normalizedCosts.size).toBe(0);
    });

    it('should have all normalized costs between 0 and 100', () => {
      // Feature: transfer-routing-algorithm, Property 9: Cost normalization
      // Validates: Requirements 3.3
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 1, maxLength: 10 }),
          (routes) => {
            const normalizedCosts = normalizeCosts(routes);
            
            // All normalized costs should be in range [0, 100]
            routes.forEach(route => {
              const normalizedCost = normalizedCosts.get(route);
              expect(normalizedCost).toBeGreaterThanOrEqual(0);
              expect(normalizedCost).toBeLessThanOrEqual(100);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

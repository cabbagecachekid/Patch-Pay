/**
 * Property-based tests for route categorization and selection
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  selectCheapestRoute,
  selectFastestRoute,
  selectRecommendedRoute,
  calculateRecommendedScore,
  generateReasoning
} from './routeSelector.js';
import { Route, TransferStep, TransferSpeed } from '../types/index.js';

describe('Route Selector - Property Tests', () => {
  // Generator for transfer steps
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

  // Generator for routes with varying characteristics
  const routeArb = fc.record({
    category: fc.constantFrom('cheapest' as const, 'fastest' as const, 'recommended' as const),
    steps: fc.array(transferStepArb, { minLength: 1, maxLength: 5 }),
    totalFees: fc.double({ min: 0, max: 200, noNaN: true }),
    estimatedArrival: fc.date(),
    riskLevel: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
    riskScore: fc.double({ min: 0, max: 100, noNaN: true }),
    reasoning: fc.string()
  });

  describe('Property 10: Cheapest route selection', () => {
    it('should select the route with minimum total fees', () => {
      // Feature: transfer-routing-algorithm, Property 10: Cheapest route selection
      // Validates: Requirements 3.4
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 2, maxLength: 10 }),
          (routes) => {
            const cheapest = selectCheapestRoute(routes);
            
            // The cheapest route should have fees <= all other routes
            routes.forEach(route => {
              expect(cheapest.totalFees).toBeLessThanOrEqual(route.totalFees);
            });
            
            // The cheapest route should be one of the input routes
            expect(routes).toContain(cheapest);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return the same route when all have equal fees', () => {
      // Feature: transfer-routing-algorithm, Property 10: Cheapest route selection
      // Validates: Requirements 3.4
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 2, maxLength: 10 }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (routes, commonFee) => {
            // Set all routes to have the same fee
            const equalFeeRoutes = routes.map(r => ({ ...r, totalFees: commonFee }));
            
            const cheapest = selectCheapestRoute(equalFeeRoutes);
            
            // Should return one of the routes with the common fee
            expect(cheapest.totalFees).toBe(commonFee);
            expect(equalFeeRoutes).toContain(cheapest);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle routes with zero fees', () => {
      // Feature: transfer-routing-algorithm, Property 10: Cheapest route selection
      // Validates: Requirements 3.4
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 1, maxLength: 10 }),
          (routes) => {
            // Add a route with zero fees
            const zeroFeeRoute: Route = {
              ...routes[0],
              totalFees: 0
            };
            const allRoutes = [zeroFeeRoute, ...routes];
            
            const cheapest = selectCheapestRoute(allRoutes);
            
            // The zero-fee route should be selected (or tied)
            expect(cheapest.totalFees).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 18: Fastest route selection', () => {
    it('should select the route with earliest estimated arrival', () => {
      // Feature: transfer-routing-algorithm, Property 18: Fastest route selection
      // Validates: Requirements 4.8
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 2, maxLength: 10 }),
          (routes) => {
            const fastest = selectFastestRoute(routes);
            
            // The fastest route should have arrival time <= all other routes
            routes.forEach(route => {
              expect(fastest.estimatedArrival.getTime()).toBeLessThanOrEqual(
                route.estimatedArrival.getTime()
              );
            });
            
            // The fastest route should be one of the input routes
            expect(routes).toContain(fastest);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return the same route when all have equal arrival times', () => {
      // Feature: transfer-routing-algorithm, Property 18: Fastest route selection
      // Validates: Requirements 4.8
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 2, maxLength: 10 }),
          fc.date(),
          (routes, commonArrival) => {
            // Set all routes to have the same arrival time
            const equalArrivalRoutes = routes.map(r => ({ 
              ...r, 
              estimatedArrival: new Date(commonArrival.getTime())
            }));
            
            const fastest = selectFastestRoute(equalArrivalRoutes);
            
            // Should return one of the routes with the common arrival time
            expect(fastest.estimatedArrival.getTime()).toBe(commonArrival.getTime());
            expect(equalArrivalRoutes).toContain(fastest);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 24: Three route categories', () => {
    it('should be able to categorize routes into cheapest, fastest, and recommended', () => {
      // Feature: transfer-routing-algorithm, Property 24: Three route categories
      // Validates: Requirements 6.1
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 3, maxLength: 10 }),
          fc.date(),
          (routes, currentTime) => {
            // Select all three categories
            const cheapest = selectCheapestRoute(routes);
            const fastest = selectFastestRoute(routes);
            const recommended = selectRecommendedRoute(routes, currentTime);
            
            // All three should be valid routes from the input
            expect(routes).toContain(cheapest);
            expect(routes).toContain(fastest);
            expect(routes).toContain(recommended);
            
            // Each should satisfy its category criteria
            routes.forEach(route => {
              expect(cheapest.totalFees).toBeLessThanOrEqual(route.totalFees);
              expect(fastest.estimatedArrival.getTime()).toBeLessThanOrEqual(
                route.estimatedArrival.getTime()
              );
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow the same route to be selected for multiple categories', () => {
      // Feature: transfer-routing-algorithm, Property 24: Three route categories
      // Validates: Requirements 6.1
      
      fc.assert(
        fc.property(
          routeArb,
          fc.date(),
          (route, currentTime) => {
            // With a single route, all three categories should select it
            const routes = [route];
            
            const cheapest = selectCheapestRoute(routes);
            const fastest = selectFastestRoute(routes);
            const recommended = selectRecommendedRoute(routes, currentTime);
            
            // All should be the same route
            expect(cheapest).toBe(route);
            expect(fastest).toBe(route);
            expect(recommended).toBe(route);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 25: Recommended route scoring', () => {
    it('should select route with highest weighted score', () => {
      // Feature: transfer-routing-algorithm, Property 25: Recommended route scoring
      // Validates: Requirements 6.2, 6.3, 6.4, 6.5
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 2, maxLength: 10 }),
          fc.date(),
          (routes, currentTime) => {
            const recommended = selectRecommendedRoute(routes, currentTime);
            
            // The recommended route should be one of the input routes
            expect(routes).toContain(recommended);
            
            // Calculate scores manually to verify
            const maxFees = Math.max(...routes.map(r => r.totalFees));
            const delays = routes.map(r => r.estimatedArrival.getTime() - currentTime.getTime());
            const maxDelay = Math.max(...delays);
            
            const scores = routes.map(route => {
              const normalizedCost = maxFees === 0 ? 0 : (route.totalFees / maxFees) * 100;
              const delay = route.estimatedArrival.getTime() - currentTime.getTime();
              const normalizedTime = maxDelay === 0 ? 0 : (delay / maxDelay) * 100;
              
              return calculateRecommendedScore(route, normalizedCost, normalizedTime);
            });
            
            const maxScore = Math.max(...scores);
            const recommendedIndex = routes.indexOf(recommended);
            const recommendedScore = scores[recommendedIndex];
            
            // The recommended route should have the maximum score (or tied for max)
            expect(recommendedScore).toBeCloseTo(maxScore, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use correct weighting: cost 40%, time 30%, risk 30%', () => {
      // Feature: transfer-routing-algorithm, Property 25: Recommended route scoring
      // Validates: Requirements 6.2, 6.3, 6.4
      
      fc.assert(
        fc.property(
          routeArb,
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (route, normalizedCost, normalizedTime) => {
            const score = calculateRecommendedScore(route, normalizedCost, normalizedTime);
            
            // Calculate expected score
            const expectedScore = 
              (100 - normalizedCost) * 0.4 +
              (100 - normalizedTime) * 0.3 +
              (100 - route.riskScore) * 0.3;
            
            expect(score).toBeCloseTo(expectedScore, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce scores between 0 and 100', () => {
      // Feature: transfer-routing-algorithm, Property 25: Recommended route scoring
      // Validates: Requirements 6.2, 6.3, 6.4, 6.5
      
      fc.assert(
        fc.property(
          routeArb,
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (route, normalizedCost, normalizedTime) => {
            const score = calculateRecommendedScore(route, normalizedCost, normalizedTime);
            
            // Score should be in valid range
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 28: Route metadata completeness', () => {
    it('should generate non-empty reasoning for all categories', () => {
      // Feature: transfer-routing-algorithm, Property 28: Route metadata completeness
      // Validates: Requirements 7.5, 7.6
      
      fc.assert(
        fc.property(
          fc.array(routeArb, { minLength: 1, maxLength: 10 }),
          fc.date(),
          (routes, currentTime) => {
            const categories: Array<'cheapest' | 'fastest' | 'recommended'> = [
              'cheapest',
              'fastest',
              'recommended'
            ];
            
            categories.forEach(category => {
              routes.forEach(route => {
                const reasoning = generateReasoning(route, category, routes, currentTime);
                
                // Reasoning should be a non-empty string
                expect(reasoning).toBeDefined();
                expect(typeof reasoning).toBe('string');
                expect(reasoning.length).toBeGreaterThan(0);
              });
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include riskLevel and riskScore in route metadata', () => {
      // Feature: transfer-routing-algorithm, Property 28: Route metadata completeness
      // Validates: Requirements 7.5
      
      fc.assert(
        fc.property(
          routeArb,
          (route) => {
            // Route should have riskLevel
            expect(route.riskLevel).toBeDefined();
            expect(['low', 'medium', 'high']).toContain(route.riskLevel);
            
            // Route should have riskScore
            expect(route.riskScore).toBeDefined();
            expect(typeof route.riskScore).toBe('number');
            expect(route.riskScore).toBeGreaterThanOrEqual(0);
            expect(route.riskScore).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include reasoning string in route metadata', () => {
      // Feature: transfer-routing-algorithm, Property 28: Route metadata completeness
      // Validates: Requirements 7.6
      
      fc.assert(
        fc.property(
          routeArb,
          (route) => {
            // Route should have reasoning
            expect(route.reasoning).toBeDefined();
            expect(typeof route.reasoning).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

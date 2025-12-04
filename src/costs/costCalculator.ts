/**
 * Cost calculation utilities for transfer routes
 */

import { Route, TransferStep } from '../types/index.js';

/**
 * Calculate the total fees for a route by summing all step fees
 * Treats null fees as 0
 * 
 * @param steps - Array of transfer steps
 * @returns Total fees in dollars
 */
export function calculateTotalFees(steps: TransferStep[]): number {
  return steps.reduce((total, step) => {
    // Treat null fees as 0, otherwise use the fee value
    const fee = step.fee ?? 0;
    return total + fee;
  }, 0);
}

/**
 * Normalize costs as a percentage of the maximum fees across all routes
 * Returns a map of route to normalized cost (0-100)
 * 
 * @param routes - Array of routes to normalize
 * @returns Map of route to normalized cost percentage
 */
export function normalizeCosts(routes: Route[]): Map<Route, number> {
  const result = new Map<Route, number>();
  
  // Handle edge case: empty routes array
  if (routes.length === 0) {
    return result;
  }
  
  // Find the maximum fees across all routes
  const maxFees = Math.max(...routes.map(route => route.totalFees));
  
  // Handle edge case: all routes have zero fees
  if (maxFees === 0) {
    // All routes get normalized cost of 0
    routes.forEach(route => {
      result.set(route, 0);
    });
    return result;
  }
  
  // Calculate normalized cost for each route
  routes.forEach(route => {
    const normalizedCost = (route.totalFees / maxFees) * 100;
    result.set(route, normalizedCost);
  });
  
  return result;
}

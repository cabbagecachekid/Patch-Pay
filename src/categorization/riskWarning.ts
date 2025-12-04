/**
 * High-risk warning logic for transfer routes
 */

import { Route } from '../types';

/**
 * Check if all routes have high risk scores (> 70)
 * 
 * @param routes - Array of routes to check
 * @returns true if all routes have risk scores exceeding 70, false otherwise
 * 
 * Requirements: 6.6, 6.7
 * - When all routes have risk scores exceeding 70, return true
 * - This flag indicates that all available options are risky
 */
export function checkAllRoutesRisky(routes: Route[]): boolean {
  // If no routes, return false
  if (routes.length === 0) {
    return false;
  }
  
  // Check if all routes have risk scores > 70
  return routes.every(route => route.riskScore > 70);
}

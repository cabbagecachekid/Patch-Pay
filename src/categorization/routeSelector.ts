/**
 * Route categorization and selection utilities
 */

import { Route } from '../types/index.js';
import { normalizeCosts } from '../costs/costCalculator.js';

/**
 * Select the cheapest route from a set of routes
 * Returns the route with minimum total fees
 * 
 * @param routes - Array of routes to evaluate
 * @returns The route with the lowest total fees
 * @throws Error if routes array is empty
 */
export function selectCheapestRoute(routes: Route[]): Route {
  if (routes.length === 0) {
    throw new Error('Cannot select cheapest route from empty array');
  }
  
  return routes.reduce((cheapest, current) => 
    current.totalFees < cheapest.totalFees ? current : cheapest
  );
}

/**
 * Select the fastest route from a set of routes
 * Returns the route with earliest estimated arrival time
 * 
 * @param routes - Array of routes to evaluate
 * @returns The route with the earliest arrival time
 * @throws Error if routes array is empty
 */
export function selectFastestRoute(routes: Route[]): Route {
  if (routes.length === 0) {
    throw new Error('Cannot select fastest route from empty array');
  }
  
  return routes.reduce((fastest, current) => 
    current.estimatedArrival < fastest.estimatedArrival ? current : fastest
  );
}

/**
 * Normalize time delays as a percentage of the maximum delay across all routes
 * 
 * @param routes - Array of routes to normalize
 * @param currentTime - Current time for calculating delays
 * @returns Map of route to normalized time percentage (0-100)
 */
function normalizeTimes(routes: Route[], currentTime: Date): Map<Route, number> {
  const result = new Map<Route, number>();
  
  if (routes.length === 0) {
    return result;
  }
  
  // Calculate delays for each route (in milliseconds)
  const delays = routes.map(route => 
    route.estimatedArrival.getTime() - currentTime.getTime()
  );
  
  const maxDelay = Math.max(...delays);
  
  // Handle edge case: all routes arrive at the same time
  if (maxDelay === 0) {
    routes.forEach(route => {
      result.set(route, 0);
    });
    return result;
  }
  
  // Calculate normalized time for each route
  routes.forEach((route, index) => {
    const normalizedTime = (delays[index] / maxDelay) * 100;
    result.set(route, normalizedTime);
  });
  
  return result;
}

/**
 * Calculate the recommended score for a route
 * Score = (100 - normalizedCost) * 0.4 + (100 - normalizedTime) * 0.3 + (100 - riskScore) * 0.3
 * 
 * @param route - The route to score
 * @param normalizedCost - Normalized cost (0-100)
 * @param normalizedTime - Normalized time (0-100)
 * @returns Weighted score (0-100, higher is better)
 */
export function calculateRecommendedScore(
  route: Route,
  normalizedCost: number,
  normalizedTime: number
): number {
  const costComponent = (100 - normalizedCost) * 0.4;
  const timeComponent = (100 - normalizedTime) * 0.3;
  const riskComponent = (100 - route.riskScore) * 0.3;
  
  return costComponent + timeComponent + riskComponent;
}

/**
 * Select the recommended route from a set of routes
 * Uses weighted scoring: cost 40%, time 30%, risk 30%
 * 
 * @param routes - Array of routes to evaluate
 * @param currentTime - Current time for calculating time delays
 * @returns The route with the highest weighted score
 * @throws Error if routes array is empty
 */
export function selectRecommendedRoute(routes: Route[], currentTime: Date): Route {
  if (routes.length === 0) {
    throw new Error('Cannot select recommended route from empty array');
  }
  
  // Normalize costs and times
  const normalizedCosts = normalizeCosts(routes);
  const normalizedTimes = normalizeTimes(routes, currentTime);
  
  // Calculate scores for each route
  const scores = routes.map(route => ({
    route,
    score: calculateRecommendedScore(
      route,
      normalizedCosts.get(route) ?? 0,
      normalizedTimes.get(route) ?? 0
    )
  }));
  
  // Return the route with the highest score
  return scores.reduce((best, current) => 
    current.score > best.score ? current : best
  ).route;
}

/**
 * Generate reasoning text explaining why a route was selected for its category
 * 
 * @param route - The route to explain
 * @param category - The category this route was selected for
 * @param routes - All routes being considered (for comparison)
 * @param currentTime - Current time for calculating delays
 * @returns Human-readable explanation string
 */
export function generateReasoning(
  route: Route,
  category: 'cheapest' | 'fastest' | 'recommended',
  routes: Route[],
  currentTime: Date
): string {
  switch (category) {
    case 'cheapest':
      return generateCheapestReasoning(route, routes);
    
    case 'fastest':
      return generateFastestReasoning(route, routes, currentTime);
    
    case 'recommended':
      return generateRecommendedReasoning(route, routes, currentTime);
    
    default:
      return 'Selected for unknown category';
  }
}

/**
 * Generate reasoning for cheapest route selection
 */
function generateCheapestReasoning(route: Route, routes: Route[]): string {
  const totalFees = route.totalFees;
  const stepCount = route.steps.length;
  
  if (totalFees === 0) {
    return `This route has zero fees, making it the most cost-effective option with ${stepCount} transfer step${stepCount !== 1 ? 's' : ''}.`;
  }
  
  const savings = Math.max(...routes.map(r => r.totalFees)) - totalFees;
  
  if (savings === 0) {
    return `This route costs $${totalFees.toFixed(2)} in fees across ${stepCount} step${stepCount !== 1 ? 's' : ''}.`;
  }
  
  return `This route minimizes costs at $${totalFees.toFixed(2)} in total fees, saving $${savings.toFixed(2)} compared to the most expensive option.`;
}

/**
 * Generate reasoning for fastest route selection
 */
function generateFastestReasoning(route: Route, routes: Route[], currentTime: Date): string {
  const arrivalDelay = route.estimatedArrival.getTime() - currentTime.getTime();
  const hours = Math.floor(arrivalDelay / (1000 * 60 * 60));
  const minutes = Math.floor((arrivalDelay % (1000 * 60 * 60)) / (1000 * 60));
  
  const slowestArrival = Math.max(...routes.map(r => r.estimatedArrival.getTime()));
  const timeSaved = slowestArrival - route.estimatedArrival.getTime();
  const hoursSaved = Math.floor(timeSaved / (1000 * 60 * 60));
  
  let timeDescription = '';
  if (hours === 0 && minutes <= 5) {
    timeDescription = 'within minutes';
  } else if (hours === 0) {
    timeDescription = `in ${minutes} minutes`;
  } else if (hours < 24) {
    timeDescription = `in ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(hours / 24);
    timeDescription = `in ${days} day${days !== 1 ? 's' : ''}`;
  }
  
  if (timeSaved === 0) {
    return `This route arrives ${timeDescription}, matching the fastest possible delivery time.`;
  }
  
  if (hoursSaved < 1) {
    return `This route arrives ${timeDescription}, the fastest option available.`;
  }
  
  const daysSaved = Math.floor(hoursSaved / 24);
  if (daysSaved > 0) {
    return `This route arrives ${timeDescription}, ${daysSaved} day${daysSaved !== 1 ? 's' : ''} faster than the slowest option.`;
  }
  
  return `This route arrives ${timeDescription}, ${hoursSaved} hour${hoursSaved !== 1 ? 's' : ''} faster than the slowest option.`;
}

/**
 * Generate reasoning for recommended route selection
 */
function generateRecommendedReasoning(route: Route, routes: Route[], currentTime: Date): string {
  const normalizedCosts = normalizeCosts(routes);
  const normalizedTimes = normalizeTimes(routes, currentTime);
  
  const normalizedCost = normalizedCosts.get(route) ?? 0;
  const normalizedTime = normalizedTimes.get(route) ?? 0;
  const score = calculateRecommendedScore(route, normalizedCost, normalizedTime);
  
  // Determine what makes this route balanced
  const costScore = (100 - normalizedCost) * 0.4;
  const timeScore = (100 - normalizedTime) * 0.3;
  const riskScore = (100 - route.riskScore) * 0.3;
  
  const strengths: string[] = [];
  
  if (costScore >= 30) {
    strengths.push('competitive fees');
  }
  if (timeScore >= 20) {
    strengths.push('fast delivery');
  }
  if (riskScore >= 20) {
    strengths.push('low risk');
  }
  
  const strengthsText = strengths.length > 0 
    ? strengths.join(', ') 
    : 'balanced characteristics';
  
  return `This route offers the best overall balance with ${strengthsText}. It scores ${score.toFixed(1)}/100 on our weighted evaluation (cost 40%, speed 30%, risk 30%).`;
}

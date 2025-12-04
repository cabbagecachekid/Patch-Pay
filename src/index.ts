/**
 * Transfer Routing Algorithm - Main Entry Point
 * 
 * This module implements the main calculateOptimalRoutes function that orchestrates
 * the entire routing pipeline from input validation through route categorization.
 */

import {
  Goal,
  Account,
  TransferRelationship,
  RoutingResult,
  RoutingError,
  Route
} from './types/index.js';
import { validateAccounts, validateTransferMatrix } from './validation/inputValidator.js';
import {
  checkPastDeadline,
  checkInsufficientFunds,
  checkNoPath,
  createErrorResponse
} from './errors/errorHandlers.js';
import { identifySourceAccounts } from './balance/sourceAccounts.js';
import { findAllPathsToTarget } from './paths/pathFinder.js';
import { generateValidCombinations } from './combinations/combinationGenerator.js';
import { buildRoute } from './routes/routeBuilder.js';
import { calculateRiskScore, classifyRiskLevel } from './risk/riskCalculator.js';
import {
  selectCheapestRoute,
  selectFastestRoute,
  selectRecommendedRoute,
  generateReasoning
} from './categorization/routeSelector.js';
import { checkAllRoutesRisky } from './categorization/riskWarning.js';

/**
 * Calculate optimal transfer routes from multiple source accounts to a target account.
 * 
 * This function implements the complete routing pipeline:
 * 1. Validate inputs
 * 2. Check for past deadline error
 * 3. Calculate available balances
 * 4. Check for insufficient funds error
 * 5. Discover paths to target
 * 6. Check for no path error
 * 7. Generate valid combinations
 * 8. Build routes for each combination
 * 9. Calculate costs and risks for all routes
 * 10. Select cheapest, fastest, and recommended routes
 * 11. Check for high-risk warning
 * 12. Format and return response
 * 
 * @param goal - Transfer goal with target account, amount, and deadline
 * @param accounts - Array of all available accounts
 * @param transferMatrix - Array of transfer relationships between accounts
 * @param currentTime - Optional current time (defaults to now, useful for testing)
 * @returns Either a RoutingResult with three categorized routes or a RoutingError
 * 
 * Requirements: All
 */
export function calculateOptimalRoutes(
  goal: Goal,
  accounts: Account[],
  transferMatrix: TransferRelationship[],
  currentTime: Date = new Date()
): RoutingResult | RoutingError {
  // Step 1: Validate inputs (but skip past deadline check in validation)
  // We handle past deadline as a routing error, not a validation error
  const accountsValidation = validateAccounts(accounts);
  if (!accountsValidation.isValid) {
    throw new Error(`Invalid accounts: ${accountsValidation.errors.join(', ')}`);
  }
  
  const matrixValidation = validateTransferMatrix(transferMatrix, accounts);
  if (!matrixValidation.isValid) {
    throw new Error(`Invalid transfer matrix: ${matrixValidation.errors.join(', ')}`);
  }
  
  // Validate goal structure (but not deadline timing)
  if (!goal.targetAccountId || typeof goal.targetAccountId !== 'string' || goal.targetAccountId.trim() === '') {
    throw new Error('Invalid goal: Target account ID must be a non-empty string');
  }
  if (typeof goal.amount !== 'number' || goal.amount <= 0 || !isFinite(goal.amount)) {
    throw new Error('Invalid goal: Amount must be a positive finite number');
  }
  if (!(goal.deadline instanceof Date) || isNaN(goal.deadline.getTime())) {
    throw new Error('Invalid goal: Deadline must be a valid Date object');
  }
  
  // Step 2: Check for past deadline error
  if (checkPastDeadline(goal.deadline, currentTime)) {
    return createErrorResponse('past_deadline');
  }
  
  // Step 3: Calculate available balances (done implicitly in next steps)
  
  // Step 4: Check for insufficient funds error
  const { insufficient, shortfall } = checkInsufficientFunds(accounts, goal.amount);
  if (insufficient) {
    return createErrorResponse('insufficient_funds', shortfall);
  }
  
  // Step 5: Discover paths to target
  const pathsToTarget = findAllPathsToTarget(goal.targetAccountId, transferMatrix);
  
  // Step 6: Check for no path error
  const sourceAccounts = identifySourceAccounts(accounts);
  const sourceAccountIds = sourceAccounts.map(acc => acc.id);
  
  const { noPath, suggestion } = checkNoPath(
    goal.targetAccountId,
    transferMatrix,
    sourceAccountIds
  );
  
  if (noPath) {
    return createErrorResponse('no_path', undefined, suggestion);
  }
  
  // Step 7: Generate valid combinations
  const combinations = generateValidCombinations(
    accounts,
    goal.amount,
    pathsToTarget
  );
  
  // If no valid combinations found, it means accounts have balance but no path to target
  // This is effectively a "no path" scenario
  if (combinations.length === 0) {
    // Check if we have source accounts with balance but no path
    const hasBalanceButNoPath = sourceAccounts.some(acc => {
      const path = pathsToTarget.get(acc.id);
      return !path || path.length === 0;
    });
    
    if (hasBalanceButNoPath) {
      // Find intermediate account suggestion
      const { suggestion } = checkNoPath(goal.targetAccountId, transferMatrix, sourceAccountIds);
      return createErrorResponse('no_path', undefined, suggestion);
    }
    
    // Otherwise it's truly insufficient funds
    return createErrorResponse('insufficient_funds', goal.amount);
  }
  
  // Step 8: Build routes for each combination
  const routes: Route[] = combinations.map(combination =>
    buildRoute(combination, pathsToTarget, transferMatrix, goal.amount, currentTime)
  );
  
  // Step 9: Calculate costs and risks for all routes
  for (const route of routes) {
    const riskAssessment = calculateRiskScore(route, goal.deadline);
    route.riskScore = riskAssessment.score;
    route.riskLevel = classifyRiskLevel(riskAssessment.score);
  }
  
  // Step 10: Select cheapest, fastest, and recommended routes
  const cheapestRoute = selectCheapestRoute(routes);
  const fastestRoute = selectFastestRoute(routes);
  const recommendedRoute = selectRecommendedRoute(routes, currentTime);
  
  // Create deep copies to avoid mutating the same object
  const cheapestCopy = { ...cheapestRoute, steps: [...cheapestRoute.steps] };
  const fastestCopy = { ...fastestRoute, steps: [...fastestRoute.steps] };
  const recommendedCopy = { ...recommendedRoute, steps: [...recommendedRoute.steps] };
  
  // Assign categories and generate reasoning
  cheapestCopy.category = 'cheapest';
  cheapestCopy.reasoning = generateReasoning(cheapestRoute, 'cheapest', routes, currentTime);
  
  fastestCopy.category = 'fastest';
  fastestCopy.reasoning = generateReasoning(fastestRoute, 'fastest', routes, currentTime);
  
  recommendedCopy.category = 'recommended';
  recommendedCopy.reasoning = generateReasoning(recommendedRoute, 'recommended', routes, currentTime);
  
  // Create array of the three selected routes
  const selectedRoutes = [cheapestCopy, fastestCopy, recommendedCopy];
  
  // Step 11: Check for high-risk warning
  const allRoutesRisky = checkAllRoutesRisky(selectedRoutes);
  
  // Step 12: Format and return response
  const result: RoutingResult = {
    routes: selectedRoutes
  };
  
  if (allRoutesRisky) {
    result.allRoutesRisky = true;
  }
  
  return result;
}

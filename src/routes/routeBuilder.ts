/**
 * Route building module for constructing complete transfer routes
 * 
 * Converts account combinations into complete routes with transfer steps,
 * calculating amounts, fees, and arrival times for each step.
 */

import {
  Account,
  AccountCombination,
  Route,
  TransferStep,
  TransferRelationship,
  TransferSpeed
} from '../types';
import { calculateAvailableBalance } from '../balance/availableBalance';
import { estimateArrivalTime } from '../time/transferTiming';

/**
 * Builds a complete route from an account combination.
 * 
 * This function:
 * 1. Allocates transfer amounts across source accounts (proportional allocation)
 * 2. Creates transfer steps using discovered paths
 * 3. Looks up transfer method and fee from transfer matrix
 * 4. Calculates estimated arrival for each step
 * 5. Calculates route arrival as max of all step arrivals
 * 6. Ensures no account goes negative during transfers
 * 
 * @param combination - The combination of source accounts to use
 * @param pathsToTarget - Map of account IDs to their paths to the target
 * @param transferMatrix - Array of all available transfer relationships
 * @param goalAmount - The target amount to transfer
 * @param currentTime - The current time for arrival estimation
 * @returns A complete route with all transfer steps
 * 
 * Requirements: 2.3, 4.7, 7.1, 7.2, 7.4, 9.5
 */
export function buildRoute(
  combination: AccountCombination,
  pathsToTarget: Map<string, TransferRelationship[]>,
  transferMatrix: TransferRelationship[],
  goalAmount: number,
  currentTime: Date
): Route {
  const steps: TransferStep[] = [];
  
  // Calculate transfer amounts using proportional allocation
  const allocations = allocateAmounts(combination, goalAmount);
  
  // For each source account, create transfer steps using discovered paths
  for (const [account, amount] of allocations) {
    const path = pathsToTarget.get(account.id);
    
    if (!path || path.length === 0) {
      throw new Error(`No path found for account ${account.id}`);
    }
    
    // Create transfer steps for this path
    const pathSteps = createStepsForPath(path, amount, currentTime);
    steps.push(...pathSteps);
  }
  
  // Calculate total fees
  const totalFees = steps.reduce((sum, step) => sum + step.fee, 0);
  
  // Calculate route arrival as max of all step arrivals
  const estimatedArrival = new Date(
    Math.max(...steps.map(step => step.estimatedArrival.getTime()))
  );
  
  // Create route with placeholder values for category, risk, and reasoning
  // These will be filled in by the categorization module
  const route: Route = {
    category: 'recommended', // Placeholder
    steps,
    totalFees,
    estimatedArrival,
    riskLevel: 'low', // Placeholder
    riskScore: 0, // Placeholder
    reasoning: '' // Placeholder
  };
  
  return route;
}

/**
 * Allocates the goal amount across source accounts proportionally.
 * 
 * Uses proportional allocation based on available balance:
 * - Each account contributes proportionally to its available balance
 * - Ensures the total allocated equals the goal amount
 * - Ensures no account goes negative
 * 
 * @param combination - The combination of source accounts
 * @param goalAmount - The target amount to allocate
 * @returns Map of accounts to their allocated amounts
 */
function allocateAmounts(
  combination: AccountCombination,
  goalAmount: number
): Map<Account, number> {
  const allocations = new Map<Account, number>();
  
  // Calculate available balance for each account
  const availableBalances = new Map<Account, number>();
  for (const account of combination.accounts) {
    availableBalances.set(account, calculateAvailableBalance(account));
  }
  
  // Proportional allocation
  let remainingAmount = goalAmount;
  const totalAvailable = combination.totalAvailable;
  
  // Allocate to all accounts except the last one
  for (let i = 0; i < combination.accounts.length - 1; i++) {
    const account = combination.accounts[i];
    const availableBalance = availableBalances.get(account)!;
    
    // Calculate proportional amount
    const proportion = availableBalance / totalAvailable;
    const allocatedAmount = Math.min(
      Math.floor(goalAmount * proportion * 100) / 100, // Round to 2 decimal places
      availableBalance,
      remainingAmount
    );
    
    allocations.set(account, allocatedAmount);
    remainingAmount -= allocatedAmount;
  }
  
  // Allocate remaining amount to the last account
  const lastAccount = combination.accounts[combination.accounts.length - 1];
  const lastAvailable = availableBalances.get(lastAccount)!;
  allocations.set(lastAccount, Math.min(remainingAmount, lastAvailable));
  
  return allocations;
}

/**
 * Creates transfer steps for a path from source to target.
 * 
 * For multi-hop transfers, the full amount is transferred through each hop.
 * 
 * @param path - Array of transfer relationships representing the path
 * @param amount - The amount to transfer
 * @param currentTime - The current time for arrival estimation
 * @returns Array of transfer steps
 */
function createStepsForPath(
  path: TransferRelationship[],
  amount: number,
  currentTime: Date
): TransferStep[] {
  const steps: TransferStep[] = [];
  let stepInitiationTime = currentTime;
  
  for (const relationship of path) {
    // Look up fee (treat null as 0)
    const fee = relationship.fee ?? 0;
    
    // Calculate estimated arrival for this step
    const estimatedArrival = estimateArrivalTime(
      relationship.speed,
      stepInitiationTime
    );
    
    // Create transfer step
    const step: TransferStep = {
      fromAccountId: relationship.fromAccountId,
      toAccountId: relationship.toAccountId,
      amount,
      method: relationship.speed,
      fee,
      estimatedArrival
    };
    
    steps.push(step);
    
    // Next step starts when this step completes
    stepInitiationTime = estimatedArrival;
  }
  
  return steps;
}

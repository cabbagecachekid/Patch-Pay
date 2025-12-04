/**
 * Combination generation module for creating valid source account combinations
 * 
 * Generates all valid combinations of source accounts that can meet the goal amount,
 * excluding unavailable funds and implementing performance optimizations.
 */

import { Account, AccountCombination, TransferRelationship } from '../types';
import { calculateAvailableBalance } from '../balance/availableBalance';

/**
 * Configuration options for combination generation
 */
export interface CombinationOptions {
  /**
   * Maximum number of accounts allowed in a single combination.
   * Default: 5
   * Performance optimization: Limits complexity of multi-account transfers
   */
  maxCombinationSize?: number;
  
  /**
   * Maximum number of valid combinations to generate before stopping.
   * Default: undefined (generate all combinations)
   * Performance optimization: Early termination when enough options are found
   */
  maxCombinations?: number;
}

/**
 * Generates all valid combinations of source accounts that sum to at least the goal amount.
 * 
 * This function creates all possible subsets of source accounts where the total available
 * balance meets or exceeds the goal amount. It excludes combinations using unavailable funds
 * (pending transactions) and implements pruning for performance.
 * 
 * Performance optimizations:
 * - Early termination when enough combinations are found (configurable via maxCombinations)
 * - Skip accounts with zero available balance
 * - Limit maximum combination size (default 5 accounts, configurable via maxCombinationSize)
 * 
 * @param accounts - Array of all accounts to consider
 * @param goalAmount - The target amount that needs to be transferred
 * @param pathsToTarget - Map of account IDs to their paths to the target (from pathFinder)
 * @param options - Optional configuration for performance tuning
 * @returns Array of valid account combinations that can meet the goal
 * 
 * Requirements: 2.1, 2.2, 2.5
 */
export function generateValidCombinations(
  accounts: Account[],
  goalAmount: number,
  pathsToTarget: Map<string, TransferRelationship[]>,
  options: CombinationOptions = {}
): AccountCombination[] {
  const validCombinations: AccountCombination[] = [];
  
  // Apply default options
  const maxCombinationSize = options.maxCombinationSize ?? 5;
  const maxCombinations = options.maxCombinations;
  
  // Filter accounts to only those with:
  // 1. Available balance > 0
  // 2. A path to the target account (non-empty path)
  const eligibleAccounts = accounts.filter(account => {
    const availableBalance = calculateAvailableBalance(account);
    const hasPath = pathsToTarget.has(account.id) && pathsToTarget.get(account.id)!.length > 0;
    return availableBalance > 0 && hasPath;
  });
  
  // If no eligible accounts, return empty array
  if (eligibleAccounts.length === 0) {
    return validCombinations;
  }
  
  // Sort accounts by available balance descending for better early termination
  // (larger balances first means we find valid combinations sooner)
  eligibleAccounts.sort((a, b) => {
    return calculateAvailableBalance(b) - calculateAvailableBalance(a);
  });
  
  // Generate all subsets using bit manipulation
  // For n accounts, there are 2^n possible subsets
  const n = eligibleAccounts.length;
  const maxSubsets = Math.pow(2, n);
  
  for (let i = 1; i < maxSubsets; i++) { // Start at 1 to skip empty set
    // Early termination: stop if we've found enough combinations
    if (maxCombinations !== undefined && validCombinations.length >= maxCombinations) {
      break;
    }
    
    const combination: Account[] = [];
    let totalAvailable = 0;
    
    // Build combination based on bit pattern
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) {
        combination.push(eligibleAccounts[j]);
      }
    }
    
    // Apply max combination size constraint for performance
    if (combination.length > maxCombinationSize) {
      continue;
    }
    
    // Calculate total available balance for this combination
    for (const account of combination) {
      totalAvailable += calculateAvailableBalance(account);
    }
    
    // Only include combinations that meet or exceed the goal amount
    if (totalAvailable >= goalAmount) {
      validCombinations.push({
        accounts: combination,
        totalAvailable: totalAvailable
      });
    }
  }
  
  return validCombinations;
}

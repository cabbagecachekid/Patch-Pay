/**
 * Error handling utilities for the Transfer Routing Algorithm
 * 
 * This module provides functions to check for various error conditions
 * and create appropriate error responses.
 */

import { Account, RoutingError, TransferRelationship } from '../types';
import { calculateAvailableBalance } from '../balance/availableBalance';

/**
 * Check if the deadline has already passed
 * 
 * @param deadline - The goal deadline
 * @param currentTime - The current time (defaults to now)
 * @returns true if deadline is in the past
 * 
 * Validates: Requirements 1.1, 8.1
 */
export function checkPastDeadline(deadline: Date, currentTime: Date = new Date()): boolean {
  return deadline < currentTime;
}

/**
 * Check if there are insufficient funds to meet the goal
 * 
 * @param accounts - Array of all accounts
 * @param goalAmount - The target amount to transfer
 * @returns Object with insufficient flag and shortfall amount
 * 
 * Validates: Requirements 1.4, 8.2
 */
export function checkInsufficientFunds(
  accounts: Account[],
  goalAmount: number
): { insufficient: boolean; shortfall: number } {
  const totalAvailable = accounts.reduce(
    (sum, account) => sum + calculateAvailableBalance(account),
    0
  );

  const insufficient = totalAvailable < goalAmount;
  const shortfall = insufficient ? goalAmount - totalAvailable : 0;

  return { insufficient, shortfall };
}

/**
 * Check if there is no path to the target account
 * 
 * @param targetAccountId - The target account ID
 * @param transferMatrix - Array of transfer relationships
 * @param sourceAccountIds - Array of source account IDs with available balance
 * @returns Object with noPath flag and optional suggestion for intermediate account
 * 
 * Validates: Requirements 1.5, 8.3, 8.4
 */
export function checkNoPath(
  targetAccountId: string,
  transferMatrix: TransferRelationship[],
  sourceAccountIds: string[]
): { noPath: boolean; suggestion?: string } {
  // Check if any source account has a direct or indirect path to target
  const hasPathToTarget = sourceAccountIds.some(sourceId => {
    return hasPath(sourceId, targetAccountId, transferMatrix);
  });

  if (!hasPathToTarget) {
    // Try to find an intermediate account that could help
    const suggestion = findIntermediateAccount(
      sourceAccountIds,
      targetAccountId,
      transferMatrix
    );

    return { noPath: true, suggestion };
  }

  return { noPath: false };
}

/**
 * Helper function to check if a path exists between two accounts
 */
function hasPath(
  fromAccountId: string,
  toAccountId: string,
  transferMatrix: TransferRelationship[]
): boolean {
  if (fromAccountId === toAccountId) {
    return true;
  }

  const visited = new Set<string>();
  const queue: string[] = [fromAccountId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    if (current === toAccountId) {
      return true;
    }

    // Find all accounts reachable from current
    const nextAccounts = transferMatrix
      .filter(rel => rel.fromAccountId === current && rel.isAvailable)
      .map(rel => rel.toAccountId);

    queue.push(...nextAccounts);
  }

  return false;
}

/**
 * Helper function to find an intermediate account that could bridge the gap
 */
function findIntermediateAccount(
  sourceAccountIds: string[],
  targetAccountId: string,
  transferMatrix: TransferRelationship[]
): string | undefined {
  // Find accounts that:
  // 1. Can be reached from at least one source account
  // 2. Can reach the target account
  
  const reachableFromSources = new Set<string>();
  
  // Find all accounts reachable from any source
  for (const sourceId of sourceAccountIds) {
    const reachable = getReachableAccounts(sourceId, transferMatrix);
    reachable.forEach(accountId => reachableFromSources.add(accountId));
  }

  // Find accounts that can reach the target
  const canReachTarget = new Set<string>();
  const allAccountIds = new Set<string>();
  
  transferMatrix.forEach(rel => {
    allAccountIds.add(rel.fromAccountId);
    allAccountIds.add(rel.toAccountId);
  });

  for (const accountId of allAccountIds) {
    if (hasPath(accountId, targetAccountId, transferMatrix)) {
      canReachTarget.add(accountId);
    }
  }

  // Find intersection - accounts reachable from sources that can reach target
  for (const accountId of reachableFromSources) {
    if (canReachTarget.has(accountId) && accountId !== targetAccountId) {
      return accountId;
    }
  }

  return undefined;
}

/**
 * Helper function to get all accounts reachable from a starting account
 */
function getReachableAccounts(
  fromAccountId: string,
  transferMatrix: TransferRelationship[]
): Set<string> {
  const reachable = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [fromAccountId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);
    reachable.add(current);

    const nextAccounts = transferMatrix
      .filter(rel => rel.fromAccountId === current && rel.isAvailable)
      .map(rel => rel.toAccountId);

    queue.push(...nextAccounts);
  }

  return reachable;
}

/**
 * Create a formatted error response
 * 
 * @param errorType - The type of error
 * @param shortfall - Optional shortfall amount for insufficient funds
 * @param suggestion - Optional suggestion for intermediate account
 * @returns Formatted RoutingError object
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.5
 */
export function createErrorResponse(
  errorType: "insufficient_funds" | "no_path" | "past_deadline",
  shortfall?: number,
  suggestion?: string
): RoutingError {
  const errorMessages = {
    past_deadline: "Deadline has already passed",
    insufficient_funds: `Insufficient funds available. Shortfall: $${shortfall?.toFixed(2) || "0.00"}`,
    no_path: suggestion
      ? `No transfer path exists to the target account. Consider adding a transfer relationship through account: ${suggestion}`
      : "No transfer path exists to the target account"
  };

  const error: RoutingError = {
    error: errorType,
    message: errorMessages[errorType]
  };

  if (errorType === "insufficient_funds" && shortfall !== undefined) {
    error.shortfall = shortfall;
  }

  if (errorType === "no_path" && suggestion) {
    error.suggestion = suggestion;
  }

  return error;
}

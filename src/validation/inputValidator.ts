/**
 * Input validation functions for the Transfer Routing Algorithm
 * Validates goals, accounts, and transfer matrices according to requirements 1.1 and 8.1
 */

import {
  Goal,
  Account,
  TransferRelationship,
  ValidationResult,
  AccountType,
  TransferSpeed,
  TransactionStatus
} from '../types/index.js';

/**
 * Validates a goal object
 * Requirements: 1.1, 8.1
 * 
 * Checks:
 * - Deadline is not in the past
 * - Amount is greater than 0
 * - Target account ID is a non-empty string
 */
export function validateGoal(goal: Goal, currentTime: Date = new Date()): ValidationResult {
  const errors: string[] = [];

  // Validate target account ID
  if (!goal.targetAccountId || typeof goal.targetAccountId !== 'string' || goal.targetAccountId.trim() === '') {
    errors.push('Target account ID must be a non-empty string');
  }

  // Validate amount
  if (typeof goal.amount !== 'number' || goal.amount <= 0) {
    errors.push('Goal amount must be greater than 0');
  }

  if (!isFinite(goal.amount)) {
    errors.push('Goal amount must be a finite number');
  }

  // Validate deadline
  if (!(goal.deadline instanceof Date) || isNaN(goal.deadline.getTime())) {
    errors.push('Deadline must be a valid Date object');
  } else if (goal.deadline < currentTime) {
    errors.push('Deadline cannot be in the past');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates an array of accounts
 * Requirements: 1.1, 8.1
 * 
 * Checks:
 * - Array is non-empty
 * - Each account has valid structure
 * - Account IDs are unique
 * - All required fields are present and valid
 */
export function validateAccounts(accounts: Account[]): ValidationResult {
  const errors: string[] = [];

  // Check non-empty
  if (!Array.isArray(accounts) || accounts.length === 0) {
    errors.push('Accounts array must be non-empty');
    return { isValid: false, errors };
  }

  const accountIds = new Set<string>();

  accounts.forEach((account, index) => {
    const prefix = `Account at index ${index}`;

    // Validate ID
    if (!account.id || typeof account.id !== 'string' || account.id.trim() === '') {
      errors.push(`${prefix}: ID must be a non-empty string`);
    } else {
      // Check for duplicate IDs
      if (accountIds.has(account.id)) {
        errors.push(`${prefix}: Duplicate account ID "${account.id}"`);
      }
      accountIds.add(account.id);
    }

    // Validate name
    if (!account.name || typeof account.name !== 'string') {
      errors.push(`${prefix}: Name must be a non-empty string`);
    }

    // Validate type
    if (!Object.values(AccountType).includes(account.type)) {
      errors.push(`${prefix}: Invalid account type "${account.type}"`);
    }

    // Validate balance
    if (typeof account.balance !== 'number' || !isFinite(account.balance)) {
      errors.push(`${prefix}: Balance must be a finite number`);
    }

    // Validate pending transactions
    if (!Array.isArray(account.pendingTransactions)) {
      errors.push(`${prefix}: Pending transactions must be an array`);
    } else {
      account.pendingTransactions.forEach((txn, txnIndex) => {
        if (!txn.id || typeof txn.id !== 'string') {
          errors.push(`${prefix}, Transaction ${txnIndex}: ID must be a non-empty string`);
        }
        if (typeof txn.amount !== 'number' || !isFinite(txn.amount)) {
          errors.push(`${prefix}, Transaction ${txnIndex}: Amount must be a finite number`);
        }
        if (!(txn.date instanceof Date) || isNaN(txn.date.getTime())) {
          errors.push(`${prefix}, Transaction ${txnIndex}: Date must be a valid Date object`);
        }
        if (!Object.values(TransactionStatus).includes(txn.status)) {
          errors.push(`${prefix}, Transaction ${txnIndex}: Invalid status "${txn.status}"`);
        }
      });
    }

    // Validate institution type
    if (account.institutionType !== 'traditional_bank' && account.institutionType !== 'neobank') {
      errors.push(`${prefix}: Institution type must be "traditional_bank" or "neobank"`);
    }

    // Validate metadata
    if (!account.metadata || typeof account.metadata !== 'object') {
      errors.push(`${prefix}: Metadata must be an object`);
    } else {
      if (!(account.metadata.lastUpdated instanceof Date) || isNaN(account.metadata.lastUpdated.getTime())) {
        errors.push(`${prefix}: Metadata lastUpdated must be a valid Date object`);
      }
      if (typeof account.metadata.isActive !== 'boolean') {
        errors.push(`${prefix}: Metadata isActive must be a boolean`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a transfer matrix
 * Requirements: 1.1, 8.1
 * 
 * Checks:
 * - All account references exist in the provided accounts
 * - Transfer speeds are valid enum values
 * - Fees are either null or non-negative numbers
 * - No duplicate relationships (same from/to/speed combination)
 */
export function validateTransferMatrix(
  transferMatrix: TransferRelationship[],
  accounts: Account[]
): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(transferMatrix)) {
    errors.push('Transfer matrix must be an array');
    return { isValid: false, errors };
  }

  // Build set of valid account IDs
  const validAccountIds = new Set(accounts.map(a => a.id));

  // Track unique relationships
  const relationshipKeys = new Set<string>();

  transferMatrix.forEach((relationship, index) => {
    const prefix = `Transfer relationship at index ${index}`;

    // Validate fromAccountId
    if (!relationship.fromAccountId || typeof relationship.fromAccountId !== 'string') {
      errors.push(`${prefix}: fromAccountId must be a non-empty string`);
    } else if (!validAccountIds.has(relationship.fromAccountId)) {
      errors.push(`${prefix}: fromAccountId "${relationship.fromAccountId}" does not exist in accounts`);
    }

    // Validate toAccountId
    if (!relationship.toAccountId || typeof relationship.toAccountId !== 'string') {
      errors.push(`${prefix}: toAccountId must be a non-empty string`);
    } else if (!validAccountIds.has(relationship.toAccountId)) {
      errors.push(`${prefix}: toAccountId "${relationship.toAccountId}" does not exist in accounts`);
    }

    // Validate speed
    if (!Object.values(TransferSpeed).includes(relationship.speed)) {
      errors.push(`${prefix}: Invalid transfer speed "${relationship.speed}"`);
    }

    // Validate fee
    if (relationship.fee !== null) {
      if (typeof relationship.fee !== 'number' || !isFinite(relationship.fee)) {
        errors.push(`${prefix}: Fee must be null or a finite number`);
      } else if (relationship.fee < 0) {
        errors.push(`${prefix}: Fee must be non-negative`);
      }
    }

    // Validate isAvailable
    if (typeof relationship.isAvailable !== 'boolean') {
      errors.push(`${prefix}: isAvailable must be a boolean`);
    }

    // Check for duplicates
    const key = `${relationship.fromAccountId}->${relationship.toAccountId}:${relationship.speed}`;
    if (relationshipKeys.has(key)) {
      errors.push(`${prefix}: Duplicate relationship from "${relationship.fromAccountId}" to "${relationship.toAccountId}" with speed "${relationship.speed}"`);
    }
    relationshipKeys.add(key);
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

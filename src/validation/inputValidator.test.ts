/**
 * Unit tests for input validation functions
 */

import { describe, it, expect } from 'vitest';
import { validateGoal, validateAccounts, validateTransferMatrix } from './inputValidator.js';
import {
  Goal,
  Account,
  TransferRelationship,
  AccountType,
  TransferSpeed,
  TransactionStatus
} from '../types/index.js';

describe('validateGoal', () => {
  const validGoal: Goal = {
    targetAccountId: 'target-123',
    amount: 1000,
    deadline: new Date(Date.now() + 86400000) // Tomorrow
  };

  it('should validate a valid goal', () => {
    const result = validateGoal(validGoal);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject goal with empty target account ID', () => {
    const goal = { ...validGoal, targetAccountId: '' };
    const result = validateGoal(goal);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Target account ID must be a non-empty string');
  });

  it('should reject goal with whitespace-only target account ID', () => {
    const goal = { ...validGoal, targetAccountId: '   ' };
    const result = validateGoal(goal);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Target account ID must be a non-empty string');
  });

  it('should reject goal with zero amount', () => {
    const goal = { ...validGoal, amount: 0 };
    const result = validateGoal(goal);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Goal amount must be greater than 0');
  });

  it('should reject goal with negative amount', () => {
    const goal = { ...validGoal, amount: -100 };
    const result = validateGoal(goal);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Goal amount must be greater than 0');
  });

  it('should reject goal with infinite amount', () => {
    const goal = { ...validGoal, amount: Infinity };
    const result = validateGoal(goal);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Goal amount must be a finite number');
  });

  it('should reject goal with deadline in the past', () => {
    const pastDate = new Date(Date.now() - 86400000); // Yesterday
    const goal = { ...validGoal, deadline: pastDate };
    const result = validateGoal(goal);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Deadline cannot be in the past');
  });

  it('should reject goal with invalid deadline', () => {
    const goal = { ...validGoal, deadline: new Date('invalid') };
    const result = validateGoal(goal);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Deadline must be a valid Date object');
  });

  it('should accept goal with deadline exactly at current time', () => {
    const now = new Date();
    const goal = { ...validGoal, deadline: now };
    const result = validateGoal(goal, now);
    expect(result.isValid).toBe(true);
  });
});

describe('validateAccounts', () => {
  const validAccount: Account = {
    id: 'acc-1',
    name: 'Checking Account',
    type: AccountType.CHECKING,
    balance: 5000,
    pendingTransactions: [],
    institutionType: 'traditional_bank',
    metadata: {
      lastUpdated: new Date(),
      isActive: true
    }
  };

  it('should validate a valid accounts array', () => {
    const result = validateAccounts([validAccount]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty accounts array', () => {
    const result = validateAccounts([]);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Accounts array must be non-empty');
  });

  it('should reject non-array input', () => {
    const result = validateAccounts(null as any);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Accounts array must be non-empty');
  });

  it('should reject account with empty ID', () => {
    const account = { ...validAccount, id: '' };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('ID must be a non-empty string'))).toBe(true);
  });

  it('should reject duplicate account IDs', () => {
    const account1 = { ...validAccount, id: 'duplicate' };
    const account2 = { ...validAccount, id: 'duplicate' };
    const result = validateAccounts([account1, account2]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate account ID'))).toBe(true);
  });

  it('should reject account with invalid type', () => {
    const account = { ...validAccount, type: 'invalid_type' as any };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid account type'))).toBe(true);
  });

  it('should reject account with non-finite balance', () => {
    const account = { ...validAccount, balance: Infinity };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Balance must be a finite number'))).toBe(true);
  });

  it('should reject account with invalid pending transactions', () => {
    const account = { ...validAccount, pendingTransactions: 'not-an-array' as any };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Pending transactions must be an array'))).toBe(true);
  });

  it('should validate account with valid pending transactions', () => {
    const account: Account = {
      ...validAccount,
      pendingTransactions: [
        {
          id: 'txn-1',
          accountId: 'acc-1',
          amount: -100,
          date: new Date(),
          status: TransactionStatus.PENDING,
          description: 'Test transaction'
        }
      ]
    };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(true);
  });

  it('should reject account with invalid transaction status', () => {
    const account: Account = {
      ...validAccount,
      pendingTransactions: [
        {
          id: 'txn-1',
          accountId: 'acc-1',
          amount: -100,
          date: new Date(),
          status: 'invalid_status' as any,
          description: 'Test'
        }
      ]
    };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid status'))).toBe(true);
  });

  it('should reject account with invalid institution type', () => {
    const account = { ...validAccount, institutionType: 'invalid' as any };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Institution type must be'))).toBe(true);
  });

  it('should reject account with invalid metadata', () => {
    const account = { ...validAccount, metadata: null as any };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Metadata must be an object'))).toBe(true);
  });

  it('should reject account with invalid metadata.lastUpdated', () => {
    const account = {
      ...validAccount,
      metadata: { ...validAccount.metadata, lastUpdated: new Date('invalid') }
    };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('lastUpdated must be a valid Date'))).toBe(true);
  });

  it('should reject account with invalid metadata.isActive', () => {
    const account = {
      ...validAccount,
      metadata: { ...validAccount.metadata, isActive: 'yes' as any }
    };
    const result = validateAccounts([account]);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('isActive must be a boolean'))).toBe(true);
  });
});

describe('validateTransferMatrix', () => {
  const accounts: Account[] = [
    {
      id: 'acc-1',
      name: 'Account 1',
      type: AccountType.CHECKING,
      balance: 1000,
      pendingTransactions: [],
      institutionType: 'traditional_bank',
      metadata: { lastUpdated: new Date(), isActive: true }
    },
    {
      id: 'acc-2',
      name: 'Account 2',
      type: AccountType.SAVINGS,
      balance: 2000,
      pendingTransactions: [],
      institutionType: 'neobank',
      metadata: { lastUpdated: new Date(), isActive: true }
    }
  ];

  const validRelationship: TransferRelationship = {
    fromAccountId: 'acc-1',
    toAccountId: 'acc-2',
    speed: TransferSpeed.INSTANT,
    fee: 5.00,
    isAvailable: true
  };

  it('should validate a valid transfer matrix', () => {
    const result = validateTransferMatrix([validRelationship], accounts);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate transfer with null fee', () => {
    const relationship = { ...validRelationship, fee: null };
    const result = validateTransferMatrix([relationship], accounts);
    expect(result.isValid).toBe(true);
  });

  it('should accept empty transfer matrix', () => {
    const result = validateTransferMatrix([], accounts);
    expect(result.isValid).toBe(true);
  });

  it('should reject non-array transfer matrix', () => {
    const result = validateTransferMatrix(null as any, accounts);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Transfer matrix must be an array');
  });

  it('should reject relationship with non-existent fromAccountId', () => {
    const relationship = { ...validRelationship, fromAccountId: 'non-existent' };
    const result = validateTransferMatrix([relationship], accounts);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('does not exist in accounts'))).toBe(true);
  });

  it('should reject relationship with non-existent toAccountId', () => {
    const relationship = { ...validRelationship, toAccountId: 'non-existent' };
    const result = validateTransferMatrix([relationship], accounts);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('does not exist in accounts'))).toBe(true);
  });

  it('should reject relationship with invalid speed', () => {
    const relationship = { ...validRelationship, speed: 'super_fast' as any };
    const result = validateTransferMatrix([relationship], accounts);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid transfer speed'))).toBe(true);
  });

  it('should reject relationship with negative fee', () => {
    const relationship = { ...validRelationship, fee: -10 };
    const result = validateTransferMatrix([relationship], accounts);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Fee must be non-negative'))).toBe(true);
  });

  it('should reject relationship with infinite fee', () => {
    const relationship = { ...validRelationship, fee: Infinity };
    const result = validateTransferMatrix([relationship], accounts);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Fee must be null or a finite number'))).toBe(true);
  });

  it('should reject relationship with invalid isAvailable', () => {
    const relationship = { ...validRelationship, isAvailable: 'yes' as any };
    const result = validateTransferMatrix([relationship], accounts);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('isAvailable must be a boolean'))).toBe(true);
  });

  it('should reject duplicate relationships', () => {
    const relationship1 = { ...validRelationship };
    const relationship2 = { ...validRelationship };
    const result = validateTransferMatrix([relationship1, relationship2], accounts);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate relationship'))).toBe(true);
  });

  it('should allow same accounts with different speeds', () => {
    const relationship1 = { ...validRelationship, speed: TransferSpeed.INSTANT };
    const relationship2 = { ...validRelationship, speed: TransferSpeed.SAME_DAY };
    const result = validateTransferMatrix([relationship1, relationship2], accounts);
    expect(result.isValid).toBe(true);
  });
});

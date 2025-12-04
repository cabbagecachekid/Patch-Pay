/**
 * Unit tests for available balance calculation
 * 
 * These tests demonstrate specific examples and edge cases
 */

import { describe, it, expect } from 'vitest';
import { calculateAvailableBalance } from './availableBalance';
import { Account, Transaction, TransactionStatus, AccountType } from '../types';

describe('Available Balance Calculation - Unit Tests', () => {
  const createAccount = (balance: number, pendingTransactions: Transaction[] = []): Account => ({
    id: 'test-account',
    name: 'Test Account',
    type: AccountType.CHECKING,
    balance,
    pendingTransactions,
    institutionType: 'traditional_bank',
    metadata: {
      lastUpdated: new Date(),
      isActive: true
    }
  });

  const createTransaction = (amount: number, status: TransactionStatus = TransactionStatus.PENDING): Transaction => ({
    id: `tx-${Math.random()}`,
    accountId: 'test-account',
    amount,
    date: new Date(),
    status,
    description: 'Test transaction'
  });

  it('should return account balance when there are no pending transactions', () => {
    const account = createAccount(1000);
    
    expect(calculateAvailableBalance(account)).toBe(1000);
  });

  it('should subtract pending debit from balance', () => {
    const account = createAccount(1000, [
      createTransaction(-100) // $100 pending debit
    ]);
    
    expect(calculateAvailableBalance(account)).toBe(900);
  });

  it('should subtract multiple pending debits from balance', () => {
    const account = createAccount(1000, [
      createTransaction(-100),
      createTransaction(-200),
      createTransaction(-50)
    ]);
    
    expect(calculateAvailableBalance(account)).toBe(650);
  });

  it('should not subtract pending credits from balance', () => {
    const account = createAccount(1000, [
      createTransaction(100), // $100 pending credit
      createTransaction(200)  // $200 pending credit
    ]);
    
    expect(calculateAvailableBalance(account)).toBe(1000);
  });

  it('should handle mix of pending debits and credits correctly', () => {
    const account = createAccount(1000, [
      createTransaction(-100), // Debit
      createTransaction(200),  // Credit (should be ignored)
      createTransaction(-50),  // Debit
      createTransaction(300)   // Credit (should be ignored)
    ]);
    
    expect(calculateAvailableBalance(account)).toBe(850);
  });

  it('should not subtract cleared transactions', () => {
    const account = createAccount(1000, [
      createTransaction(-100, TransactionStatus.CLEARED),
      createTransaction(-200, TransactionStatus.CLEARED)
    ]);
    
    expect(calculateAvailableBalance(account)).toBe(1000);
  });

  it('should not subtract failed transactions', () => {
    const account = createAccount(1000, [
      createTransaction(-100, TransactionStatus.FAILED),
      createTransaction(-200, TransactionStatus.FAILED)
    ]);
    
    expect(calculateAvailableBalance(account)).toBe(1000);
  });

  it('should only subtract pending debits, not cleared or failed debits', () => {
    const account = createAccount(1000, [
      createTransaction(-100, TransactionStatus.PENDING),
      createTransaction(-200, TransactionStatus.CLEARED),
      createTransaction(-50, TransactionStatus.FAILED)
    ]);
    
    expect(calculateAvailableBalance(account)).toBe(900);
  });

  it('should handle account with zero balance', () => {
    const account = createAccount(0);
    
    expect(calculateAvailableBalance(account)).toBe(0);
  });

  it('should allow negative available balance when pending debits exceed balance', () => {
    const account = createAccount(100, [
      createTransaction(-200)
    ]);
    
    expect(calculateAvailableBalance(account)).toBe(-100);
  });
});

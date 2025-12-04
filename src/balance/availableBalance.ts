/**
 * Available balance calculation utilities
 * 
 * Calculates the available balance for an account by subtracting
 * pending debit transactions from the account balance.
 */

import { Account, Transaction, TransactionStatus } from '../types';

/**
 * Calculates the available balance for an account
 * 
 * Available balance = account balance - sum of pending debit amounts
 * 
 * @param account - The account to calculate available balance for
 * @returns The available balance (balance minus pending debits)
 * 
 * Requirements: 1.3
 */
export function calculateAvailableBalance(account: Account): number {
  // Start with the account balance
  let availableBalance = account.balance;
  
  // Subtract pending debit transactions (negative amounts)
  for (const transaction of account.pendingTransactions) {
    if (transaction.status === TransactionStatus.PENDING && transaction.amount < 0) {
      // Subtract the debit (which is already negative, so we add it)
      availableBalance += transaction.amount;
    }
  }
  
  return availableBalance;
}

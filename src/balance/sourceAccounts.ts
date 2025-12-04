/**
 * Source account identification utilities
 * 
 * Identifies accounts that can be used as sources for transfers
 * based on their available balance.
 */

import { Account } from '../types';
import { calculateAvailableBalance } from './availableBalance';

/**
 * Identifies source accounts with available balance greater than zero
 * 
 * Filters the provided accounts to return only those that have
 * positive available balance (after accounting for pending transactions).
 * 
 * @param accounts - Array of accounts to evaluate
 * @returns Array of accounts with available balance > 0
 * 
 * Requirements: 1.2
 */
export function identifySourceAccounts(accounts: Account[]): Account[] {
  return accounts.filter(account => {
    const availableBalance = calculateAvailableBalance(account);
    return availableBalance > 0;
  });
}

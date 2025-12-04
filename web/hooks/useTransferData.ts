import { useState, useEffect } from 'react';
import { Account, TransferRelationship, AccountType, TransferSpeed, TransactionStatus } from '../../src/types/index.js';
import transferRulesData from '../data/transferRules.json';

interface TransferRulesData {
  accounts: any[];
  transferRules: any[];
  metadata: {
    lastUpdated: string;
    version: string;
    notes: string;
  };
}

export function useTransferData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transferMatrix, setTransferMatrix] = useState<TransferRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = transferRulesData as TransferRulesData;
      
      // Convert JSON accounts to typed Account objects
      const typedAccounts: Account[] = data.accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        type: acc.type as AccountType,
        balance: acc.balance,
        pendingTransactions: acc.pendingTransactions.map((tx: any) => ({
          id: tx.id,
          accountId: tx.accountId,
          amount: tx.amount,
          date: new Date(tx.date),
          status: tx.status as TransactionStatus,
          description: tx.description,
          category: tx.category
        })),
        institutionType: acc.institutionType as 'traditional_bank' | 'neobank',
        metadata: {
          lastUpdated: new Date(),
          isActive: true
        }
      }));

      // Convert JSON transfer rules to typed TransferRelationship objects
      const typedMatrix: TransferRelationship[] = data.transferRules.map(rule => ({
        fromAccountId: rule.from,
        toAccountId: rule.to,
        speed: rule.speed as TransferSpeed,
        fee: rule.fee,
        isAvailable: true
      }));

      setAccounts(typedAccounts);
      setTransferMatrix(typedMatrix);
      setLoading(false);
    } catch (error) {
      console.error('Error loading transfer data:', error);
      setLoading(false);
    }
  }, []);

  return { accounts, transferMatrix, loading, metadata: transferRulesData.metadata };
}

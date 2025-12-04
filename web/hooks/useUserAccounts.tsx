import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface UserAccount {
  id: string;
  bankId: string;
  bankName: string;
  accountType: string;
  balance: number;
  nickname?: string;
}

interface UserAccountsContextType {
  userAccounts: UserAccount[];
  addAccount: (account: UserAccount) => void;
  removeAccount: (id: string) => void;
  updateAccount: (id: string, updates: Partial<UserAccount>) => void;
  setAccounts: (accounts: UserAccount[]) => void;
  clearAccounts: () => void;
}

const UserAccountsContext = createContext<UserAccountsContextType | undefined>(undefined);

export function UserAccountsProvider({ children }: { children: ReactNode }) {
  const [userAccounts, setUserAccountsState] = useState<UserAccount[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('patchpay_user_accounts');
    if (stored) {
      try {
        const accounts = JSON.parse(stored);
        setUserAccountsState(accounts);
      } catch (error) {
        console.error('Error loading user accounts:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever accounts change (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('patchpay_user_accounts', JSON.stringify(userAccounts));
      
      // Dispatch custom event so other components can react
      window.dispatchEvent(new CustomEvent('userAccountsChanged', { 
        detail: { accounts: userAccounts } 
      }));
    }
  }, [userAccounts, isInitialized]);

  const addAccount = (account: UserAccount) => {
    setUserAccountsState(prev => {
      // Check if account already exists
      if (prev.some(acc => acc.id === account.id)) {
        return prev;
      }
      return [...prev, account];
    });
  };

  const removeAccount = (id: string) => {
    setUserAccountsState(prev => prev.filter(acc => acc.id !== id));
  };

  const updateAccount = (id: string, updates: Partial<UserAccount>) => {
    setUserAccountsState(prev =>
      prev.map(acc => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const setAccounts = (accounts: UserAccount[]) => {
    setUserAccountsState(accounts);
  };

  const clearAccounts = () => {
    setUserAccountsState([]);
    localStorage.removeItem('patchpay_user_accounts');
  };

  return (
    <UserAccountsContext.Provider
      value={{
        userAccounts,
        addAccount,
        removeAccount,
        updateAccount,
        setAccounts,
        clearAccounts
      }}
    >
      {children}
    </UserAccountsContext.Provider>
  );
}

export function useUserAccounts() {
  const context = useContext(UserAccountsContext);
  if (context === undefined) {
    throw new Error('useUserAccounts must be used within a UserAccountsProvider');
  }
  return context;
}

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTransferData } from '../hooks/useTransferData';
import { useUserAccounts, UserAccount } from '../hooks/useUserAccounts';

interface QuickAccountAddProps {
  userAccounts?: UserAccount[];
  onAddAccount?: (account: UserAccount) => void;
  onRemoveAccount?: (id: string) => void;
}

export default function QuickAccountAdd({ 
  userAccounts: propAccounts, 
  onAddAccount: propOnAddAccount, 
  onRemoveAccount: propOnRemoveAccount 
}: QuickAccountAddProps) {
  const { userAccounts: contextAccounts, addAccount, removeAccount } = useUserAccounts();
  const userAccounts = propAccounts || contextAccounts;
  const onAddAccount = propOnAddAccount || addAccount;
  const onRemoveAccount = propOnRemoveAccount || removeAccount;
  const { accounts } = useTransferData();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter accounts that user hasn't added yet
  const availableAccounts = accounts.filter(
    acc => !userAccounts.some(userAcc => userAcc.id === acc.id)
  );

  const filteredAccounts = availableAccounts.filter(acc =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuickAdd = (account: any) => {
    const newAccount: UserAccount = {
      id: account.id,
      bankId: account.id,
      bankName: account.name,
      accountType: account.type,
      balance: 0,
      nickname: undefined
    };
    onAddAccount(newAccount);
    setSearchTerm('');
  };

  return (
    <div className="industrial-panel p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm text-metropolis-cream tracking-wider">MY ACCOUNTS</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-metropolis-amber hover:text-metropolis-cream transition-colors tracking-wider"
          aria-label={isOpen ? 'Close account selector' : 'Add account'}
        >
          {isOpen ? '✕ CLOSE' : '+ ADD ACCOUNT'}
        </button>
      </div>

      {/* User's accounts list */}
      <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
        {userAccounts.length === 0 ? (
          <div className="text-xs text-metropolis-beige text-center py-2 italic">
            No accounts added yet
          </div>
        ) : (
          userAccounts.map(acc => (
            <div
              key={acc.id}
              className="flex justify-between items-center text-xs bg-black p-2 border border-metropolis-border"
            >
              <span className="text-metropolis-cream truncate flex-1">
                {acc.nickname || `${acc.bankName} - ${acc.accountType}`}
              </span>
              <button
                onClick={() => onRemoveAccount(acc.id)}
                className="text-metropolis-danger hover:text-red-400 ml-2 text-xs"
                aria-label={`Remove ${acc.nickname || acc.bankName}`}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Quick add dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-metropolis-border pt-3">
              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search accounts..."
                className="w-full bg-black border border-metropolis-cream px-3 py-2 text-xs text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white mb-2"
                aria-label="Search for accounts to add"
              />

              {/* Available accounts */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredAccounts.length === 0 ? (
                  <div className="text-xs text-metropolis-beige text-center py-4 italic">
                    {searchTerm ? 'No accounts found' : 'All accounts added'}
                  </div>
                ) : (
                  filteredAccounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => handleQuickAdd(acc)}
                      className="w-full text-left text-xs bg-metropolis-panel hover:bg-metropolis-steel text-metropolis-cream p-2 transition-colors border border-metropolis-border"
                      aria-label={`Add ${acc.name}`}
                    >
                      <div className="font-bold">{acc.name}</div>
                      <div className="text-xs opacity-75">{acc.type}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

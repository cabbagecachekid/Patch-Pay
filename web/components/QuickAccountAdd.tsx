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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs bg-amber-600 hover:bg-amber-500 text-black font-bold px-3 py-1 transition-colors tracking-wider"
        aria-label={isOpen ? 'Close account selector' : 'Add account'}
      >
        {isOpen ? '✕' : '+ ADD'}
      </button>

      {/* Quick add dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-64 bg-black border-2 border-amber-600 p-3 z-50 shadow-lg"
          >
            <h4 className="text-xs text-amber-500 font-bold mb-2 tracking-wider">ADD ACCOUNT</h4>
            
            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search accounts..."
              className="w-full bg-zinc-900 border border-amber-600 px-3 py-2 text-xs text-amber-100 font-mono focus:outline-none focus:border-amber-400 mb-2"
              aria-label="Search for accounts to add"
            />

            {/* Available accounts */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredAccounts.length === 0 ? (
                <div className="text-xs text-amber-600 text-center py-4 italic">
                  {searchTerm ? 'No accounts found' : 'All accounts added'}
                </div>
              ) : (
                filteredAccounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      handleQuickAdd(acc);
                      setIsOpen(false);
                    }}
                    className="w-full text-left text-xs bg-zinc-900 hover:bg-zinc-800 text-amber-100 p-2 transition-colors border border-amber-700"
                    aria-label={`Add ${acc.name}`}
                  >
                    <div className="font-bold">{acc.name}</div>
                    <div className="text-xs text-amber-700">{acc.type}</div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import bankDatabase from '../data/bankDatabase.json';
import { useUserAccounts, UserAccount } from '../hooks/useUserAccounts';
import { useDebounce } from '../hooks/useDebounce';

interface AccountSetupProps {
  onComplete: (accounts: UserAccount[]) => void;
}

export default function AccountSetup({ onComplete }: AccountSetupProps) {
  const { userAccounts: existingAccounts, setAccounts } = useUserAccounts();
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [accountType, setAccountType] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(existingAccounts);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search term for smoother filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredBanks = bankDatabase.banks.filter(bank =>
    bank.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const selectedBankData = bankDatabase.banks.find(b => b.id === selectedBank);

  const handleAddAccount = () => {
    if (!selectedBank || !accountType) return;

    const bank = bankDatabase.banks.find(b => b.id === selectedBank);
    if (!bank) return;

    const newAccount: UserAccount = {
      id: `${selectedBank}-${accountType}-${Date.now()}`,
      bankId: selectedBank,
      bankName: bank.name,
      accountType,
      balance: balance ? parseFloat(balance) : 0,
      nickname: nickname || undefined
    };

    setUserAccounts([...userAccounts, newAccount]);
    
    // Reset form
    setSelectedBank('');
    setAccountType('');
    setBalance('');
    setNickname('');
    setSearchTerm('');
  };

  const handleRemoveAccount = (id: string) => {
    setUserAccounts(userAccounts.filter(acc => acc.id !== id));
  };

  const handleComplete = () => {
    if (userAccounts.length > 0) {
      setAccounts(userAccounts); // Save to context
      onComplete(userAccounts);
    }
  };

  return (
    <div className="space-y-6">
      {/* Skip Options - Compact Module */}
      {userAccounts.length === 0 && (
        <div className="industrial-panel p-6">
          <h3 className="font-heading text-xl text-metropolis-cream mb-3 text-center tracking-wider">QUICK START OPTIONS</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Option 1: Skip with blank state */}
            <div className="text-center">
              <p className="text-sm text-metropolis-beige mb-3 h-12 flex items-center justify-center">
                Start fresh and add accounts as you go
              </p>
              <button
                onClick={() => onComplete([])}
                className="industrial-button-secondary w-full"
                aria-label="Skip setup and start with no accounts"
              >
                SKIP FOR NOW
              </button>
            </div>

            {/* Option 2: Explore with sample data */}
            <div className="text-center">
              <p className="text-sm text-metropolis-beige mb-3 h-12 flex items-center justify-center">
                Try it out with pre-loaded example accounts
              </p>
              <button
                onClick={() => {
                  // Load example accounts
                  const exampleAccounts = [
                    { id: 'chase_savings', bankId: 'chase', bankName: 'Chase Bank', accountType: 'savings', balance: 5000 },
                    { id: 'chase_checking', bankId: 'chase', bankName: 'Chase Bank', accountType: 'checking', balance: 2000 },
                    { id: 'cashapp_personal', bankId: 'cashapp', bankName: 'Cash App', accountType: 'personal', balance: 800 }
                  ];
                  onComplete(exampleAccounts);
                }}
                className="industrial-button-secondary w-full"
                aria-label="Explore with example accounts"
              >
                TRY EXAMPLE DATA
              </button>
            </div>
          </div>
          
          <div className="text-center text-xs text-metropolis-beige italic">
            Both options let you add accounts later from the Control Room
          </div>
        </div>
      )}

      <div className="industrial-panel p-6">
        <h2 className="font-heading text-3xl text-metropolis-cream mb-2 tracking-wider">ADD YOUR ACCOUNTS</h2>
        <p className="text-sm text-metropolis-beige mb-2">Tell us which banks and payment apps you use</p>
        <p className="text-xs text-metropolis-beige mb-6 italic opacity-90">
          💡 Why? We'll show you the fastest and cheapest ways to move money between your accounts. The more accounts you add, the more routing options we can find.
        </p>

        {/* Bank Search */}
        <div className="mb-4">
          <label htmlFor="bank-search" className="block text-sm text-metropolis-beige mb-2 tracking-wider">SEARCH BANKS</label>
          <input
            id="bank-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search..."
            className="w-full bg-black border-2 border-metropolis-cream px-4 py-3 text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            aria-label="Search for banks by name"
          />
        </div>

        {/* Bank Selection */}
        <div className="mb-4">
          <label className="block text-sm text-metropolis-beige mb-2 tracking-wider">SELECT BANK</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-black border border-metropolis-border" role="listbox" aria-label="Bank selection">
            {filteredBanks.map(bank => (
              <button
                key={bank.id}
                onClick={() => {
                  setSelectedBank(bank.id);
                  setSearchTerm('');
                }}
                className={`p-3 text-left text-sm transition-all ${
                  selectedBank === bank.id
                    ? 'bg-metropolis-cream text-metropolis-black'
                    : 'bg-metropolis-panel text-metropolis-cream hover:bg-metropolis-steel'
                }`}
                role="option"
                aria-selected={selectedBank === bank.id}
                aria-label={`${bank.name}, ${bank.type.replace('_', ' ')}`}
              >
                <div className="font-bold">{bank.name}</div>
                <div className="text-xs opacity-90">{bank.type.replace('_', ' ')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Account Type */}
        {selectedBankData && (
          <div className="mb-4">
            <label className="block text-sm text-metropolis-beige mb-2 tracking-wider">ACCOUNT TYPE</label>
            <div className="flex gap-2" role="group" aria-label="Account type selection">
              {selectedBankData.accountTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setAccountType(type)}
                  className={`px-4 py-2 text-base font-heading tracking-wider transition-all ${
                    accountType === type
                      ? 'bg-metropolis-cream text-metropolis-black'
                      : 'bg-metropolis-panel text-metropolis-cream hover:bg-metropolis-steel'
                  }`}
                  aria-pressed={accountType === type}
                  aria-label={`Select ${type.replace('_', ' ')} account type`}
                >
                  {type.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Balance and Nickname */}
        {accountType && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="account-balance" className="block text-sm text-metropolis-beige mb-2 tracking-wider">
                BALANCE ($) <span className="text-xs italic opacity-75">Optional</span>
              </label>
              <input
                id="account-balance"
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black border-2 border-metropolis-cream px-4 py-3 text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                aria-label="Account balance in dollars (optional)"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="account-nickname" className="block text-sm text-metropolis-beige mb-2 tracking-wider">
                NICKNAME <span className="text-xs italic opacity-75">Optional</span>
              </label>
              <input
                id="account-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="My Savings"
                className="w-full bg-black border-2 border-metropolis-cream px-4 py-3 text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                aria-label="Optional account nickname"
              />
            </div>
          </div>
        )}

        {/* Add Button */}
        {accountType && (
          <motion.button
            onClick={handleAddAccount}
            className="industrial-button w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.1, ease: [0.4, 0, 0.2, 1] } }}
          >
            ADD ACCOUNT
          </motion.button>
        )}
      </div>

      {/* User's Accounts */}
      {userAccounts.length > 0 && (
        <div className="industrial-panel p-6">
          <h3 className="font-heading text-2xl text-metropolis-cream mb-4 tracking-wider">YOUR ACCOUNTS</h3>
          <div className="space-y-2 mb-6">
            <AnimatePresence>
              {userAccounts.map(account => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="bg-black border border-metropolis-border p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="text-metropolis-cream font-bold">
                      {account.nickname || `${account.bankName} - ${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1).replace('_', ' ')}`}
                    </div>
                    <div className="text-xs text-metropolis-beige">
                      {account.bankName} • {account.accountType.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-metropolis-cream font-mono">
                        {account.balance > 0 ? `$${account.balance.toLocaleString()}` : 'No balance'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAccount(account.id)}
                      className="text-metropolis-danger hover:text-red-400 text-sm"
                    >
                      REMOVE
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={handleComplete}
            className="industrial-button w-full"
            whileHover={{ scale: 1.02, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.1, ease: [0.4, 0, 0.2, 1] } }}
          >
            CONTINUE TO ROUTING ({userAccounts.length} ACCOUNTS)
          </motion.button>
        </div>
      )}

      {/* Info */}
      <div className="text-center text-sm text-metropolis-beige" role="note">
        <p>Transfer fees and rules are automatically loaded from our bank database</p>
        <p className="mt-1">Database includes {bankDatabase.banks.length} banks and payment services</p>
      </div>

      {/* Suggest an Account */}
      <SuggestAccountSection />
    </div>
  );
}

function SuggestAccountSection() {
  const [suggestion, setSuggestion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;

    // Store suggestion in localStorage for demo purposes
    const suggestions = JSON.parse(localStorage.getItem('patchpay_suggestions') || '[]');
    suggestions.push({
      suggestion: suggestion.trim(),
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('patchpay_suggestions', JSON.stringify(suggestions));

    setSubmitted(true);
    setSuggestion('');

    // Reset after 3 seconds
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="industrial-panel p-6 border-2 border-dashed border-metropolis-border"
    >
      <div className="text-center mb-4">
        <h3 className="font-heading text-xl text-metropolis-cream tracking-wider mb-2">
          DON'T SEE YOUR BANK?
        </h3>
        <p className="text-sm text-metropolis-beige">
          Suggest a bank or payment app to add to our database
        </p>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-center py-6"
          >
            <div className="text-4xl mb-2">✓</div>
            <div className="text-metropolis-cream font-heading text-lg tracking-wider">
              SUGGESTION RECEIVED
            </div>
            <div className="text-sm text-metropolis-beige mt-2">
              Thank you for helping us improve!
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label htmlFor="suggestion" className="block text-sm text-metropolis-beige mb-2 tracking-wider">
                BANK OR APP NAME
              </label>
              <input
                id="suggestion"
                type="text"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="e.g., Ally Bank, Revolut, Wise..."
                required
                className="w-full bg-black border-2 border-metropolis-cream px-4 py-3 text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                aria-label="Suggest a bank or payment app"
              />
            </div>

            <button
              type="submit"
              className="industrial-button-secondary w-full"
            >
              SUBMIT SUGGESTION
            </button>

            <p className="text-xs text-metropolis-beige text-center italic">
              Your suggestion helps us expand our transfer network
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

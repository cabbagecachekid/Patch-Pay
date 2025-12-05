import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SwitchboardV2 from '../components/SwitchboardV2';
import RouteCalculator from '../components/RouteCalculator';
import AccountSetup from '../components/AccountSetup';
import QuickAccountAdd from '../components/QuickAccountAdd';
import { useUserAccounts } from '../hooks/useUserAccounts';

export default function ControlRoom() {
  const { userAccounts, addAccount, removeAccount, setAccounts } = useUserAccounts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');
  const [setupComplete, setSetupComplete] = useState(userAccounts.length > 0);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);

  // Check URL params for mode on mount
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'manual' && setupComplete) {
      setMode('manual');
      // Clear the URL param after reading it
      setSearchParams({});
    }
  }, [searchParams, setupComplete, setSearchParams]);

  const handleSetupComplete = (accounts: any[]) => {
    setAccounts(accounts);
    setSetupComplete(true);
  };

  const handleAddAccount = (account: any) => {
    addAccount(account);
  };

  const handleRemoveAccount = (id: string) => {
    removeAccount(id);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-amber-100 font-mono p-4 pb-20">
      {/* Header with Mode Selector */}
      <motion.div
        className="bg-black border-4 border-amber-600 p-4 mb-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-amber-500">CONTROL ROOM</h1>
            <p className="text-xs text-amber-700">FINANCIAL ROUTING SYSTEM</p>
          </div>
          
          {/* Mode selector */}
          {setupComplete && (
            <div className="flex items-center gap-3" role="group" aria-label="Routing mode selection">
              <span className="text-xs text-amber-700 tracking-wider hidden sm:inline">MODE:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('automatic')}
                  className={`px-4 py-2 text-sm tracking-wider transition ${
                    mode === 'automatic'
                      ? 'bg-amber-600 text-black font-bold'
                      : 'border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-black'
                  }`}
                  aria-pressed={mode === 'automatic'}
                  aria-label="Switch to automatic routing mode"
                >
                  AUTO
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`px-4 py-2 text-sm tracking-wider transition ${
                    mode === 'manual'
                      ? 'bg-amber-600 text-black font-bold'
                      : 'border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-black'
                  }`}
                  aria-pressed={mode === 'manual'}
                  aria-label="Switch to manual switchboard mode"
                >
                  MANUAL
                </button>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 border-2 border-green-600 text-green-400 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                {userAccounts.length} ACCOUNTS
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main content */}
      {!setupComplete ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AccountSetup onComplete={handleSetupComplete} />
        </motion.div>
      ) : mode === 'automatic' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar - Accounts */}
          <motion.div
            className="lg:col-span-1 space-y-4"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Account Management */}
            <div className="bg-black border-4 border-amber-600 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-amber-500">YOUR ACCOUNTS</h3>
                <QuickAccountAdd
                  userAccounts={userAccounts}
                  onAddAccount={handleAddAccount}
                  onRemoveAccount={handleRemoveAccount}
                />
              </div>
              
              <div className="text-xs text-amber-700 mb-3 pb-3 border-b border-amber-700">
                <div className="mb-1">{userAccounts.length} ACCOUNTS • ${userAccounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}</div>
                {userAccounts.length > 0 && (
                  <div className="text-xs text-amber-600 italic">Click balance to edit • Press Enter to save</div>
                )}
              </div>

              {/* Account List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userAccounts.length === 0 ? (
                  <div className="bg-zinc-900 border-2 border-amber-700 border-dashed p-6 text-center">
                    <div className="text-4xl mb-3">🏦</div>
                    <div className="text-sm text-amber-400 font-bold mb-2">NO ACCOUNTS YET</div>
                    <div className="text-xs text-amber-700 mb-4">
                      Add your bank accounts to start finding optimal transfer routes
                    </div>
                    <div className="text-xs text-amber-600 italic">
                      Click "+ ADD" above to get started
                    </div>
                  </div>
                ) : (
                  userAccounts.map((account, idx) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-zinc-900 border-2 border-amber-600 p-3 hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-amber-100 truncate" title={account.nickname || account.bankName}>
                            {account.nickname || account.bankName}
                          </div>
                          <div className="text-xs text-amber-700 capitalize">
                            {account.accountType.replace('_', ' ')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAccount(account.id)}
                          className="text-amber-700 hover:text-red-400 text-xs ml-2"
                          aria-label={`Remove ${account.nickname || account.bankName}`}
                        >
                          ✕
                        </button>
                      </div>
                      {editingBalance === account.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-amber-600 text-xs">$</span>
                          <input
                            type="number"
                            defaultValue={account.balance}
                            onBlur={(e) => {
                              const newBalance = parseFloat(e.target.value) || 0;
                              const updatedAccounts = userAccounts.map(acc =>
                                acc.id === account.id ? { ...acc, balance: newBalance } : acc
                              );
                              setAccounts(updatedAccounts);
                              setEditingBalance(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            autoFocus
                            className="flex-1 bg-black border border-amber-500 text-amber-400 font-mono px-2 py-1 text-sm focus:outline-none"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingBalance(account.id)}
                          className="w-full text-left text-base font-bold text-amber-400 font-mono hover:text-amber-300 transition-colors"
                          title="Click to edit balance"
                        >
                          ${account.balance.toLocaleString()}
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-black border-2 border-amber-700 p-3">
              <h3 className="text-xs text-amber-500 font-bold mb-3 border-b border-amber-700 pb-1">SYSTEM STATUS</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-700">ACCOUNTS</span>
                  <span className="text-amber-400 font-bold">{userAccounts.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-700">STATUS</span>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 bg-green-400 rounded-full"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-green-400">READY</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content - Route Calculator */}
          <motion.div
            className="lg:col-span-3"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <RouteCalculator userAccounts={userAccounts} />
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SwitchboardV2 />
        </motion.div>
      )}

    </div>
  );
}

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Switchboard from '../components/Switchboard';
import RouteCalculator from '../components/RouteCalculator';
import AccountSetup from '../components/AccountSetup';
import QuickAccountAdd from '../components/QuickAccountAdd';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../hooks/useAuth';
import { useUserAccounts } from '../hooks/useUserAccounts';

export default function ControlRoom() {
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth();
  const { userAccounts, addAccount, removeAccount, setAccounts } = useUserAccounts();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');
  const [setupComplete, setSetupComplete] = useState(userAccounts.length > 0);

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
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-28">
      {/* Page Title */}
      <motion.div
        className="industrial-panel p-4 md:p-6 mb-4 md:mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="font-heading text-2xl md:text-4xl brass-accent">CONTROL ROOM</h1>
        <p className="text-sm md:text-base text-metropolis-beige tracking-wider mt-1">FINANCIAL ROUTING OPERATIONS</p>
      </motion.div>

      {/* Mode selector - only show after setup */}
      {setupComplete && (
        <motion.div
          className="industrial-panel p-3 md:p-4 mb-4 md:mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4" role="group" aria-label="Routing mode selection">
            <span className="text-xs md:text-sm text-metropolis-beige tracking-wider">ROUTING MODE:</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setMode('automatic')}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2 text-sm md:text-base font-heading tracking-wider transition-all ${
                  mode === 'automatic'
                    ? 'bg-metropolis-cream text-metropolis-black'
                    : 'bg-metropolis-black text-metropolis-cream hover:text-metropolis-white'
                }`}
                aria-pressed={mode === 'automatic'}
                aria-label="Switch to automatic routing mode"
              >
                AUTO
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2 text-sm md:text-base font-heading tracking-wider transition-all ${
                  mode === 'manual'
                    ? 'bg-metropolis-cream text-metropolis-black'
                    : 'bg-metropolis-black text-metropolis-cream hover:text-metropolis-white'
                }`}
                aria-pressed={mode === 'manual'}
                aria-label="Switch to manual switchboard mode"
              >
                MANUAL
              </button>
            </div>
            <div className="text-xs text-metropolis-beige">
              {userAccounts.length} account{userAccounts.length !== 1 ? 's' : ''} connected
            </div>
          </div>
        </motion.div>
      )}

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel - Quick Account Management */}
          <motion.div
            className="space-y-4"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <QuickAccountAdd
              userAccounts={userAccounts}
              onAddAccount={handleAddAccount}
              onRemoveAccount={handleRemoveAccount}
            />

            <div className="industrial-panel p-4">
              <h3 className="text-sm text-metropolis-cream tracking-wider mb-3">SYSTEM STATUS</h3>
              <div className="gauge-display p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs tracking-wider">ACCOUNTS</span>
                  <span className="text-lg font-bold">{userAccounts.length}</span>
                </div>
                <div className="h-2 bg-black rounded-full overflow-hidden border border-metropolis-border">
                  <motion.div
                    className="h-full bg-metropolis-cream"
                    initial={{ width: 0 }}
                    animate={{ width: userAccounts.length > 0 ? '100%' : '0%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              <div className="gauge-display p-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs tracking-wider">STATUS</span>
                  <div className="flex gap-2 items-center" role="status" aria-live="polite">
                    <motion.div
                      className="w-2 h-2 bg-green-400"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      aria-hidden="true"
                    />
                    <span className="text-xs">OPERATIONAL</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center panel - Main interface */}
          <motion.div
            className="lg:col-span-2"
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
          <Switchboard userAccounts={userAccounts} />
        </motion.div>
      )}

    </div>
  );
}

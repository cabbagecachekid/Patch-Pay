import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { calculateOptimalRoutes } from '../../src/index.js';
import { Goal, Route } from '../../src/types/index.js';
import { useTransferData } from '../hooks/useTransferData';
import { useUserAccounts, UserAccount } from '../hooks/useUserAccounts';
import { useKeyboardShortcuts, getShortcutDisplay } from '../hooks/useKeyboardShortcuts';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface RouteCalculatorProps {
  userAccounts?: UserAccount[];
}

interface FavoriteRoute {
  id: string;
  name: string;
  route: Route;
  savedAt: string;
}

export default function RouteCalculator({ userAccounts: propAccounts }: RouteCalculatorProps) {
  const { userAccounts: contextAccounts } = useUserAccounts();
  // Use context accounts if available, otherwise fall back to props
  const userAccounts = contextAccounts.length > 0 ? contextAccounts : (propAccounts || []);
  const { accounts, transferMatrix, loading, metadata } = useTransferData();
  const [amount, setAmount] = useState('1000');
  const [targetAccount, setTargetAccount] = useState('zelle');
  const [primarySource, setPrimarySource] = useState<string>('');
  const [sourceAccounts, setSourceAccounts] = useState<string[]>([]);
  const [showAdvancedSources, setShowAdvancedSources] = useState(false);
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [favoriteRoutes, setFavoriteRoutes] = useLocalStorage<FavoriteRoute[]>('favorite_routes', []);
  const [showFavorites, setShowFavorites] = useState(false);
  const calculateButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+enter': () => {
      if (!calculating) {
        handleCalculate();
      }
    },
    'ctrl+k': () => {
      setShowFavorites(!showFavorites);
    },
    'escape': () => {
      if (showFavorites) {
        setShowFavorites(false);
      }
    }
  });

  const handleCalculate = () => {
    if (loading) return;
    
    setCalculating(true);
    
    const goal: Goal = {
      targetAccountId: targetAccount,
      amount: parseFloat(amount),
      deadline: new Date(deadline)
    };

    // Determine which accounts to use
    let accountsToUse = accounts;
    
    if (sourceAccounts.length > 0) {
      // Advanced: user selected specific accounts
      accountsToUse = accounts.filter(acc => sourceAccounts.includes(acc.id));
    } else if (primarySource) {
      // Simple: user selected a primary source
      accountsToUse = accounts.filter(acc => acc.id === primarySource);
    }
    // Otherwise use all accounts

    setTimeout(() => {
      const routes = calculateOptimalRoutes(goal, accountsToUse, transferMatrix);
      setResult(routes);
      setCalculating(false);
    }, 800);
  };

  const toggleSourceAccount = (accountId: string) => {
    setSourceAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  if (loading) {
    return (
      <div className="industrial-panel p-6 text-center">
        <div className="text-metropolis-cream">Loading transfer data...</div>
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cheapest': return '💰';
      case 'fastest': return '⚡';
      case 'recommended': return '⭐';
      default: return '•';
    }
  };

  const saveRoute = (route: Route) => {
    const savedRoute = {
      id: `route-${Date.now()}`,
      timestamp: new Date(),
      amount: parseFloat(amount),
      from: primarySource || 'multiple',
      to: targetAccount,
      category: route.category,
      totalFees: route.totalFees,
      estimatedArrival: route.estimatedArrival,
      steps: route.steps.length
    };

    // Load existing routes
    const existing = localStorage.getItem('patchpay_saved_routes');
    const routes = existing ? JSON.parse(existing) : [];
    routes.push(savedRoute);
    localStorage.setItem('patchpay_saved_routes', JSON.stringify(routes));

    alert('Route saved! View it in Analytics.');
  };

  const addToFavorites = (route: Route) => {
    const favoriteName = prompt('Name this favorite route:', `${route.category} - $${parseFloat(amount)}`);
    if (!favoriteName) return;

    const favorite: FavoriteRoute = {
      id: `fav-${Date.now()}`,
      name: favoriteName,
      route: route,
      savedAt: new Date().toISOString()
    };

    setFavoriteRoutes(prev => [...prev, favorite]);
    alert('Added to favorites! Press Ctrl+K to view.');
  };

  const removeFavorite = (id: string) => {
    setFavoriteRoutes(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Favorites Panel */}
      <AnimatePresence>
        {showFavorites && favoriteRoutes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="industrial-panel p-4 md:p-6 border-2 border-metropolis-amber"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-xl text-metropolis-cream tracking-wider">⭐ FAVORITE ROUTES</h3>
              <button
                onClick={() => setShowFavorites(false)}
                className="text-metropolis-beige hover:text-metropolis-cream text-sm"
              >
                CLOSE
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {favoriteRoutes.map(fav => (
                <div key={fav.id} className="bg-black border border-metropolis-border p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-metropolis-cream text-sm">{fav.name}</div>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="text-metropolis-danger hover:text-red-400 text-xs"
                    >
                      REMOVE
                    </button>
                  </div>
                  <div className="text-xs text-metropolis-beige space-y-1">
                    <div>Category: {fav.route.category}</div>
                    <div>Fees: ${fav.route.totalFees.toFixed(2)}</div>
                    <div>Steps: {fav.route.steps.length}</div>
                    <div className="text-xs opacity-75">Saved: {new Date(fav.savedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Info */}
      <div className="industrial-panel p-3 md:p-4 mb-4" role="status" aria-label="Data information">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs md:text-sm text-metropolis-beige">
          <div>
            <span className="tracking-wider">V{metadata.version}</span>
            <span className="mx-2 hidden sm:inline" aria-hidden="true">•</span>
            <span className="hidden sm:inline">UPDATED: {metadata.lastUpdated}</span>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <span className="tracking-wider">{accounts.length} ACCOUNTS</span>
              <span className="mx-2" aria-hidden="true">•</span>
              <span>{transferMatrix.length} ROUTES</span>
            </div>
            {favoriteRoutes.length > 0 && (
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className="text-metropolis-amber hover:text-metropolis-cream transition-colors text-xs tracking-wider"
              >
                ⭐ {favoriteRoutes.length} FAVORITES
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Input Form - Improved Hierarchy */}
      <div className="industrial-panel p-4 md:p-8">
        {/* Main Question - Hero Section */}
        <div className="mb-8">
          <h2 className="font-heading text-3xl md:text-5xl text-metropolis-cream mb-2 tracking-wider">
            HOW MUCH?
          </h2>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl md:text-4xl text-metropolis-amber font-bold">$</span>
            <input
              id="transfer-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black border-4 border-metropolis-amber pl-16 pr-6 py-4 md:py-6 text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white text-3xl md:text-5xl font-bold"
              style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              aria-label="Transfer amount in dollars"
              placeholder="1000"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Secondary Info - Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="transfer-deadline" className="block text-sm text-metropolis-beige mb-2 tracking-wider">
              WHEN DO YOU NEED IT?
            </label>
            <input
              id="transfer-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-black border-2 border-metropolis-cream px-4 py-3 text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white"
              style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              aria-label="Transfer deadline date and time"
            />
          </div>
        </div>

        {/* Target Account Selection - Prominent */}
        <div className="mb-8">
          <h3 className="font-heading text-2xl md:text-3xl text-metropolis-cream mb-3 tracking-wider">
            WHERE TO?
          </h3>
          <select
            id="target-account"
            value={targetAccount}
            onChange={(e) => setTargetAccount(e.target.value)}
            className="w-full bg-black border-3 border-metropolis-cream px-4 py-4 text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white text-lg md:text-xl"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            aria-label="Select destination account (required)"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-metropolis-beige mt-2">
            💡 Where the money needs to end up
          </p>
        </div>

        {/* Primary Source Selection - OPTIONAL */}
        <div className="mb-4 md:mb-6">
          <label htmlFor="primary-source" className="block text-xs md:text-sm text-metropolis-beige mb-2 tracking-wider">
            WHERE ARE YOU SENDING IT FROM? <span className="text-xs italic opacity-75">Optional</span>
          </label>
          <select
            id="primary-source"
            value={primarySource}
            onChange={(e) => {
              setPrimarySource(e.target.value);
              if (e.target.value) {
                setSourceAccounts([]); // Clear advanced selection
                setShowAdvancedSources(false);
              }
            }}
            className="w-full bg-black border-2 border-metropolis-cream px-3 md:px-4 py-2 md:py-3 text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white text-sm md:text-base"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            aria-label="Select primary source account (optional)"
          >
            <option value="">Use all available accounts (recommended)</option>
            {accounts
              .filter(acc => acc.id !== targetAccount)
              .map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
          </select>
          <p className="text-xs text-metropolis-beige mt-2 italic">
            💡 Leave blank to find routes from any of your accounts
          </p>
        </div>

        {/* Advanced Source Selection - Collapsible */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => {
              setShowAdvancedSources(!showAdvancedSources);
              if (!showAdvancedSources) {
                setPrimarySource(''); // Clear simple selection
              }
            }}
            className="text-xs text-metropolis-amber hover:text-metropolis-cream transition-colors tracking-wider mb-2"
          >
            {showAdvancedSources ? '▼' : '▶'} ADVANCED: Select specific accounts to use
          </button>

          {showAdvancedSources && (
            <div>
              <div className="space-y-4 p-2 md:p-3 bg-black border border-metropolis-border max-h-96 overflow-y-auto">
                {/* User's Added Accounts */}
            {userAccounts.length > 0 && (
              <div>
                <div className="text-xs text-metropolis-amber mb-2 tracking-wider font-bold">YOUR ACCOUNTS</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {userAccounts
                    .filter(acc => acc.id !== targetAccount)
                    .map(acc => {
                      const displayName = acc.nickname || `${acc.bankName} - ${acc.accountType.charAt(0).toUpperCase() + acc.accountType.slice(1).replace('_', ' ')}`;
                      return (
                        <button
                          key={acc.id}
                          onClick={() => toggleSourceAccount(acc.id)}
                          className={`p-2 text-left text-xs md:text-sm transition-all ${
                            sourceAccounts.includes(acc.id)
                              ? 'bg-metropolis-cream text-metropolis-black'
                              : 'bg-metropolis-panel text-metropolis-cream hover:bg-metropolis-steel'
                          }`}
                          aria-pressed={sourceAccounts.includes(acc.id)}
                          aria-label={`${sourceAccounts.includes(acc.id) ? 'Deselect' : 'Select'} ${displayName}`}
                        >
                          <div className="font-bold truncate">{displayName}</div>
                          <div className="text-xs opacity-90">
                            {acc.balance > 0 ? `$${acc.balance.toLocaleString()}` : 'No balance'}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Other Available Accounts */}
            <div>
              <div className="text-xs text-metropolis-beige mb-2 tracking-wider font-bold">
                {userAccounts.length > 0 ? 'OTHER AVAILABLE ACCOUNTS' : 'AVAILABLE ACCOUNTS'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {accounts
                  .filter(acc => {
                    // Exclude target account
                    if (acc.id === targetAccount) return false;
                    // Exclude accounts user has already added
                    if (userAccounts.some(userAcc => userAcc.id === acc.id)) return false;
                    return true;
                  })
                  .map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => toggleSourceAccount(acc.id)}
                      className={`p-2 text-left text-xs md:text-sm transition-all ${
                        sourceAccounts.includes(acc.id)
                          ? 'bg-metropolis-cream text-metropolis-black'
                          : 'bg-metropolis-panel text-metropolis-cream hover:bg-metropolis-steel'
                      }`}
                      aria-pressed={sourceAccounts.includes(acc.id)}
                      aria-label={`${sourceAccounts.includes(acc.id) ? 'Deselect' : 'Select'} ${acc.name}`}
                    >
                      <div className="font-bold truncate">{acc.name}</div>
                      <div className="text-xs opacity-90">${acc.balance.toLocaleString()}</div>
                    </button>
                  ))}
              </div>
            </div>
              </div>
              
              <p className="text-xs text-metropolis-beige mt-2 italic">
                {sourceAccounts.length === 0 
                  ? '💡 Select specific accounts or leave empty to use all'
                  : `✓ Using ${sourceAccounts.length} selected account${sourceAccounts.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
          )}
        </div>

        {/* Hero Calculate Button */}
        <div className="space-y-4 mt-8">
          <motion.button
            ref={calculateButtonRef}
            onClick={handleCalculate}
            disabled={calculating}
            className="w-full bg-metropolis-amber hover:bg-yellow-600 text-black font-heading text-2xl md:text-3xl py-6 md:py-8 tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            style={{ clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}
            whileHover={{ scale: calculating ? 1 : 1.02 }}
            whileTap={{ scale: calculating ? 1 : 0.98 }}
          >
            {calculating ? (
              <span className="flex items-center justify-center gap-3">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⚙️
                </motion.span>
                CALCULATING ROUTES...
              </span>
            ) : (
              'FIND MY ROUTES ⚡'
            )}
            
            {/* Animated background when calculating */}
            {calculating && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </motion.button>
          
          {/* Keyboard shortcuts hint - smaller */}
          <div className="flex justify-center gap-4 text-xs text-metropolis-beige opacity-75">
            <span>{getShortcutDisplay('ctrl+enter')} to calculate</span>
            <span aria-hidden="true">•</span>
            <span>{getShortcutDisplay('ctrl+k')} for favorites</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Error Display */}
            {'error' in result && (
              <div className="industrial-panel p-6 border-l-4 border-metropolis-danger" role="alert" aria-live="assertive">
                <h3 className="font-heading text-xl text-metropolis-danger mb-2 tracking-wider">ERROR</h3>
                <p className="text-metropolis-cream text-base">{result.message}</p>
                {result.shortfall && (
                  <p className="text-metropolis-beige mt-2 text-base">Shortfall: ${result.shortfall.toFixed(2)}</p>
                )}
              </div>
            )}

            {/* Success - Show Routes with Celebration */}
            {'routes' in result && (
              <>
                {/* Success Header */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="industrial-panel p-6 bg-gradient-to-r from-green-900/20 to-transparent border-l-4 border-green-400"
                >
                  <h2 className="font-heading text-3xl text-green-400 tracking-wider flex items-center gap-3">
                    <span className="text-4xl">✓</span>
                    ROUTES FOUND
                  </h2>
                  <p className="text-metropolis-beige mt-2">
                    We found {result.routes.length} way{result.routes.length > 1 ? 's' : ''} to move ${parseFloat(amount).toLocaleString()}
                  </p>
                </motion.div>

                {result.allRoutesRisky && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="industrial-panel p-4 border-l-4 border-yellow-600 bg-yellow-900 bg-opacity-10"
                    role="alert"
                    aria-live="polite"
                  >
                    <p className="text-yellow-400 text-base tracking-wider">
                      <span aria-label="Warning">⚠️</span> WARNING: ALL ROUTES EXCEED RISK THRESHOLD
                    </p>
                  </motion.div>
                )}

                {result.routes.map((route: Route, index: number) => (
                  <motion.div
                    key={route.category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="industrial-panel p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-heading text-xl md:text-2xl text-metropolis-cream tracking-wider flex items-center gap-2">
                          <span>{getCategoryIcon(route.category)}</span>
                          <span>{route.category.toUpperCase()}</span>
                        </h3>
                        <p className="text-xs text-metropolis-beige mt-1 italic line-clamp-2">{route.reasoning}</p>
                      </div>
                      <div className={`text-right ml-2 ${getRiskColor(route.riskLevel)}`}>
                        <div className="text-xs tracking-wider">{route.riskLevel.toUpperCase()}</div>
                        <div className="text-xl md:text-2xl font-bold">{route.riskScore.toFixed(0)}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                      <div className="gauge-display p-2 md:p-3">
                        <div className="text-xs md:text-sm text-metropolis-beige mb-1">FEES</div>
                        <div className="text-lg md:text-xl font-bold">${route.totalFees.toFixed(2)}</div>
                      </div>
                      <div className="gauge-display p-2 md:p-3">
                        <div className="text-xs md:text-sm text-metropolis-beige mb-1">ARRIVAL</div>
                        <div className="text-xs md:text-sm font-mono">{new Date(route.estimatedArrival).toLocaleDateString()}</div>
                      </div>
                      <div className="gauge-display p-2 md:p-3">
                        <div className="text-xs md:text-sm text-metropolis-beige mb-1">STEPS</div>
                        <div className="text-lg md:text-xl font-bold">{route.steps.length}</div>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                      <div className="text-xs md:text-sm text-metropolis-beige tracking-wider mb-2">STEPS:</div>
                      <ol className="space-y-2" aria-label={`${route.category} route steps`}>
                        {route.steps.map((step, i) => (
                          <li key={i} className="bg-black border border-metropolis-border p-2 md:p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm md:text-base text-metropolis-cream font-mono">
                                {step.fromAccountId.toUpperCase()} → {step.toAccountId.toUpperCase()}
                              </div>
                              <div className="text-xs md:text-sm text-metropolis-beige mt-1">
                                {step.method} <span aria-hidden="true">•</span> Fee: ${step.fee.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-base md:text-lg font-bold text-metropolis-cream">${step.amount.toFixed(2)}</div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Save Route Buttons */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => saveRoute(route)}
                        className="bg-metropolis-panel hover:bg-metropolis-steel text-metropolis-cream border border-metropolis-border px-4 py-2 text-sm tracking-wider transition-colors"
                      >
                        💾 SAVE TO HISTORY
                      </button>
                      <button
                        onClick={() => addToFavorites(route)}
                        className="bg-metropolis-panel hover:bg-metropolis-steel text-metropolis-cream border border-metropolis-border px-4 py-2 text-sm tracking-wider transition-colors"
                      >
                        ⭐ ADD TO FAVORITES
                      </button>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const [amount, setAmount] = useState('100');
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
        <div className="text-amber-100">Loading transfer data...</div>
      </div>
    );
  }

  // Show helpful message if no accounts
  if (userAccounts.length === 0) {
    return (
      <div className="bg-black border-4 border-amber-600 p-8 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl text-amber-400 font-bold mb-3 tracking-wider">READY TO FIND ROUTES</h2>
        <p className="text-amber-100 mb-4 max-w-md mx-auto">
          Add your bank accounts in the sidebar to start calculating optimal transfer routes
        </p>
        <div className="bg-zinc-900 border-2 border-amber-700 p-4 max-w-lg mx-auto text-left">
          <div className="text-xs text-amber-500 font-bold mb-2 tracking-wider">HOW IT WORKS:</div>
          <ol className="text-sm text-amber-100 space-y-2 list-decimal list-inside">
            <li>Add your bank accounts using the "+ ADD" button</li>
            <li>Enter the amount you want to transfer</li>
            <li>Set your deadline</li>
            <li>Click "FIND ROUTES" to see your options</li>
          </ol>
        </div>
        <div className="mt-6 text-xs text-amber-700 italic">
          Or try the example data from the setup screen
        </div>
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
      {/* Compact Favorites Panel */}
      <AnimatePresence>
        {showFavorites && favoriteRoutes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="industrial-panel p-3 border-2 border-amber-600"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-heading text-sm text-amber-100 tracking-wider">⭐ FAVORITES</h3>
              <button
                onClick={() => setShowFavorites(false)}
                className="text-amber-700 hover:text-amber-100 text-xs"
              >
                CLOSE
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {favoriteRoutes.map(fav => (
                <div key={fav.id} className="bg-black border border-amber-700 p-2">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-amber-100 text-xs truncate">{fav.name}</div>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="text-red-400 hover:text-red-400 text-xs ml-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-xs text-amber-700 space-y-0.5">
                    <div>{fav.route.category} • ${fav.route.totalFees.toFixed(2)}</div>
                    <div className="text-xs opacity-75">{fav.route.steps.length} steps</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Info */}
      <div className="bg-black border-2 border-amber-700 p-3 mb-4" role="status" aria-label="Data information">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-amber-700">
          <div>
            <span className="tracking-wider">V{metadata.version}</span>
            <span className="mx-2" aria-hidden="true">•</span>
            <span>{accounts.length} ACCOUNTS</span>
            <span className="mx-2" aria-hidden="true">•</span>
            <span>{transferMatrix.length} ROUTES</span>
          </div>
          {favoriteRoutes.length > 0 && (
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="text-amber-400 hover:text-amber-300 transition-colors text-xs tracking-wider"
            >
              ⭐ {favoriteRoutes.length} FAVORITES
            </button>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-black border-4 border-amber-600 p-4">
        {/* Main inputs - 1x3 grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label htmlFor="transfer-amount" className="block text-xs text-amber-700 mb-1 tracking-wider">
              AMOUNT
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-amber-600">$</span>
              <input
                id="transfer-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-900 border-2 border-amber-600 pl-6 pr-3 py-2 text-amber-100 font-mono focus:outline-none focus:border-amber-400 text-sm"
                aria-label="Transfer amount in dollars"
                placeholder="100"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label htmlFor="target-account" className="block text-xs text-amber-700 mb-1 tracking-wider">
              DESTINATION
            </label>
            <select
              id="target-account"
              value={targetAccount}
              onChange={(e) => setTargetAccount(e.target.value)}
              className="w-full bg-zinc-900 border-2 border-amber-600 px-3 py-2 text-amber-100 font-mono focus:outline-none focus:border-amber-400 text-sm"
              aria-label="Select destination account (required)"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="transfer-deadline" className="block text-xs text-amber-700 mb-1 tracking-wider">
              DEADLINE <span className="text-xs italic opacity-75">Optional</span>
            </label>
            <input
              id="transfer-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-zinc-900 border-2 border-amber-600 px-3 py-2 text-amber-100 font-mono focus:outline-none focus:border-amber-400 text-sm"
              aria-label="Transfer deadline date and time (optional)"
            />
          </div>
        </div>
        
        <p className="text-xs text-amber-700 mb-3 italic">
          Leave deadline blank for default 2-day deadline
        </p>

        {/* Primary Source Selection - OPTIONAL */}
        <div className="mb-4">
          <label htmlFor="primary-source" className="block text-xs text-amber-700 mb-2 tracking-wider">
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
            className="w-full bg-zinc-900 border-2 border-amber-600 px-3 py-2 text-amber-100 font-mono focus:outline-none focus:border-amber-400 text-sm"
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
          <p className="text-xs text-amber-700 mt-2 italic">
            Leave blank to find routes from any of your accounts
          </p>
        </div>

        {/* Advanced Source Selection - Collapsible */}
        <div className="mb-3">
          <label className="block text-xs text-amber-700 mb-2 tracking-wider">
            ADVANCED: SELECT SPECIFIC ACCOUNTS <span className="text-xs italic opacity-75">Optional</span>
          </label>
          <button
            onClick={() => {
              setShowAdvancedSources(!showAdvancedSources);
              if (!showAdvancedSources) {
                setPrimarySource(''); // Clear simple selection
              }
            }}
            className="w-full bg-zinc-900 border-2 border-amber-600 px-3 py-2 text-amber-100 font-mono hover:border-amber-400 transition-colors text-sm text-left flex items-center justify-between"
          >
            <span>
              {sourceAccounts.length === 0 
                ? 'Click to choose specific accounts...'
                : `${sourceAccounts.length} account${sourceAccounts.length > 1 ? 's' : ''} selected`
              }
            </span>
            <span className="text-amber-400">{showAdvancedSources ? '▼' : '▶'}</span>
          </button>

          {showAdvancedSources && (
            <div className="mt-2">
              <div className="space-y-4 p-2 md:p-3 bg-black border border-amber-700 max-h-96 overflow-y-auto">
                {/* User's Added Accounts */}
            {userAccounts.length > 0 && (
              <div>
                <div className="text-xs text-amber-400 mb-2 tracking-wider font-bold">YOUR ACCOUNTS</div>
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
                              ? 'bg-amber-600 text-black'
                              : 'bg-zinc-900 text-amber-100 hover:border-amber-500'
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
              <div className="text-xs text-amber-700 mb-2 tracking-wider font-bold">
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
                          ? 'bg-amber-600 text-black'
                          : 'bg-zinc-900 text-amber-100 hover:border-amber-500'
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
              
              <p className="text-xs text-amber-700 mt-2 italic">
                {sourceAccounts.length === 0 
                  ? '💡 Select specific accounts or leave empty to use all'
                  : `✓ Using ${sourceAccounts.length} selected account${sourceAccounts.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <div className="space-y-2 mt-4">
          <motion.button
            ref={calculateButtonRef}
            onClick={handleCalculate}
            disabled={calculating}
            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold text-lg py-3 tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            whileHover={{ scale: calculating ? 1 : 1.01 }}
            whileTap={{ scale: calculating ? 1 : 0.99 }}
          >
            {calculating ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⚙️
                </motion.span>
                CALCULATING...
              </span>
            ) : (
              '⚡ FIND ROUTES'
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
          
          {/* Keyboard shortcuts hint */}
          <div className="flex justify-center gap-4 text-xs text-amber-700">
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
              <div className="bg-black border-4 border-red-600 p-6" role="alert" aria-live="assertive">
                <h3 className="text-xl text-red-400 mb-2 tracking-wider font-bold">ERROR</h3>
                <p className="text-amber-100 text-base">{result.message}</p>
                {result.shortfall && (
                  <p className="text-amber-600 mt-2 text-base">Shortfall: ${result.shortfall.toFixed(2)}</p>
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
                  className="bg-green-950 border-4 border-green-600 p-6"
                >
                  <h2 className="text-2xl text-green-400 tracking-wider flex items-center gap-3 font-bold">
                    <span className="text-3xl">✓</span>
                    ROUTES FOUND
                  </h2>
                  <p className="text-green-600 mt-2 text-sm">
                    {result.routes.length} way{result.routes.length > 1 ? 's' : ''} to move ${parseFloat(amount).toLocaleString()}
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
                    className="bg-black border-4 border-amber-600 p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl text-amber-400 tracking-wider flex items-center gap-2 font-bold">
                          <span>{getCategoryIcon(route.category)}</span>
                          <span>{route.category.toUpperCase()}</span>
                        </h3>
                        <p className="text-xs text-amber-600 mt-1 italic line-clamp-2">{route.reasoning}</p>
                      </div>
                      <div className={`text-right ml-2 ${getRiskColor(route.riskLevel)}`}>
                        <div className="text-xs tracking-wider">{route.riskLevel.toUpperCase()}</div>
                        <div className="text-2xl font-bold">{route.riskScore.toFixed(0)}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-zinc-900 border-2 border-amber-700 p-3">
                        <div className="text-xs text-amber-700 mb-1">FEES</div>
                        <div className="text-lg font-bold text-amber-100">${route.totalFees.toFixed(2)}</div>
                      </div>
                      <div className="bg-zinc-900 border-2 border-amber-700 p-3">
                        <div className="text-xs text-amber-700 mb-1">ARRIVAL</div>
                        <div className="text-sm font-mono text-amber-100">{new Date(route.estimatedArrival).toLocaleDateString()}</div>
                      </div>
                      <div className="bg-zinc-900 border-2 border-amber-700 p-3">
                        <div className="text-xs text-amber-700 mb-1">STEPS</div>
                        <div className="text-lg font-bold text-amber-100">{route.steps.length}</div>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                      <div className="text-xs text-amber-500 tracking-wider mb-2 font-bold border-b border-amber-700 pb-1">STEPS:</div>
                      <ol className="space-y-2" aria-label={`${route.category} route steps`}>
                        {route.steps.map((step, i) => (
                          <li key={i} className="bg-zinc-900 border-2 border-amber-700 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm text-amber-100 font-mono">
                                {step.fromAccountId.toUpperCase()} → {step.toAccountId.toUpperCase()}
                              </div>
                              <div className="text-xs text-amber-700 mt-1">
                                {step.method} <span aria-hidden="true">•</span> Fee: ${step.fee.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-amber-100">${step.amount.toFixed(2)}</div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Save Route Buttons */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => saveRoute(route)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-2 border-amber-600 px-4 py-2 text-sm tracking-wider transition-colors"
                      >
                        💾 SAVE
                      </button>
                      <button
                        onClick={() => addToFavorites(route)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-2 border-amber-600 px-4 py-2 text-sm tracking-wider transition-colors"
                      >
                        ⭐ FAVORITE
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

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useUserAccounts } from '../hooks/useUserAccounts';

interface TransferMethod {
  id: string;
  name: string;
  short: string;
  description: string;
  avgTime: string;
  fee: number;
  risk: 'low' | 'medium' | 'high';
}

export default function SwitchboardV2() {
  const { userAccounts, addAccount } = useUserAccounts();
  const [amount, setAmount] = useState<string>('1000');
  const [selectedMethod, setSelectedMethod] = useState<string>('p2p');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Reset selected route when accounts change
  useEffect(() => {
    if (selectedRoute) {
      setSelectedRoute(null);
    }
  }, [userAccounts.length]);

  // Transfer methods with fees, time, and risk
  const transferMethods: TransferMethod[] = [
    { id: 'cashapp-instant', name: 'Cash App - Instant', short: 'CASH APP', description: 'Instant transfer with 1.5% fee', avgTime: 'Instant', fee: 1.5, risk: 'low' },
    { id: 'venmo-instant', name: 'Venmo - Instant', short: 'VENMO', description: 'Instant transfer with 1.75% fee', avgTime: 'Instant', fee: 1.75, risk: 'low' },
    { id: 'zelle', name: 'Zelle - Instant', short: 'ZELLE', description: 'Free instant bank transfer', avgTime: 'Instant', fee: 0, risk: 'low' },
    { id: 'ach', name: 'ACH - Standard', short: 'ACH', description: 'Free 1-3 day bank transfer', avgTime: '1-3 days', fee: 0, risk: 'low' },
    { id: 'wire', name: 'Wire - Same Day', short: 'WIRE', description: 'Same-day with $25 fee', avgTime: 'Same day', fee: 25, risk: 'medium' }
  ];

  // Initialize audio
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playClick = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  };

  const handleAddAccountSubmit = (accountData: any) => {
    addAccount(accountData);
    setShowAddAccount(false);
  };

  const findRoutes = () => {
    playClick();
    const method = transferMethods.find(m => m.id === selectedMethod);
    if (method) {
      setSelectedRoute({
        method,
        amount: parseFloat(amount) || 1000
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-amber-400';
    }
  };

  return (
    <div className="bg-zinc-900 font-mono">
      {/* Help Banner */}
      {showHelp && (
        <div className="mb-4 bg-amber-950 border-2 border-amber-600 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-sm text-amber-400 font-bold mb-1">MANUAL ROUTING MODE</div>
              <div className="text-xs text-amber-100">
                Select a transfer method and amount to see routing options. This mode lets you explore different transfer types (P2P, ACH, Wire, etc.) and their fees, timing, and risk levels.
              </div>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="text-amber-600 hover:text-amber-400 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="mb-6 bg-black border-4 border-amber-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-amber-500">SWITCHBOARD CONTROL PANEL</h2>
            <p className="text-xs text-amber-700">MANUAL CONNECTION SYSTEM • EST. 1927</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 border-2 border-green-600 text-green-400 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            OPERATOR READY
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs mb-1 text-amber-700">AMOUNT</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-amber-600">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-900 border-2 border-amber-600 text-amber-100 p-2 pl-6 text-lg focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 text-amber-700">METHOD</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full bg-zinc-900 border-2 border-amber-600 text-amber-100 p-2 text-sm focus:outline-none focus:border-amber-400"
            >
              {transferMethods.map(m => (
                <option key={m.id} value={m.id}>{m.short}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={findRoutes}
              className="w-full bg-amber-600 text-black font-bold p-2 text-sm hover:bg-amber-500 transition flex items-center justify-center gap-1"
            >
              ⚡ FIND ROUTES
            </button>
          </div>
        </div>
      </div>

      {/* Main Switchboard */}
      <div className="bg-zinc-800 border-4 border-amber-600 p-6 relative">
        {/* Background pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #d97706 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        ></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-amber-500">PATCH BOARD</h3>
            {selectedRoute && (
              <div className="text-xs text-green-400 border-2 border-green-600 px-3 py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  ROUTE PATCHED
                </div>
              </div>
            )}
          </div>

          {/* Accounts Summary */}
          {userAccounts.length > 0 && (
            <div className="mb-4 border-2 border-amber-700 p-3 bg-zinc-900">
              <div className="flex items-center justify-between">
                <div className="text-xs text-amber-500">
                  <span className="font-bold">{userAccounts.length} ACCOUNTS</span>
                  <span className="text-amber-700 ml-3">TOTAL: ${userAccounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400">LIVE</span>
                </div>
              </div>
            </div>
          )}

          {/* Switchboard Grid */}
          <div className="grid grid-cols-5 gap-6">
            {/* Left side: Source Accounts (3 columns) */}
            <div className="col-span-3 border-2 border-amber-700 p-4">
              <div className="text-xs text-amber-500 font-bold mb-3 border-b border-amber-700 pb-1 flex items-center justify-between">
                <span>SOURCE ACCOUNTS</span>
                <span className="text-amber-700 font-normal">{userAccounts.length} connected</span>
              </div>
              {userAccounts.length === 0 ? (
                <div className="text-center py-8 text-amber-700">
                  <div className="text-4xl mb-2">⚠</div>
                  <div className="text-sm">NO ACCOUNTS CONNECTED</div>
                  <div className="text-xs mt-2">Add accounts from Control Room</div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {userAccounts.slice(0, 9).map((account, idx) => {
                    const isActive = selectedRoute !== null;
                    return (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative border-4 p-3 transition-all ${
                          isActive
                            ? 'border-amber-400 bg-amber-950 shadow-lg shadow-amber-600/50'
                            : 'border-amber-700 hover:border-amber-500 cursor-pointer'
                        }`}
                      >
                        {/* Jack connector */}
                        <div className="flex justify-center mb-2">
                          <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center ${
                            isActive
                              ? 'border-amber-400 bg-amber-600'
                              : 'border-amber-700 bg-zinc-900'
                          }`}>
                            <div className="w-3 h-3 rounded-full bg-zinc-900"></div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="font-bold text-xs mb-1 truncate" title={account.nickname || account.bankName}>
                            {account.nickname || account.bankName}
                          </div>
                          <div className="text-xs text-amber-700 capitalize">{account.accountType.replace('_', ' ')}</div>
                          <div className={`text-sm font-bold mt-1 ${
                            account.balance >= parseFloat(amount) ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ${account.balance.toLocaleString()}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side: Transfer Methods (2 columns) */}
            <div className="col-span-2 border-2 border-amber-700 p-4">
              <div className="text-xs text-amber-500 font-bold mb-3 border-b border-amber-700 pb-1">
                TRANSFER METHODS
              </div>
              <div className="space-y-2">
                {transferMethods.map((method) => {
                  const isActive = selectedMethod === method.id && selectedRoute;
                  const isSelected = selectedMethod === method.id;
                  
                  return (
                    <div
                      key={method.id}
                      className={`relative border-4 p-3 transition-all ${
                        isActive
                          ? 'border-green-400 bg-green-950 shadow-lg shadow-green-600/50'
                          : isSelected
                            ? 'border-amber-400 bg-amber-950'
                            : 'border-amber-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Jack connector */}
                        <div className={`w-10 h-10 flex-shrink-0 rounded-full border-4 flex items-center justify-center ${
                          isActive
                            ? 'border-green-400 bg-green-600'
                            : isSelected
                              ? 'border-amber-400 bg-amber-600'
                              : 'border-amber-700 bg-zinc-900'
                        }`}>
                          <div className="w-3 h-3 rounded-full bg-zinc-900"></div>
                        </div>

                        <div className="flex-1">
                          <div className={`font-bold text-xs ${isActive ? 'text-green-400' : ''}`}>
                            {method.short}
                          </div>
                          <div className={`text-xs mt-1 ${
                            isActive ? 'text-green-600' : 'text-amber-700'
                          }`}>
                            ⏱ {method.avgTime}
                          </div>
                          <div className={`text-xs ${
                            isActive ? 'text-green-600' : 'text-amber-700'
                          }`}>
                            💵 ${method.fee}
                          </div>
                          <div className={`text-xs ${getRiskColor(method.risk)}`}>
                            Risk: {method.risk}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Connection Info */}
          {selectedRoute && (
            <div className="mt-4 border-4 border-green-600 bg-green-950 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-green-400 font-bold text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  ACTIVE CONNECTION
                </div>
                <button
                  onClick={() => setSelectedRoute(null)}
                  className="text-xs border border-green-600 px-2 py-1 hover:bg-green-600 hover:text-black transition"
                >
                  DISCONNECT
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-green-600">Method:</span>
                  <span className="ml-2 text-green-400 font-bold">{selectedRoute.method.short}</span>
                </div>
                <div>
                  <span className="text-green-600">Est. Time:</span>
                  <span className="ml-2 text-green-400 font-bold">{selectedRoute.method.avgTime}</span>
                </div>
                <div>
                  <span className="text-green-600">Fee:</span>
                  <span className="ml-2 text-green-400 font-bold">${selectedRoute.method.fee}</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-green-600">
                {selectedRoute.method.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-black border-2 border-amber-700 p-3">
        <h4 className="font-bold text-xs mb-2 text-amber-500">OPERATOR INSTRUCTIONS</h4>
        <div className="grid grid-cols-4 gap-2 text-xs text-amber-700">
          <div>1. SET AMOUNT</div>
          <div>2. SELECT METHOD</div>
          <div>3. FIND ROUTES</div>
          <div>4. VIEW DETAILS</div>
        </div>
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {showAddAccount && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/90 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-black border-2 border-metropolis-amber-600 p-6 max-w-md w-full mx-4 font-mono"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h3 className="text-xl text-metropolis-amber-400 mb-4 tracking-wider">ADD_ACCOUNT</h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs text-metropolis-amber-600 mb-1">BANK_NAME</label>
                  <input
                    type="text"
                    placeholder="Chase, BofA, etc."
                    className="w-full px-3 py-2 bg-zinc-900 border-2 border-metropolis-amber-600 text-metropolis-amber-100 text-sm focus:outline-none focus:border-metropolis-amber-500"
                    id="bank-name"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-metropolis-amber-600 mb-1">ACCOUNT_TYPE</label>
                  <select
                    className="w-full px-3 py-2 bg-zinc-900 border-2 border-metropolis-amber-600 text-metropolis-amber-100 text-sm focus:outline-none focus:border-metropolis-amber-500"
                    id="account-type"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-metropolis-amber-600 mb-1">BALANCE</label>
                  <input
                    type="number"
                    placeholder="1000"
                    className="w-full px-3 py-2 bg-zinc-900 border-2 border-metropolis-amber-600 text-metropolis-amber-100 text-sm focus:outline-none focus:border-metropolis-amber-500"
                    id="balance"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowAddAccount(false)}
                  className="px-3 py-2 border-2 border-metropolis-amber-600 text-metropolis-amber-400 hover:bg-metropolis-amber-600 hover:text-black transition-colors tracking-wider text-sm"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    const bankName = (document.getElementById('bank-name') as HTMLInputElement).value;
                    const accountType = (document.getElementById('account-type') as HTMLSelectElement).value;
                    const balance = parseFloat((document.getElementById('balance') as HTMLInputElement).value) || 0;
                    
                    if (bankName) {
                      handleAddAccountSubmit({
                        id: `acc-${Date.now()}`,
                        bankName,
                        accountType,
                        balance,
                        nickname: bankName
                      });
                    }
                  }}
                  className="px-3 py-2 bg-metropolis-amber-600 text-black hover:bg-metropolis-amber-500 transition-colors font-bold tracking-wider text-sm"
                >
                  ADD
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

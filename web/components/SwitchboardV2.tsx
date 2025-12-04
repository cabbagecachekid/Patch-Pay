import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useUserAccounts } from '../hooks/useUserAccounts';
import { calculateOptimalRoutes } from '../../src/index';
import { TransferSpeed, AccountType } from '../../src/types/index';

interface SwitchboardJack {
  id: string;
  label: string;
  bankName: string;
  accountType: string;
  balance: number;
  position: { row: number; col: number };
}

interface ActiveConnection {
  from: string;
  to: string;
  amount: number;
  routes?: any; // Will be the result from calculateOptimalRoutes
}

export default function SwitchboardV2() {
  const { userAccounts, addAccount } = useUserAccounts();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [activeConnection, setActiveConnection] = useState<ActiveConnection | null>(null);
  const [hoveredJack, setHoveredJack] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  // Create 9 ports - fill with user accounts, rest are empty
  const MAX_PORTS = 9;
  const jacks: (SwitchboardJack | null)[] = Array.from({ length: MAX_PORTS }, (_, index) => {
    if (index < userAccounts.length) {
      const acc = userAccounts[index];
      return {
        id: acc.id,
        label: acc.nickname || `${acc.bankName} ${acc.accountType}`,
        bankName: acc.bankName,
        accountType: acc.accountType,
        balance: acc.balance,
        position: { row: Math.floor(index / 3), col: index % 3 }
      };
    }
    return null; // Empty port
  });

  const handleJackClick = (jackId: string | null) => {
    if (!jackId) return; // Empty port
    
    playClick();
    
    if (!selectedSource) {
      // First click - select source
      setSelectedSource(jackId);
      setShowAmountInput(true);
    } else if (selectedSource === jackId) {
      // Clicked same jack - deselect
      setSelectedSource(null);
      setShowAmountInput(false);
      setAmount('');
    } else {
      // Second click - select target
      // Amount is optional - use 0 if not provided
      const transferAmount = amount && parseFloat(amount) > 0 ? parseFloat(amount) : 100; // Default $100
      calculateRoute(selectedSource, jackId, transferAmount);
    }
  };

  const handleContinueWithoutAmount = () => {
    setShowAmountInput(false);
    // User can now select target without specifying amount
  };

  const handleAddAccountSubmit = (accountData: any) => {
    addAccount(accountData);
    setShowAddAccount(false);
  };

  const calculateRoute = (fromId: string, toId: string, transferAmount: number) => {
    const sourceAcc = userAccounts.find(a => a.id === fromId);
    const targetAcc = userAccounts.find(a => a.id === toId);
    
    if (!sourceAcc || !targetAcc) return;

    try {
      // Build accounts array with proper Account type
      const accounts = userAccounts.map(acc => ({
        id: acc.id,
        name: acc.nickname || `${acc.bankName} ${acc.accountType}`,
        type: AccountType.CHECKING, // Default to checking
        balance: acc.balance,
        pendingTransactions: [],
        institutionType: 'traditional_bank' as const,
        metadata: {
          lastUpdated: new Date(),
          isActive: true
        }
      }));

      // Build transfer matrix - create simple direct connections between all accounts
      const transferMatrix = userAccounts.flatMap(from => 
        userAccounts
          .filter(to => to.id !== from.id)
          .map(to => ({
            fromAccountId: from.id,
            toAccountId: to.id,
            speed: TransferSpeed.ONE_DAY,
            fee: 2.50,
            isAvailable: true
          }))
      );

      // Create goal
      const goal = {
        targetAccountId: toId,
        amount: transferAmount,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };

      const result = calculateOptimalRoutes(goal, accounts, transferMatrix);

      if ('error' in result) {
        console.error('Routing error:', result.error);
        return;
      }

      setActiveConnection({
        from: fromId,
        to: toId,
        amount: transferAmount,
        routes: result
      });
      
      setSelectedSource(null);
      setShowAmountInput(false);
      setAmount('');
    } catch (error) {
      console.error('Route calculation failed:', error);
    }
  };

  // Custom cursor SVG for cable plug
  const cableCursor = `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <!-- Cable -->
      <path d="M 16 0 Q 16 8, 16 16" stroke="#e8dcc8" stroke-width="3" fill="none" stroke-linecap="round"/>
      
      <!-- Plug body -->
      <circle cx="16" cy="20" r="6" fill="#2a2a2a" stroke="#e8dcc8" stroke-width="2"/>
      <circle cx="16" cy="20" r="3" fill="#1a1a1a"/>
      
      <!-- Metal tip -->
      <circle cx="16" cy="20" r="2" fill="#8b6914"/>
      
      <!-- Highlight -->
      <circle cx="14" cy="18" r="1.5" fill="#f0e6d2" opacity="0.6"/>
    </svg>
  `)}`;

  return (
    <div className="industrial-panel p-8">
      {/* Custom cursor style */}
      <style>{`
        .cable-cursor {
          cursor: url('${cableCursor}') 16 16, pointer;
        }
        .cable-cursor-dragging {
          cursor: url('${cableCursor}') 16 16, grabbing;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading text-3xl brass-accent">SWITCHBOARD ROUTING</h2>
          <p className="text-sm text-metropolis-beige tracking-wider mt-1">
            MANUAL CONNECTION SYSTEM • EST. 1927
          </p>
        </div>
        <button
          onClick={() => setShowAddAccount(true)}
          className="px-4 py-2 bg-metropolis-amber text-black hover:bg-yellow-600 transition-colors tracking-wider text-sm font-bold"
        >
          + ADD ACCOUNT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Switchboard Panel */}
        <div className="lg:col-span-2">
          <div
            ref={boardRef}
            className={`relative bg-gradient-to-b from-[#1a1a1a] to-black border-4 border-metropolis-steel rounded-lg p-8 min-h-[600px] ${
              selectedSource ? 'cable-cursor-dragging' : 'cable-cursor'
            }`}
            style={{
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
            {/* Logo Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <img src="/logo.png" alt="" className="w-96 h-96 object-contain" />
            </div>

            {/* Worn texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 105, 20, 0.1) 2px, rgba(139, 105, 20, 0.1) 4px)`
            }} />

            {/* Jacks Grid - 9 ports (3x3) */}
            <div className="relative z-10 grid grid-cols-3 gap-8 p-8">
              {jacks.map((jack, index) => {
                const isEmpty = jack === null;
                const isSelected = jack && selectedSource === jack.id;
                const isHovered = jack && hoveredJack === jack.id;
                const isConnected = jack && activeConnection && (activeConnection.from === jack.id || activeConnection.to === jack.id);
                const row = Math.floor(index / 3);
                const col = index % 3;
                
                return (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: row * 0.1 + col * 0.05 }}
                  >
                    {/* Label above jack - only show if port has account */}
                    {!isEmpty && (
                      <div className="mb-3 text-center min-h-[48px]">
                        <div 
                          className="relative px-3 py-1 border border-[#3a3a3a] shadow-sm mb-1"
                          style={{
                            background: 'linear-gradient(180deg, #e8e0d0 0%, #d4c9b3 100%)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }}
                        >
                          <div className="text-[10px] font-mono text-black tracking-wide whitespace-nowrap">
                            {jack!.label.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-xs text-metropolis-beige">
                          ${jack!.balance.toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    {/* Empty space for alignment when no label */}
                    {isEmpty && <div className="mb-3 min-h-[48px]" />}

                    {/* Jack Socket */}
                    <motion.button
                      className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#2a2a2a] to-black border-2 transition-all"
                      style={{
                        borderColor: isSelected ? '#cc8800' : '#4a4a4a',
                        boxShadow: `inset 0 2px 4px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)${isSelected ? ', 0 0 15px rgba(204, 136, 0, 0.6)' : ''}`,
                        opacity: isEmpty ? 0.3 : 1,
                        cursor: isEmpty ? 'not-allowed' : 'pointer'
                      }}
                      whileHover={{ scale: isEmpty ? 1 : 1.05 }}
                      whileTap={{ scale: isEmpty ? 1 : 0.95 }}
                      onMouseEnter={() => !isEmpty && setHoveredJack(jack!.id)}
                      onMouseLeave={() => setHoveredJack(null)}
                      onClick={() => handleJackClick(jack?.id || null)}
                      disabled={isEmpty}
                    >
                      {/* Socket hole */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="w-8 h-8 rounded-full bg-black border border-[#1a1a1a]"
                          style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9)' }}
                        >
                          {!isEmpty && (isHovered || isSelected) && (
                            <motion.div
                              className="w-full h-full rounded-full bg-metropolis-amber"
                              initial={{ scale: 0 }}
                              animate={{ scale: 0.6, opacity: [0.5, 1, 0.5] }}
                              transition={{ opacity: { duration: 1, repeat: Infinity } }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Indicator light - OFF (dark) / ORANGE (has account) / GREEN (connected) */}
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                        <motion.div
                          className={`w-5 h-5 rounded-full border-2 border-black transition-all ${
                            isEmpty 
                              ? 'bg-[#1a1a1a]' // OFF - very dark
                              : isConnected 
                                ? 'bg-green-500' // GREEN - connected
                                : 'bg-[#ff8800]' // ORANGE - has account
                          }`}
                          style={{
                            boxShadow: isEmpty
                              ? 'inset 0 1px 3px rgba(0,0,0,0.9)' // No glow when off
                              : isConnected
                                ? '0 0 12px rgba(34, 197, 94, 0.9), inset 0 1px 3px rgba(100,255,100,0.6)' // Green glow
                                : '0 0 10px rgba(255, 136, 0, 0.7), inset 0 1px 3px rgba(255,200,100,0.4)' // Orange glow
                          }}
                          animate={
                            !isEmpty && !isConnected
                              ? { opacity: [0.7, 1, 0.7] }
                              : {}
                          }
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>

            {/* Amount Input Modal - Optional */}
            <AnimatePresence>
              {showAmountInput && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/90 z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-metropolis-panel border-4 border-metropolis-amber p-8 rounded max-w-md w-full mx-4"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                  >
                    <h3 className="text-2xl text-metropolis-cream mb-2 font-heading tracking-wider">TRANSFER AMOUNT</h3>
                    <p className="text-sm text-metropolis-beige mb-6 italic">Optional - you can skip this step</p>
                    
                    <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-metropolis-amber font-bold">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100"
                        className="w-full pl-12 pr-4 py-4 bg-black border-2 border-metropolis-cream text-metropolis-cream text-2xl font-mono focus:outline-none focus:border-metropolis-white"
                        autoFocus
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setShowAmountInput(false);
                          setSelectedSource(null);
                          setAmount('');
                        }}
                        className="px-4 py-3 border-2 border-metropolis-border text-metropolis-cream hover:bg-metropolis-steel transition-colors tracking-wider"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={handleContinueWithoutAmount}
                        className="px-4 py-3 bg-metropolis-amber text-black hover:bg-yellow-600 transition-colors font-bold tracking-wider"
                      >
                        CONTINUE →
                      </button>
                    </div>
                    
                    <p className="text-xs text-metropolis-beige mt-4 text-center">
                      💡 Click CONTINUE to select destination
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Account Modal */}
            <AnimatePresence>
              {showAddAccount && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black/90 z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-metropolis-panel border-4 border-metropolis-amber p-8 rounded max-w-md w-full mx-4"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                  >
                    <h3 className="text-2xl text-metropolis-cream mb-6 font-heading tracking-wider">ADD ACCOUNT</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm text-metropolis-beige mb-2">BANK NAME</label>
                        <input
                          type="text"
                          placeholder="Chase, Bank of America, etc."
                          className="w-full px-4 py-3 bg-black border-2 border-metropolis-cream text-metropolis-cream focus:outline-none focus:border-metropolis-white"
                          id="bank-name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-metropolis-beige mb-2">ACCOUNT TYPE</label>
                        <select
                          className="w-full px-4 py-3 bg-black border-2 border-metropolis-cream text-metropolis-cream focus:outline-none focus:border-metropolis-white"
                          id="account-type"
                        >
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-metropolis-beige mb-2">BALANCE</label>
                        <input
                          type="number"
                          placeholder="1000"
                          className="w-full px-4 py-3 bg-black border-2 border-metropolis-cream text-metropolis-cream focus:outline-none focus:border-metropolis-white"
                          id="balance"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowAddAccount(false)}
                        className="px-4 py-3 border-2 border-metropolis-border text-metropolis-cream hover:bg-metropolis-steel transition-colors tracking-wider"
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
                        className="px-4 py-3 bg-metropolis-amber text-black hover:bg-yellow-600 transition-colors font-bold tracking-wider"
                      >
                        ADD →
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Route Information Panel */}
        <div className="space-y-4">
          <div className="gauge-display p-4">
            <div className="text-sm text-metropolis-cream mb-3 tracking-wider">ACTIVE ROUTE</div>
            {activeConnection ? (
              <div className="space-y-3">
                <div className="text-xs text-metropolis-beige">
                  <div className="mb-2">
                    <span className="text-yellow-300">FROM:</span> {jacks.find(j => j && j.id === activeConnection.from)?.label || 'Unknown'}
                  </div>
                  <div className="mb-2">
                    <span className="text-yellow-300">TO:</span> {jacks.find(j => j && j.id === activeConnection.to)?.label || 'Unknown'}
                  </div>
                  <div className="mb-2">
                    <span className="text-yellow-300">AMOUNT:</span> ${activeConnection.amount.toLocaleString()}
                  </div>
                </div>
                
                {activeConnection.routes && (
                  <div className="border-t border-metropolis-border pt-3 mt-3">
                    <div className="text-xs text-metropolis-cream mb-2">ROUTE OPTIONS:</div>
                    {activeConnection.routes.cheapest && (
                      <div className="bg-black p-2 mb-2 text-xs">
                        <div className="text-green-400">💰 CHEAPEST</div>
                        <div className="text-metropolis-beige">Fee: ${activeConnection.routes.cheapest.totalFee.toFixed(2)}</div>
                      </div>
                    )}
                    {activeConnection.routes.fastest && (
                      <div className="bg-black p-2 mb-2 text-xs">
                        <div className="text-blue-400">⚡ FASTEST</div>
                        <div className="text-metropolis-beige">Days: {activeConnection.routes.fastest.arrivalBusinessDay}</div>
                      </div>
                    )}
                    {activeConnection.routes.recommended && (
                      <div className="bg-black p-2 text-xs">
                        <div className="text-yellow-400">⭐ RECOMMENDED</div>
                        <div className="text-metropolis-beige">Score: {activeConnection.routes.recommended.riskScore.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => setActiveConnection(null)}
                  className="w-full text-xs text-metropolis-danger hover:text-red-400 border border-metropolis-danger px-2 py-1"
                >
                  CLEAR
                </button>
              </div>
            ) : (
              <div className="text-xs text-metropolis-beige text-center py-8">
                NO ACTIVE ROUTE
              </div>
            )}
          </div>

          <div className="gauge-display p-4">
            <div className="text-sm text-metropolis-cream mb-3 tracking-wider">INSTRUCTIONS</div>
            <ul className="text-xs text-metropolis-beige space-y-2">
              <li>1. CLICK SOURCE ACCOUNT</li>
              <li>2. ENTER TRANSFER AMOUNT</li>
              <li>3. CLICK TARGET ACCOUNT</li>
              <li>4. VIEW ROUTE OPTIONS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

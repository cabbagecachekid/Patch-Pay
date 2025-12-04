import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import FeeCalculator from './FeeCalculator';
import SwitchboardMobile from './SwitchboardMobile';
import { useIsMobile } from '../hooks/useMediaQuery';

interface SwitchboardJack {
  id: string;
  label: string;
  number: number;
  type: 'source' | 'target';
  balance?: number;
  connected: boolean;
  position: { x: number; y: number };
}

interface Connection {
  id: string;
  from: string;
  to: string;
  amount: number;
  active: boolean;
  timestamp: Date;
}

interface Cable {
  from: { x: number; y: number };
  to: { x: number; y: number };
  active: boolean;
}

import { useUserAccounts, UserAccount } from '../hooks/useUserAccounts';

interface SwitchboardProps {
  userAccounts?: UserAccount[];
}

export default function Switchboard({ userAccounts: propAccounts }: SwitchboardProps) {
  const { userAccounts: contextAccounts } = useUserAccounts();
  // Use context accounts if available, otherwise fall back to props
  const userAccounts = contextAccounts.length > 0 ? contextAccounts : (propAccounts || []);
  const isMobile = useIsMobile();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoveredJack, setHoveredJack] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeCable, setActiveCable] = useState<Cable | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Use mobile version on small screens
  if (isMobile) {
    return (
      <div className="space-y-4">
        <SwitchboardMobile userAccounts={userAccounts} />
        <FeeCalculator />
      </div>
    );
  }

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Play muffled mechanical click sound (like old switchboard plug insertion)
  const playMuffledClick = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Create muffled sound with low-pass filter
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Low frequency for mechanical thunk
    oscillator.frequency.value = 180;
    oscillator.type = 'sine';
    
    // Low-pass filter for muffled effect
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.5;
    
    // Quick attack and decay for mechanical click
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  };

  // Play connection sound (muffled plug insertion)
  const playConnectionSound = () => {
    playMuffledClick();
  };

  // Play disconnect sound (muffled plug removal)
  const playDisconnectSound = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Slightly higher for unplug
    oscillator.frequency.value = 150;
    oscillator.type = 'sine';
    
    filter.type = 'lowpass';
    filter.frequency.value = 350;
    filter.Q.value = 0.5;
    
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  // Play hover sound (subtle)
  const playHoverSound = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  };

  // Define switchboard jacks (accounts) - dynamically from user accounts or defaults
  const jacks: SwitchboardJack[] = userAccounts.length > 0
    ? [
        // User's source accounts (left side) - vertical arrangement
        ...userAccounts.map((acc, index) => {
          const displayName = acc.nickname || `${acc.bankName} - ${acc.accountType}`;
          return {
            id: acc.id,
            label: displayName.toUpperCase().replace(/ - /g, ' - '),
            number: index + 1,
            type: 'source' as const,
            balance: acc.balance,
            connected: false,
            position: { x: 120, y: 80 + (index * 90) }
          };
        }),
        // Target account (right side) - use first account as target for demo
        {
          id: userAccounts[0]?.id + '-target' || 'target',
          label: 'TARGET ACCOUNT',
          number: userAccounts.length + 1,
          type: 'target' as const,
          connected: false,
          position: { x: 580, y: 200 }
        }
      ]
    : [
        // Default accounts if no user accounts
        { id: 'chase-savings', label: 'CHASE - SAVINGS', number: 1, type: 'source', balance: 5000, connected: false, position: { x: 120, y: 100 } },
        { id: 'chase-checking', label: 'CHASE - CHECKING', number: 2, type: 'source', balance: 1500, connected: false, position: { x: 120, y: 200 } },
        { id: 'cashapp-personal', label: 'CASH APP - PERSONAL', number: 3, type: 'source', balance: 800, connected: false, position: { x: 120, y: 300 } },
        { id: 'bofa-checking', label: 'BOFA - CHECKING', number: 4, type: 'target', connected: false, position: { x: 580, y: 200 } },
      ];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDragPosition({ x, y });
    
    const fromJack = jacks.find(j => j.id === dragging);
    if (fromJack) {
      setActiveCable({
        from: fromJack.position,
        to: { x, y },
        active: true
      });
    }
  };

  const handlePlugIn = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    const exists = connections.some(c => c.from === fromId && c.to === toId);
    if (exists) return;

    playConnectionSound();
    
    const newConnection: Connection = {
      id: `${fromId}-${toId}-${Date.now()}`,
      from: fromId,
      to: toId,
      amount: 0,
      active: true,
      timestamp: new Date()
    };
    
    setConnections(prev => [...prev, newConnection]);
  };

  const handleUnplug = (connectionId: string) => {
    playDisconnectSound();
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  const handleJackClick = (jackId: string) => {
    if (dragging) {
      if (dragging !== jackId) {
        handlePlugIn(dragging, jackId);
      }
      setDragging(null);
      setActiveCable(null);
      setDragPosition(null);
    } else {
      playHoverSound();
      setDragging(jackId);
    }
  };

  const clearAllConnections = () => {
    playDisconnectSound();
    setConnections([]);
  };

  return (
    <div className="industrial-panel p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-heading text-3xl brass-accent">SWITCHBOARD ROUTING</h2>
          <p className="text-sm text-metropolis-beige tracking-wider mt-1">
            MANUAL CONNECTION SYSTEM <span aria-hidden="true">•</span> EST. 1927
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {connections.length > 0 && (
            <button
              onClick={clearAllConnections}
              className="text-sm text-metropolis-danger hover:text-red-400 transition-colors tracking-wider"
              aria-label="Clear all connections"
            >
              CLEAR ALL
            </button>
          )}
          <div className="gauge-display px-4 py-2">
            <div className="flex items-center gap-2" role="status" aria-live="polite">
              <motion.div
                className="w-2 h-2 bg-yellow-400 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                aria-hidden="true"
              />
              <span className="text-sm">OPERATOR READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Switchboard + Active Connections Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Switchboard panel */}
        <div className="lg:col-span-2">
          <div 
            ref={boardRef}
            className="relative bg-gradient-to-b from-[#1a1a1a] to-black border-4 border-metropolis-steel rounded-lg p-8 min-h-[500px] cursor-crosshair overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              setDragging(null);
              setActiveCable(null);
              setDragPosition(null);
            }}
            style={{
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5)'
            }}
          >
        {/* Worn texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 105, 20, 0.1) 2px, rgba(139, 105, 20, 0.1) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 105, 20, 0.1) 2px, rgba(139, 105, 20, 0.1) 4px)
          `,
          backgroundSize: '20px 20px'
        }} />

        {/* Scratches and wear */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          background: `
            linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.03) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.03) 51%, transparent 52%)
          `,
          backgroundSize: '30px 30px'
        }} />

        {/* Decorative rivets */}
        {[
          { x: 8, y: 8 }, { x: 8, y: '50%' }, { x: 8, y: 'calc(100% - 8px)' },
          { x: 'calc(100% - 8px)', y: 8 }, { x: 'calc(100% - 8px)', y: '50%' }, { x: 'calc(100% - 8px)', y: 'calc(100% - 8px)' }
        ].map((pos, i) => (
          <div 
            key={i}
            className="absolute rivet" 
            style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
          />
        ))}

        {/* Connection cables (SVG) - Only show while dragging */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <filter id="cable-glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Fabric texture for cables */}
            <pattern id="cable-texture" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#e8dcc8" opacity="0.1"/>
              <line x1="0" y1="0" x2="4" y2="4" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            </pattern>
          </defs>
          
          {/* Active dragging cable - only visible while connecting */}
          {activeCable && (
            <motion.path
              d={`M ${activeCable.from.x} ${activeCable.from.y} 
                  Q ${(activeCable.from.x + activeCable.to.x) / 2} ${Math.min(activeCable.from.y, activeCable.to.y) - 50}, 
                  ${activeCable.to.x} ${activeCable.to.y}`}
              stroke="#e8dcc8"
              strokeWidth="3"
              fill="none"
              filter="url(#cable-glow)"
              strokeDasharray="8,4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
            />
          )}
          
          {/* Established connections - PERSISTENT STATIC WIRES */}
          <AnimatePresence>
            {connections.map((conn) => {
              const fromJack = jacks.find(j => j.id === conn.from);
              const toJack = jacks.find(j => j.id === conn.to);
              
              if (!fromJack || !toJack) return null;

              const midX = (fromJack.position.x + toJack.position.x) / 2;
              const midY = Math.min(fromJack.position.y, toJack.position.y) - 60;

              return (
                <motion.g key={conn.id}>
                  {/* Cable shadow */}
                  <motion.path
                    d={`M ${fromJack.position.x + 15} ${fromJack.position.y} 
                        Q ${midX} ${midY}, ${toJack.position.x - 15} ${toJack.position.y}`}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="4"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{ 
                      pathLength: { duration: 0.6, ease: "easeInOut" },
                      opacity: { duration: 0.3 }
                    }}
                  />
                  {/* Main cable - STAYS VISIBLE */}
                  <motion.path
                    d={`M ${fromJack.position.x + 15} ${fromJack.position.y} 
                        Q ${midX} ${midY}, ${toJack.position.x - 15} ${toJack.position.y}`}
                    stroke="#e8dcc8"
                    strokeWidth="3"
                    fill="none"
                    filter="url(#cable-glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.85 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{ 
                      pathLength: { duration: 0.6, ease: "easeInOut" },
                      opacity: { duration: 0.3 }
                    }}
                  />
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Jacks with authentic vintage styling */}
        <div className="relative" style={{ zIndex: 2 }}>
          {jacks.map((jack) => {
            const isConnected = connections.some(c => c.from === jack.id || c.to === jack.id);
            const isDraggingFrom = dragging === jack.id;
            
            return (
              <motion.div
                key={jack.id}
                className="absolute"
                style={{
                  left: jack.position.x,
                  top: jack.position.y,
                  transform: 'translate(-50%, -50%)'
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * jacks.indexOf(jack), type: 'spring', stiffness: 200 }}
              >
                <div className="relative">
                  {/* Paper label strip - authentic vintage style */}
                  <div className={`absolute ${jack.type === 'source' ? 'left-20' : 'right-20'} top-1/2 -translate-y-1/2`}>
                    <div 
                      className="relative px-3 py-1 border border-[#3a3a3a] shadow-sm"
                      style={{
                        background: 'linear-gradient(180deg, #e8e0d0 0%, #d4c9b3 100%)',
                        transform: 'rotate(-0.5deg)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                      }}
                    >
                      {/* Paper texture */}
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)`
                      }} />
                      
                      <div className="relative">
                        <div className="text-[10px] font-mono text-black tracking-wide whitespace-nowrap" style={{
                          textShadow: 'none',
                          fontFamily: 'Courier New, monospace'
                        }}>
                          {jack.label}
                        </div>
                        {jack.balance !== undefined && (
                          <div className="text-[9px] font-mono text-gray-700">
                            {jack.balance > 0 ? `$${jack.balance.toLocaleString()}` : 'No balance'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Jack number label */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-metropolis-beige font-mono">
                    {jack.number}
                  </div>

                  {/* Jack socket - authentic vintage style */}
                  <motion.button
                    className="relative w-12 h-12 rounded-full bg-gradient-to-b from-[#2a2a2a] to-black border-2 transition-all"
                    style={{
                      borderColor: isDraggingFrom ? '#cc8800' : isConnected ? '#10b981' : '#4a4a4a',
                      boxShadow: `
                        inset 0 2px 4px rgba(0,0,0,0.8),
                        0 2px 4px rgba(0,0,0,0.5),
                        ${isDraggingFrom || isConnected ? '0 0 10px rgba(139, 105, 20, 0.5)' : ''}
                      `
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={() => setHoveredJack(jack.id)}
                    onMouseLeave={() => setHoveredJack(null)}
                    onClick={() => handleJackClick(jack.id)}
                    aria-label={`${jack.label} jack ${jack.number}${jack.balance ? `, balance $${jack.balance}` : ''}`}
                    aria-pressed={isConnected}
                  >
                    {/* Socket hole */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div 
                        className="w-6 h-6 rounded-full bg-black border border-[#1a1a1a]"
                        style={{
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9)'
                        }}
                      >
                        <AnimatePresence>
                          {(hoveredJack === jack.id || isDraggingFrom) && (
                            <motion.div
                              className="w-full h-full rounded-full bg-metropolis-amber"
                              initial={{ scale: 0 }}
                              animate={{ scale: 0.6, opacity: [0.5, 1, 0.5] }}
                              exit={{ scale: 0 }}
                              transition={{ opacity: { duration: 1, repeat: Infinity } }}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Indicator light - separate from jack - BIGGER */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                      <motion.div
                        className={`w-5 h-5 rounded-full border-2 border-black ${
                          isConnected ? 'bg-[#ff8800]' : 'bg-[#2a2a2a]'
                        }`}
                        style={{
                          boxShadow: isConnected 
                            ? '0 0 12px rgba(255, 136, 0, 0.9), inset 0 1px 3px rgba(255,200,100,0.6)' 
                            : 'inset 0 1px 3px rgba(0,0,0,0.8)'
                        }}
                        animate={
                          isConnected
                            ? { opacity: [0.7, 1, 0.7] }
                            : {}
                        }
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

            {/* Instructions panel */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3"
              style={{
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid #4a4a4a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              role="status"
              aria-live="polite"
            >
              <div className="text-sm text-center font-mono">
                {dragging ? (
                  <span className="text-yellow-300 flex items-center gap-2 justify-center">
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      aria-hidden="true"
                    >
                      ●
                    </motion.span>
                    SELECT DESTINATION JACK
                  </span>
                ) : (
                  <span className="text-metropolis-beige">
                    CLICK SOURCE <span aria-hidden="true">•</span> THEN TARGET <span aria-hidden="true">•</span> AUDIO ENABLED
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Active Connections Panel - Next to Switchboard */}
        <div className="space-y-4">
          <div className="gauge-display p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-metropolis-cream tracking-wider">ACTIVE CONNECTIONS</div>
              <div className="text-sm text-metropolis-beige">{connections.length} ACTIVE</div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto" role="list" aria-label="Active connections">
              {connections.length === 0 ? (
                <div className="text-sm text-metropolis-beige text-center py-8">NO ACTIVE CONNECTIONS</div>
              ) : (
                connections.map((conn) => (
                  <motion.div
                    key={conn.id}
                    className="flex flex-col gap-2 text-sm bg-black p-3 rounded border border-metropolis-border"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    layout
                    role="listitem"
                  >
                    <div className="flex-1">
                      <div className="text-yellow-300 font-mono mb-1 text-xs">
                        {conn.from.toUpperCase()}
                      </div>
                      <div className="text-metropolis-cream text-center my-1">↓</div>
                      <div className="text-yellow-300 font-mono mb-1 text-xs">
                        {conn.to.toUpperCase()}
                      </div>
                      <div className="text-metropolis-beige text-xs mt-2">
                        {conn.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnplug(conn.id)}
                      className="text-metropolis-danger hover:text-red-400 transition-colors px-2 py-1 border border-metropolis-danger rounded text-xs w-full"
                      aria-label={`Unplug connection from ${conn.from} to ${conn.to}`}
                    >
                      UNPLUG
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="gauge-display p-4">
            <div className="text-sm text-metropolis-cream mb-3 tracking-wider">OPERATOR NOTES</div>
            <ul className="text-sm text-metropolis-beige space-y-2 font-mono" aria-label="Operator instructions">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400" aria-hidden="true">●</span>
                <span>MANUAL ROUTING SYSTEM</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400" aria-hidden="true">●</span>
                <span>CLICK JACKS TO CONNECT</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400" aria-hidden="true">●</span>
                <span>AUDIO FEEDBACK ENABLED</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400" aria-hidden="true">●</span>
                <span>VINTAGE 1927 EQUIPMENT</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Fee Calculator - Below Switchboard */}
      <div className="mt-8">
        <FeeCalculator />
      </div>
    </div>
  );
}

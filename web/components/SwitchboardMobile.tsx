import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { UserAccount } from '../hooks/useUserAccounts';

interface Connection {
  id: string;
  from: string;
  to: string;
  timestamp: Date;
}

interface SwitchboardMobileProps {
  userAccounts: UserAccount[];
}

/**
 * Mobile-optimized switchboard - simplified vertical layout
 * Maintains vintage aesthetic while being touch-friendly
 */
export default function SwitchboardMobile({ userAccounts }: SwitchboardMobileProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const handleConnect = (sourceId: string, targetId: string) => {
    const newConnection: Connection = {
      id: `${sourceId}-${targetId}-${Date.now()}`,
      from: sourceId,
      to: targetId,
      timestamp: new Date()
    };
    setConnections(prev => [...prev, newConnection]);
    setSelectedSource(null);
  };

  const handleDisconnect = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  const targetAccount = userAccounts[0]; // Use first account as target for demo

  return (
    <div className="industrial-panel p-4">
      <div className="mb-4">
        <h2 className="font-heading text-2xl brass-accent mb-1">SWITCHBOARD</h2>
        <p className="text-xs text-metropolis-beige">MOBILE ROUTING SYSTEM</p>
      </div>

      {/* Instructions */}
      <div className="bg-black border border-metropolis-border p-3 mb-4 text-xs text-metropolis-beige">
        <div className="font-bold mb-1 text-metropolis-cream">HOW TO CONNECT:</div>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Tap a SOURCE account</li>
          <li>Tap TARGET to complete connection</li>
          <li>View active connections below</li>
        </ol>
      </div>

      {/* Source Accounts */}
      <div className="mb-4">
        <div className="text-sm text-metropolis-beige mb-2 tracking-wider">SOURCE ACCOUNTS</div>
        <div className="space-y-2">
          {userAccounts.map((acc, index) => {
            const displayName = acc.nickname || `${acc.bankName} - ${acc.accountType}`;
            const isSelected = selectedSource === acc.id;
            const isConnected = connections.some(c => c.from === acc.id);

            return (
              <motion.button
                key={acc.id}
                onClick={() => setSelectedSource(acc.id)}
                className={`w-full p-3 text-left border-2 transition-all ${
                  isSelected
                    ? 'border-metropolis-amber bg-metropolis-amber bg-opacity-10'
                    : isConnected
                    ? 'border-green-500 bg-green-500 bg-opacity-10'
                    : 'border-metropolis-border bg-black'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-mono text-metropolis-beige">{index + 1}</div>
                      <div className="font-bold text-metropolis-cream text-sm">{displayName}</div>
                    </div>
                    <div className="text-xs text-metropolis-beige mt-1">
                      {acc.balance > 0 ? `$${acc.balance.toLocaleString()}` : 'No balance'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected && (
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    )}
                    {isSelected && (
                      <div className="text-metropolis-amber text-lg">→</div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Target Account */}
      {selectedSource && targetAccount && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="text-sm text-metropolis-beige mb-2 tracking-wider">TAP TO CONNECT</div>
          <button
            onClick={() => handleConnect(selectedSource, targetAccount.id)}
            className="w-full p-4 border-2 border-metropolis-cream bg-metropolis-cream bg-opacity-5 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-metropolis-cream">TARGET ACCOUNT</div>
                <div className="text-sm text-metropolis-beige mt-1">
                  {targetAccount.nickname || `${targetAccount.bankName} - ${targetAccount.accountType}`}
                </div>
              </div>
              <div className="text-2xl text-metropolis-amber">⚡</div>
            </div>
          </button>
        </motion.div>
      )}

      {/* Active Connections */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-metropolis-beige tracking-wider">
            ACTIVE CONNECTIONS ({connections.length})
          </div>
          {connections.length > 0 && (
            <button
              onClick={() => setConnections([])}
              className="text-xs text-metropolis-danger hover:text-red-400"
            >
              CLEAR ALL
            </button>
          )}
        </div>

        {connections.length === 0 ? (
          <div className="bg-black border border-metropolis-border p-4 text-center text-sm text-metropolis-beige">
            No active connections
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {connections.map(conn => {
                const sourceAcc = userAccounts.find(a => a.id === conn.from);
                const sourceName = sourceAcc?.nickname || sourceAcc?.bankName || conn.from;

                return (
                  <motion.div
                    key={conn.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-black border border-green-500 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm text-metropolis-cream font-mono">
                          {sourceName.toUpperCase()}
                        </div>
                        <div className="text-xs text-metropolis-beige mt-1">
                          → TARGET • {conn.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDisconnect(conn.id)}
                        className="text-metropolis-danger hover:text-red-400 text-xs px-2 py-1 border border-metropolis-danger"
                      >
                        UNPLUG
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Vintage Note */}
      <div className="mt-4 text-center text-xs text-metropolis-beige italic opacity-75">
        Vintage 1927 Technology • Modernized for Mobile
      </div>
    </div>
  );
}

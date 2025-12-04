import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface SavedRoute {
  id: string;
  timestamp: Date;
  amount: number;
  from: string;
  to: string;
  category: string;
  totalFees: number;
  estimatedArrival: Date;
  steps: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  useEffect(() => {
    // Load saved routes from localStorage
    const saved = localStorage.getItem('patchpay_saved_routes');
    if (saved) {
      const routes = JSON.parse(saved);
      setSavedRoutes(routes.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp),
        estimatedArrival: new Date(r.estimatedArrival)
      })));
    }
  }, []);

  const totalSaved = savedRoutes.reduce((sum, route) => {
    // Calculate savings vs worst case (assume 3% fee)
    const worstCase = route.amount * 0.03;
    return sum + (worstCase - route.totalFees);
  }, 0);

  const totalTransfers = savedRoutes.length;
  const avgFee = savedRoutes.length > 0 
    ? savedRoutes.reduce((sum, r) => sum + r.totalFees, 0) / savedRoutes.length 
    : 0;

  const clearHistory = () => {
    if (confirm('Clear all saved routes?')) {
      localStorage.removeItem('patchpay_saved_routes');
      setSavedRoutes([]);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 md:pb-28">
      {/* Header */}
      <motion.header
        className="industrial-panel p-4 md:p-6 mb-4 md:mb-8"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-heading text-2xl md:text-4xl brass-accent">TRANSFER HISTORY</h1>
            <p className="text-sm md:text-base text-metropolis-beige tracking-wider mt-1">YOUR ROUTING ANALYTICS</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-metropolis-cream hover:text-metropolis-white transition-colors text-sm md:text-base tracking-wider"
            aria-label="Return to home"
          >
            ← BACK
          </button>
        </div>
      </motion.header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          className="industrial-panel p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-sm text-metropolis-beige mb-2 tracking-wider">FEES AVOIDED</div>
          <div className="text-3xl font-bold text-green-400 font-mono">
            ${totalSaved.toFixed(2)}
          </div>
          <div className="text-xs text-metropolis-beige mt-2">vs. standard 3% fees</div>
        </motion.div>

        <motion.div
          className="industrial-panel p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-sm text-metropolis-beige mb-2 tracking-wider">TRANSFERS CALCULATED</div>
          <div className="text-3xl font-bold text-metropolis-cream font-mono">
            {totalTransfers}
          </div>
          <div className="text-xs text-metropolis-beige mt-2">routes analyzed</div>
        </motion.div>

        <motion.div
          className="industrial-panel p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-sm text-metropolis-beige mb-2 tracking-wider">AVG FEE</div>
          <div className="text-3xl font-bold text-metropolis-amber font-mono">
            ${avgFee.toFixed(2)}
          </div>
          <div className="text-xs text-metropolis-beige mt-2">per transfer</div>
        </motion.div>
      </div>

      {/* Saved Routes History */}
      <motion.div
        className="industrial-panel p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading text-2xl text-metropolis-cream tracking-wider">SAVED ROUTES</h2>
          {savedRoutes.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-metropolis-danger hover:text-red-400 transition-colors tracking-wider"
            >
              CLEAR HISTORY
            </button>
          )}
        </div>

        {savedRoutes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-metropolis-beige mb-4">No saved routes yet</p>
            <button
              onClick={() => navigate('/control-room')}
              className="industrial-button"
            >
              CALCULATE YOUR FIRST ROUTE
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {savedRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-black border border-metropolis-border p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
              >
                <div className="flex-1">
                  <div className="text-sm text-metropolis-cream font-bold mb-1">
                    ${route.amount.toLocaleString()} → {route.to}
                  </div>
                  <div className="text-xs text-metropolis-beige">
                    {route.timestamp.toLocaleDateString()} at {route.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-metropolis-beige mt-1">
                    {route.category.toUpperCase()} • {route.steps} steps
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <div className="text-xs text-metropolis-beige">Fee</div>
                    <div className="text-lg font-bold text-metropolis-amber font-mono">
                      ${route.totalFees.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-metropolis-beige">Arrival</div>
                    <div className="text-sm text-metropolis-cream">
                      {route.estimatedArrival.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

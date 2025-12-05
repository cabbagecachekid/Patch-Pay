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
    <div className="min-h-screen bg-zinc-900 text-amber-100 font-mono p-4 pb-24">
      {/* Header */}
      <motion.header
        className="bg-black border-4 border-amber-600 p-4 mb-6"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">SAVED ROUTES</h1>
            <p className="text-xs text-amber-700 tracking-wider mt-1">ROUTE CALCULATION HISTORY</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-amber-400 hover:text-amber-300 transition-colors text-sm tracking-wider"
            aria-label="Return to home"
          >
            ← BACK
          </button>
        </div>
      </motion.header>

      {/* Info Blurb */}
      <motion.div
        className="bg-amber-950 border-2 border-amber-600 p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-sm text-amber-100">
          Save routes you calculate frequently (like rent payments or recurring transfers) to quickly reference the optimal path, fees, and timing. Track your potential savings over time.
        </p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          className="bg-black border-2 border-amber-700 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-xs text-amber-700 mb-2 tracking-wider">POTENTIAL SAVINGS</div>
          <div className="text-3xl font-bold text-green-400">
            ${totalSaved.toFixed(2)}
          </div>
          <div className="text-xs text-amber-600 mt-2">vs. standard 3% fees</div>
        </motion.div>

        <motion.div
          className="bg-black border-2 border-amber-700 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-xs text-amber-700 mb-2 tracking-wider">ROUTES CALCULATED</div>
          <div className="text-3xl font-bold text-amber-100">
            {totalTransfers}
          </div>
          <div className="text-xs text-amber-600 mt-2">saved for reference</div>
        </motion.div>

        <motion.div
          className="bg-black border-2 border-amber-700 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-xs text-amber-700 mb-2 tracking-wider">AVG OPTIMAL FEE</div>
          <div className="text-3xl font-bold text-amber-400">
            ${avgFee.toFixed(2)}
          </div>
          <div className="text-xs text-amber-600 mt-2">per route</div>
        </motion.div>
      </div>

      {/* Saved Routes History */}
      <motion.div
        className="bg-black border-4 border-amber-600 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-amber-700">
          <h2 className="text-xl font-bold text-amber-500 tracking-wider">SAVED ROUTES</h2>
          {savedRoutes.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-red-400 hover:text-red-300 transition-colors tracking-wider"
            >
              CLEAR HISTORY
            </button>
          )}
        </div>

        {savedRoutes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-amber-400 font-bold mb-2 text-xl">NO SAVED ROUTES YET</p>
            <p className="text-amber-600 mb-6 text-sm max-w-md mx-auto">
              Calculate routes in the Control Room and click "SAVE" to track them here
            </p>
            <button
              onClick={() => navigate('/control-room')}
              className="bg-amber-600 text-black font-bold px-6 py-3 hover:bg-amber-500 transition tracking-wider"
            >
              GO TO CONTROL ROOM
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {savedRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-zinc-900 border-2 border-amber-700 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
              >
                <div className="flex-1">
                  <div className="text-sm text-amber-100 font-bold mb-1">
                    ${route.amount.toLocaleString()} → {route.to}
                  </div>
                  <div className="text-xs text-amber-700">
                    {route.timestamp.toLocaleDateString()} at {route.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-amber-600 mt-1">
                    {route.category.toUpperCase()} • {route.steps} steps
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <div className="text-xs text-amber-700">Fee</div>
                    <div className="text-lg font-bold text-amber-400">
                      ${route.totalFees.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-amber-700">Arrival</div>
                    <div className="text-sm text-amber-100">
                      {route.estimatedArrival.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Risk Explanation */}
      <motion.div
        className="bg-black border-2 border-amber-700 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-xs text-amber-500 font-bold mb-3 tracking-wider">HOW RISK IS CALCULATED</h3>
        <div className="text-xs text-amber-100 space-y-2">
          <div><span className="text-amber-400">•</span> <span className="text-amber-600">Timing (50%):</span> How much buffer time before your deadline</div>
          <div><span className="text-amber-400">•</span> <span className="text-amber-600">Reliability (30%):</span> Transfer method reliability (instant vs. ACH)</div>
          <div><span className="text-amber-400">•</span> <span className="text-amber-600">Complexity (20%):</span> Number of transfer steps (fewer is better)</div>
          <div className="pt-2 border-t border-amber-800 mt-2">
            <span className="text-green-400">Low (0-30):</span> Safe choice • 
            <span className="text-yellow-400 ml-2">Medium (31-60):</span> Acceptable • 
            <span className="text-red-400 ml-2">High (61-100):</span> Risky
          </div>
        </div>
      </motion.div>
    </div>
  );
}

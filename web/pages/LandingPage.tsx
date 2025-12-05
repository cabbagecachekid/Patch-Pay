import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';
import SwitchboardV2 from '../components/SwitchboardV2';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuth = (email: string) => {
    signIn(email);
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-black text-amber-100 font-mono overflow-hidden">
      {/* Terminal Grid Background */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, #D97706 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* User account - top right corner */}
        <motion.div
          className="absolute top-4 right-4 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {user ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-amber-400">{user.email}</span>
              <button
                onClick={signOut}
                className="text-amber-600 hover:text-amber-400 transition-colors"
              >
                [EXIT]
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              [SIGN_IN]
            </button>
          )}
        </motion.div>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuth={handleAuth} />

        {/* Main Terminal Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            className="max-w-2xl w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Compact Logo */}
            <motion.div
              className="w-20 h-20 mx-auto mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <img
                src="/logo.png"
                alt="Patch Pay Logo"
                className="w-full h-full object-contain opacity-80"
              />
            </motion.div>

            {/* Compact Title */}
            <div className="text-center mb-6">
              <div className="text-4xl md:text-5xl font-bold text-amber-400 tracking-wider mb-1">
                PATCH PAY
              </div>
              <div className="text-sm text-amber-600 tracking-widest">
                TRANSFER ROUTING SYSTEM
              </div>
            </div>

            {/* Description */}
            <div className="mb-4 text-sm text-amber-100 leading-relaxed text-center">
              Find the cheapest, fastest way to move money between your accounts
            </div>
            <div className="mb-4 text-xs text-amber-700 leading-relaxed text-center">
              <span className="text-amber-400">&gt;</span> 1927 SWITCHBOARD TECH • MODERN ROUTING • OPTIMAL PATHS
            </div>

            {/* Features - Compact */}
            <div className="mb-4 text-xs space-y-1 text-center">
              <div className="text-amber-100">• MULTI-HOP TRANSFERS</div>
              <div className="text-amber-100">• REAL-TIME CALCULATION</div>
              <div className="text-amber-100">• RISK OPTIMIZATION</div>
            </div>

            {/* Commands - Compact */}
            <div className="space-y-2">
              <motion.button
                onClick={() => navigate('/control-room')}
                className="block w-full bg-amber-600 text-black font-bold px-4 py-2 text-sm tracking-wider hover:bg-amber-500 transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                &gt; START_CONTROL_ROOM
              </motion.button>
              
              <motion.button
                onClick={() => {
                  navigate('/control-room');
                  // Set mode to manual after navigation
                  setTimeout(() => {
                    const manualButton = document.querySelector('[aria-label="Switch to manual switchboard mode"]') as HTMLButtonElement;
                    manualButton?.click();
                  }, 100);
                }}
                className="block w-full border-2 border-amber-400 bg-amber-950 text-amber-400 hover:bg-amber-600 hover:text-black font-bold px-4 py-2 text-sm tracking-wider transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                &gt; OPEN_SWITCHBOARD
              </motion.button>
              
              <motion.button
                onClick={() => navigate('/analytics')}
                className="block w-full border-2 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black font-bold px-4 py-2 text-sm tracking-wider transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                &gt; VIEW_SAVED_ROUTES
              </motion.button>
            </div>

            {/* Footer */}
            <div className="text-xs text-amber-700 mt-6 text-center">
              SPEC-DRIVEN • PROPERTY-TESTED • KIRO-BUILT
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

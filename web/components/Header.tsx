import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import SwitchboardV2 from './SwitchboardV2';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSwitchboard, setShowSwitchboard] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Handle ESC key to close switchboard
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSwitchboard) {
        setShowSwitchboard(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showSwitchboard]);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-metropolis-panel border-b-2 border-metropolis-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo / Brand */}
          <button
            onClick={() => navigate('/')}
            className="hover:opacity-80 transition-opacity"
            aria-label="Go to home page"
          >
            <div className="font-heading text-xl brass-accent tracking-wider">PATCH PAY</div>
            <div className="text-xs text-metropolis-beige tracking-wider hidden sm:block">
              THE TRANSFER TOWER
            </div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-2 text-sm tracking-wider transition-all ${
                isActive('/')
                  ? 'text-metropolis-cream border-b-2 border-metropolis-cream'
                  : 'text-metropolis-beige hover:text-metropolis-cream'
              }`}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              HOME
            </button>
            <button
              onClick={() => navigate('/control-room')}
              className={`px-3 py-2 text-sm tracking-wider transition-all ${
                isActive('/control-room')
                  ? 'text-metropolis-cream border-b-2 border-metropolis-cream'
                  : 'text-metropolis-beige hover:text-metropolis-cream'
              }`}
              aria-current={isActive('/control-room') ? 'page' : undefined}
            >
              CONTROL ROOM
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className={`px-3 py-2 text-sm tracking-wider transition-all ${
                isActive('/analytics')
                  ? 'text-metropolis-cream border-b-2 border-metropolis-cream'
                  : 'text-metropolis-beige hover:text-metropolis-cream'
              }`}
              aria-current={isActive('/analytics') ? 'page' : undefined}
            >
              HISTORY
            </button>

            {/* Switchboard Access Button */}
            <button
              onClick={() => setShowSwitchboard(true)}
              className="px-3 py-2 text-sm tracking-wider transition-all bg-metropolis-amber/20 border border-metropolis-amber text-metropolis-amber hover:bg-metropolis-amber/30 rounded"
              aria-label="Open switchboard routing panel"
            >
              SWITCHBOARD
            </button>

            {/* Auth */}
            <div className="ml-2 pl-2 border-l border-metropolis-border hidden md:block">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-metropolis-beige">{user.email}</span>
                  <button
                    onClick={signOut}
                    className="text-xs text-metropolis-beige hover:text-metropolis-cream transition-colors"
                  >
                    SIGN OUT
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm text-metropolis-cream hover:text-metropolis-white transition-colors tracking-wider"
                >
                  SIGN IN
                </button>
              )}
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-[60px]" aria-hidden="true" />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={(email) => {
          signIn(email);
          setShowAuthModal(false);
        }}
      />

      {/* Switchboard Modal */}
      <AnimatePresence>
        {showSwitchboard && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/80 z-[60]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSwitchboard(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              className="fixed inset-4 md:inset-8 z-[70] overflow-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="relative max-w-7xl mx-auto">
                {/* Close Button */}
                <button
                  onClick={() => setShowSwitchboard(false)}
                  className="absolute top-4 right-4 z-10 px-4 py-2 bg-metropolis-panel border-2 border-metropolis-border text-metropolis-cream hover:text-metropolis-white transition-colors tracking-wider text-sm"
                  aria-label="Close switchboard"
                >
                  CLOSE [ESC]
                </button>
                
                {/* Switchboard Component */}
                <SwitchboardV2 />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

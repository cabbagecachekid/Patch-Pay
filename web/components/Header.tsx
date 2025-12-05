import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Handle ESC key to close settings menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSettingsMenu) {
        setShowSettingsMenu(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showSettingsMenu]);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showSettingsMenu && !target.closest('.settings-menu-container')) {
        setShowSettingsMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-black border-b-4 border-amber-600 font-mono"
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
            <div className="text-xl font-bold text-amber-500 tracking-wider">PATCH PAY</div>
            <div className="text-xs text-amber-600 tracking-wider hidden sm:block">
              THE TRANSFER TOWER
            </div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-2 text-sm tracking-wider transition ${
                isActive('/')
                  ? 'bg-amber-600 text-black font-bold'
                  : 'border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-black'
              }`}
              aria-current={isActive('/') ? 'page' : undefined}
            >
              HOME
            </button>
            <button
              onClick={() => navigate('/control-room')}
              className={`px-3 py-2 text-sm tracking-wider transition ${
                isActive('/control-room')
                  ? 'bg-amber-600 text-black font-bold'
                  : 'border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-black'
              }`}
              aria-current={isActive('/control-room') ? 'page' : undefined}
            >
              CONTROL ROOM
            </button>

            {/* Switchboard Access Button */}
            <button
              onClick={() => navigate('/control-room?mode=manual')}
              className="px-3 py-2 text-sm tracking-wider transition border-2 border-amber-400 bg-amber-950 text-amber-400 hover:bg-amber-600 hover:text-black"
              aria-label="Go to switchboard"
            >
              SWITCHBOARD
            </button>

            {/* Settings Menu (Gear Icon) */}
            <div className="relative settings-menu-container">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="px-3 py-2 text-sm tracking-wider transition border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-black"
                aria-label="Open settings menu"
                aria-expanded={showSettingsMenu}
              >
                ⚙
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showSettingsMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-black border-2 border-amber-600 shadow-lg z-50"
                  >
                    <div className="py-1">
                      {/* Saved Routes */}
                      <button
                        onClick={() => {
                          navigate('/analytics');
                          setShowSettingsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-amber-100 hover:bg-amber-600 hover:text-black transition tracking-wider"
                      >
                        SAVED ROUTES
                      </button>

                      {/* Divider */}
                      <div className="border-t border-amber-700 my-1" />

                      {/* Auth Section */}
                      {user ? (
                        <>
                          <div className="px-4 py-2 text-xs text-amber-600 truncate">
                            {user.email}
                          </div>
                          <button
                            onClick={() => {
                              signOut();
                              setShowSettingsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-amber-100 hover:bg-amber-600 hover:text-black transition tracking-wider"
                          >
                            SIGN OUT
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setShowAuthModal(true);
                            setShowSettingsMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-amber-100 hover:bg-amber-600 hover:text-black transition tracking-wider"
                        >
                          SIGN IN
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-[68px]" aria-hidden="true" />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuth={(email) => {
          signIn(email);
          setShowAuthModal(false);
        }}
      />
    </>
  );
}

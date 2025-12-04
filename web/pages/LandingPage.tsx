import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, signIn, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuth = (email: string) => {
    signIn(email);
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-metropolis-black pb-32 md:pb-40">
      {/* User account - top right corner */}
      <motion.div
        className="absolute top-4 right-4 md:top-8 md:right-8 z-20"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        {user ? (
          <div className="border border-metropolis-beige px-3 py-1.5 md:px-4 md:py-2 bg-metropolis-deep bg-opacity-80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs md:text-sm text-metropolis-cream">{user.email}</span>
              <button
                onClick={signOut}
                className="text-xs text-metropolis-beige hover:text-metropolis-cream transition-colors"
                aria-label="Sign out"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="border border-metropolis-beige px-3 py-1.5 md:px-4 md:py-2 bg-metropolis-deep bg-opacity-80 backdrop-blur-sm hover:bg-metropolis-panel transition-colors"
            aria-label="Sign in or create account"
          >
            <span className="text-xs md:text-sm tracking-wider text-metropolis-cream">SIGN IN</span>
          </button>
        )}
      </motion.div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuth={handleAuth} />

      {/* Radial light beams - Metropolis style - Reduced intensity */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-1 origin-left"
            style={{
              height: '200vh',
              background: `linear-gradient(to bottom, 
                transparent 0%,
                transparent 30%,
                rgba(232, 220, 200, ${0.01 + (i % 3) * 0.01}) 50%, 
                transparent 70%,
                transparent 100%)`,
              transform: `rotate(${i * 30}deg)`,
              transformOrigin: '0 0',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Geometric corner decorations - Art Deco style */}
      <div className="absolute top-0 left-0 w-48 h-48 border-l-8 border-t-8 border-metropolis-cream opacity-40" 
           style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 20% 20%, 20% 100%, 0 100%)' }}
           aria-hidden="true" />
      <div className="absolute top-0 right-0 w-48 h-48 border-r-8 border-t-8 border-metropolis-cream opacity-40"
           style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 80% 100%, 80% 20%, 0 20%)' }}
           aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-48 h-48 border-l-8 border-b-8 border-metropolis-cream opacity-40"
           style={{ clipPath: 'polygon(0 0, 20% 0, 20% 80%, 100% 80%, 100% 100%, 0 100%)' }}
           aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-48 h-48 border-r-8 border-b-8 border-metropolis-cream opacity-40"
           style={{ clipPath: 'polygon(0 80%, 80% 80%, 80% 0, 100% 0, 100% 100%, 0 100%)' }}
           aria-hidden="true" />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="text-center z-10 px-8 mb-8"
      >
        {/* Logo - Vintage Switchboard Badge - Smaller, no glow */}
        <motion.div
          className="relative w-32 h-32 md:w-48 md:h-48 mx-auto mb-4 md:mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <img
            src="/logo.png"
            alt="Patch Pay - Vintage Switchboard Logo"
            className="w-full h-full object-contain"
          />
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="metropolis-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-3 md:mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          style={{
            fontWeight: 900,
            transform: 'scaleY(1.2)',
          }}
        >
          PATCH PAY
        </motion.h1>

        <motion.h2
          className="font-heading text-2xl sm:text-3xl md:text-4xl mb-2 md:mb-3 text-metropolis-beige tracking-wider md:tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ fontWeight: 900 }}
        >
          THE TRANSFER TOWER
        </motion.h2>

        {/* Tagline */}
        <motion.p
          className="text-sm sm:text-base md:text-lg text-metropolis-beige tracking-wide mb-6 md:mb-8 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Your switchboard for modern money movement.
        </motion.p>

        {/* Geometric divider - Smaller */}
        <motion.div
          className="flex justify-center items-center gap-2 md:gap-3 my-4 md:my-6"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <div className="w-6 md:w-12 h-1 bg-metropolis-cream" />
          <div className="w-2 h-2 md:w-3 md:h-3 border-2 border-metropolis-cream rotate-45" />
          <div className="w-12 md:w-24 h-1 bg-metropolis-cream" />
          <div className="w-2 h-2 md:w-3 md:h-3 border-2 border-metropolis-cream rotate-45" />
          <div className="w-6 md:w-12 h-1 bg-metropolis-cream" />
        </motion.div>

        {/* Enter button */}
        <motion.button
          className="industrial-button text-xl md:text-2xl"
          onClick={() => navigate('/control-room')}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Enter Control Room to navigate the financial routing system"
        >
          ENTER CONTROL ROOM
        </motion.button>


      </motion.div>
    </div>
  );
}

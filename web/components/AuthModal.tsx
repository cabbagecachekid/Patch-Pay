import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (email: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onAuth(email.trim());
      setEmail('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-80"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative industrial-panel p-8 max-w-md w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-metropolis-beige hover:text-metropolis-cream text-2xl"
            aria-label="Close"
          >
            ✕
          </button>

          <h2 className="font-heading text-2xl text-metropolis-cream mb-2 tracking-wider text-center">
            {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </h2>
          <p className="text-sm text-metropolis-beige mb-6 text-center">
            Save your accounts and routes across devices
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-metropolis-beige mb-2 tracking-wider">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-black border-2 border-metropolis-cream px-4 py-3 text-metropolis-cream font-mono focus:outline-none focus:border-metropolis-white"
                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              />
            </div>

            <button
              type="submit"
              className="industrial-button w-full"
            >
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-metropolis-beige hover:text-metropolis-cream transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-metropolis-beige italic">
            Note: Demo version - data stored locally in your browser
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

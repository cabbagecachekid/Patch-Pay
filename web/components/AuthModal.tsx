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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-90"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-black border-4 border-amber-600 p-8 max-w-md w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-amber-600 hover:text-amber-400 text-2xl"
            aria-label="Close"
          >
            ✕
          </button>

          <h2 className="text-2xl text-amber-500 mb-2 tracking-wider text-center font-bold">
            {isSignUp ? 'CREATE_ACCOUNT' : 'SIGN_IN'}
          </h2>
          <p className="text-sm text-amber-700 mb-6 text-center">
            Save your accounts and routes
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-amber-700 mb-2 tracking-wider">
                EMAIL_ADDRESS
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-zinc-900 border-2 border-amber-600 px-4 py-3 text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 text-black font-bold py-3 hover:bg-amber-500 transition tracking-wider"
            >
              {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-amber-600 hover:text-amber-400 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-amber-700">
            &gt; Demo version - data stored locally
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

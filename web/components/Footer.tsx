import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer
      className="fixed bottom-0 left-0 right-0 border-t-2 border-metropolis-border bg-metropolis-panel py-2 md:py-3 px-4 md:px-8 z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      role="contentinfo"
    >
      <div className="flex justify-between items-center text-xs md:text-sm text-metropolis-beige tracking-wider">
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            aria-hidden="true"
          />
          <span>SYSTEM OPERATIONAL</span>
        </div>
        <div className="hidden md:block">PATCH PAY</div>
        <div className="md:hidden">PATCH PAY</div>
        <div aria-live="off" className="text-xs">{new Date().toLocaleTimeString()}</div>
      </div>
    </motion.footer>
  );
}

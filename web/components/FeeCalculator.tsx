import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTransferData } from '../hooks/useTransferData';

export default function FeeCalculator() {
  const { accounts, transferMatrix } = useTransferData();
  const [amount, setAmount] = useState('100');
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);
  const [transferSpeed, setTransferSpeed] = useState<string>('');

  const calculateFee = () => {
    if (!fromAccount || !toAccount || !amount) return;

    // Find the transfer rule
    const rule = transferMatrix.find(
      r => r.fromAccountId === fromAccount && r.toAccountId === toAccount
    );

    if (rule) {
      const amt = parseFloat(amount);
      let fee = rule.fee || 0;
      
      // Check if this is a percentage-based fee
      // Note: The transferMatrix might not have percentage info, 
      // so we're using the flat fee from the rule
      // In a real app, you'd want to check the bank database for fee_percent
      
      // For demonstration, let's handle known percentage cases:
      // Cash App instant: 1.5% (min $0.25)
      // Venmo instant: 1.75% (min $0.25, max $25)
      // PayPal instant: 1.5% (max $15)
      
      const fromAcc = accounts.find(a => a.id === fromAccount);
      const toAcc = accounts.find(a => a.id === toAccount);
      
      if (fromAcc && rule.speed === 'instant') {
        if (fromAcc.name.includes('Cash App')) {
          fee = Math.max(amt * 0.015, 0.25);
        } else if (fromAcc.name.includes('Venmo')) {
          fee = Math.min(Math.max(amt * 0.0175, 0.25), 25);
        } else if (fromAcc.name.includes('PayPal')) {
          fee = Math.min(amt * 0.015, 15);
        }
      }
      
      setCalculatedFee(fee);
      setTransferSpeed(rule.speed);
    } else {
      setCalculatedFee(null);
      setTransferSpeed('');
    }
  };

  const getSpeedLabel = (speed: string) => {
    switch (speed) {
      case 'instant': return 'INSTANT';
      case 'same_day': return 'SAME DAY';
      case '1_day': return '1 BUSINESS DAY';
      case '3_day': return '3 BUSINESS DAYS';
      default: return speed.toUpperCase();
    }
  };

  return (
    <div className="industrial-panel p-6">
      <div className="mb-6">
        <h2 className="font-heading text-3xl brass-accent mb-2">FEE CALCULATOR</h2>
        <p className="text-sm text-metropolis-beige tracking-wider">
          MANUAL COMPUTATION DEVICE <span aria-hidden="true">•</span> EST. 1927
        </p>
      </div>

      {/* Calculator Interface - Old School Style */}
      <div className="bg-gradient-to-b from-[#2a2520] to-[#1a1510] border-4 border-[#8b7355] rounded p-6 shadow-2xl"
        style={{
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.5)'
        }}
      >
        {/* Brass plate header */}
        <div className="bg-gradient-to-b from-[#b8860b] to-[#8b6914] border-2 border-[#6b5410] p-3 mb-6 text-center"
          style={{
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.4)'
          }}
        >
          <div className="text-black font-bold tracking-widest text-sm" style={{
            textShadow: '0 1px 0 rgba(255,255,255,0.3)'
          }}>
            TRANSFER FEE COMPUTATION
          </div>
        </div>

        {/* Amount Input - Mechanical Style */}
        <div className="mb-4">
          <label className="block text-xs text-[#d4c9b3] mb-2 tracking-widest font-mono">
            AMOUNT ($)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black border-2 border-[#6b5410] px-4 py-3 text-[#e8dcc8] font-mono text-lg focus:outline-none focus:border-[#b8860b]"
              style={{
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
                fontFamily: 'Courier New, monospace'
              }}
              min="0"
              step="0.01"
            />
            {/* Decorative screws */}
            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-[#4a4a4a] border border-black" 
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }} />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#4a4a4a] border border-black"
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }} />
          </div>
        </div>

        {/* From Account Selector */}
        <div className="mb-4">
          <label className="block text-xs text-[#d4c9b3] mb-2 tracking-widest font-mono">
            FROM ACCOUNT
          </label>
          <select
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            className="w-full bg-black border-2 border-[#6b5410] px-4 py-3 text-[#e8dcc8] font-mono focus:outline-none focus:border-[#b8860b]"
            style={{
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
              fontFamily: 'Courier New, monospace'
            }}
          >
            <option value="">SELECT SOURCE</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* To Account Selector */}
        <div className="mb-6">
          <label className="block text-xs text-[#d4c9b3] mb-2 tracking-widest font-mono">
            TO ACCOUNT
          </label>
          <select
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            className="w-full bg-black border-2 border-[#6b5410] px-4 py-3 text-[#e8dcc8] font-mono focus:outline-none focus:border-[#b8860b]"
            style={{
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
              fontFamily: 'Courier New, monospace'
            }}
          >
            <option value="">SELECT DESTINATION</option>
            {accounts
              .filter(acc => acc.id !== fromAccount)
              .map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
          </select>
        </div>

        {/* Calculate Button - Mechanical Lever Style */}
        <motion.button
          onClick={calculateFee}
          disabled={!fromAccount || !toAccount || !amount}
          className="w-full bg-gradient-to-b from-[#8b6914] to-[#6b5410] border-2 border-[#4a3810] py-4 text-black font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: '0 4px 0 #3a2810, 0 6px 8px rgba(0,0,0,0.6)',
            textShadow: '0 1px 0 rgba(255,255,255,0.3)'
          }}
          whileHover={fromAccount && toAccount && amount ? { y: 2, boxShadow: '0 2px 0 #3a2810, 0 4px 6px rgba(0,0,0,0.6)' } : {}}
          whileTap={fromAccount && toAccount && amount ? { y: 4, boxShadow: '0 0px 0 #3a2810, 0 2px 4px rgba(0,0,0,0.6)' } : {}}
        >
          COMPUTE FEE
        </motion.button>

        {/* Results Display - Mechanical Counter Style */}
        {calculatedFee !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-black border-4 border-[#6b5410] p-6"
            style={{
              boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.9)'
            }}
          >
            {/* Brass label plate */}
            <div className="bg-gradient-to-b from-[#b8860b] to-[#8b6914] border border-[#6b5410] px-3 py-1 mb-4 inline-block"
              style={{
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)'
              }}
            >
              <div className="text-black text-xs font-bold tracking-widest" style={{
                textShadow: '0 1px 0 rgba(255,255,255,0.3)'
              }}>
                COMPUTATION RESULT
              </div>
            </div>

            {/* Fee Display - Mechanical Counter */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-[#d4c9b3] text-sm tracking-widest">TRANSFER FEE:</div>
              <div className="bg-[#1a1a1a] border-2 border-[#4a4a4a] px-6 py-3"
                style={{
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.9)'
                }}
              >
                <div className="text-[#ff8800] text-3xl font-bold font-mono tracking-wider"
                  style={{
                    textShadow: '0 0 10px rgba(255, 136, 0, 0.5)',
                    fontFamily: 'Courier New, monospace'
                  }}
                >
                  ${calculatedFee.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Speed Display */}
            {transferSpeed && (
              <div className="flex items-center justify-center gap-4">
                <div className="text-[#d4c9b3] text-sm tracking-widest">TRANSFER SPEED:</div>
                <div className="bg-[#1a1a1a] border border-[#4a4a4a] px-4 py-2"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9)'
                  }}
                >
                  <div className="text-[#e8dcc8] text-sm font-mono tracking-wider">
                    {getSpeedLabel(transferSpeed)}
                  </div>
                </div>
              </div>
            )}

            {/* Decorative rivets on result panel */}
            <div className="flex justify-between mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#4a4a4a] border border-black"
                  style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)' }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* No Route Available Message */}
        {calculatedFee === null && fromAccount && toAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 bg-[#3a1a1a] border-2 border-[#8b4513] p-4 text-center"
          >
            <div className="text-[#ff6b6b] text-sm tracking-wider">
              NO DIRECT ROUTE AVAILABLE
            </div>
            <div className="text-[#d4c9b3] text-xs mt-2">
              Try the automatic routing system
            </div>
          </motion.div>
        )}
      </div>

      {/* Instruction Plate */}
      <div className="mt-4 bg-[#2a2520] border border-[#6b5410] p-3">
        <div className="text-xs text-[#d4c9b3] font-mono leading-relaxed">
          <div className="mb-1">OPERATING INSTRUCTIONS:</div>
          <div className="ml-4">
            1. ENTER TRANSFER AMOUNT<br />
            2. SELECT SOURCE ACCOUNT<br />
            3. SELECT DESTINATION ACCOUNT<br />
            4. ENGAGE COMPUTATION LEVER
          </div>
          <div className="mt-3 text-[10px] text-[#b8860b]">
            NOTE: Some services (Cash App, Venmo, PayPal) charge<br />
            percentage-based fees. Amount affects final fee calculation.
          </div>
        </div>
      </div>
    </div>
  );
}

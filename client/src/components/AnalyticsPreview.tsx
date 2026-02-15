import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const monthData = [
  320, 350, 340, 360, 355, 370, 365, 380, 375, 390, 
  385, 400, 395, 410, 405, 420, 415, 400, 390, 410,
  420, 410, 390, 380, 370, 390, 400, 410, 420, 415, 410
];

const slides = [
  { 
    total: 66, 
    label: 'Unfollowers',
    color: '#1DB954',
  },
  { 
    total: 42, 
    label: 'New Followers',
    color: '#a855f7',
  },
  { 
    total: 32, 
    label: 'Blocked',
    color: '#EF4444',
  }
];

export function AnalyticsPreview() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook'>('instagram');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = slides[currentSlide];
  const maxValue = Math.max(...monthData);

  return (
    <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">
      {/* Partie gauche - Cercle avec total */}
      <motion.div 
        key={currentSlide}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-[300px] h-[380px] rounded-[40px] flex flex-col items-center justify-center shadow-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${current.color}15, ${current.color}25)`,
          border: `2px solid ${current.color}30`,
        }}
      >
        {/* Cercle de progression */}
        <div className="relative mb-6">
          <svg width="200" height="200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke={`${current.color}15`}
              strokeWidth="12"
            />
            <motion.circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke={current.color}
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ strokeDasharray: "534", strokeDashoffset: "534" }}
              animate={{ strokeDashoffset: 534 - (current.total / 100) * 534 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                filter: `drop-shadow(0 0 8px ${current.color})`
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-white/40 text-[10px] font-bold tracking-widest mb-1">TOTAL</div>
            <div 
              className="text-6xl font-black leading-none mb-1"
              style={{ 
                color: current.color,
                textShadow: `0 0 20px ${current.color}40`
              }}
            >
              {current.total}
            </div>
            <div className="text-white/90 text-sm font-bold tracking-tight">
              {current.label}
            </div>
          </div>
        </div>

        <button 
          className="px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-all hover:scale-105"
          style={{
            background: `${current.color}20`,
            border: `1px solid ${current.color}50`,
            boxShadow: `0 0 15px ${current.color}20`
          }}
        >
          📋 Accounts list
        </button>
      </motion.div>

      {/* Partie droite - Graphique */}
      <div 
        className="flex-1 w-full lg:w-auto rounded-[40px] p-6 shadow-2xl relative overflow-hidden bg-[#0f0f0f] border border-white/5"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPlatform('instagram')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPlatform === 'instagram'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Instagram
            </button>
            <button
              onClick={() => setSelectedPlatform('facebook')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPlatform === 'facebook'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Facebook
            </button>
          </div>
          
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <div className="px-3 py-1 bg-white/10 rounded-md text-[10px] font-black text-white">MONTH</div>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-6">
          <div className="text-white/30 text-[10px] font-black tracking-widest uppercase">Analytics</div>
          <div className="text-white/10 text-[10px] font-bold">FEBRUARY 2024</div>
        </div>

        <div className="relative h-[200px] flex items-end gap-[2px]">
          {monthData.map((value, index) => {
            const height = (value / maxValue) * 100;
            const isInstagram = selectedPlatform === 'instagram';
            
            return (
              <motion.div
                key={index}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${height}%`, opacity: 0.8 }}
                transition={{ delay: index * 0.01, duration: 0.5 }}
                className="flex-1 rounded-t-[2px] relative group"
                style={{
                  background: isInstagram
                    ? 'linear-gradient(180deg, #E1306C 0%, #FCAF45 100%)'
                    : 'linear-gradient(180deg, #1877F2 0%, #0A66C2 100%)',
                  boxShadow: isInstagram
                    ? '0 0 10px rgba(225, 48, 108, 0.2)'
                    : '0 0 10px rgba(24, 119, 242, 0.2)'
                }}
              />
            );
          })}
        </div>

        <div className="mt-4 flex justify-between text-white/10 text-[8px] font-bold px-1">
          <span>DAY 1</span>
          <span>DAY 15</span>
          <span>DAY 31</span>
        </div>
      </div>
    </div>
  );
}

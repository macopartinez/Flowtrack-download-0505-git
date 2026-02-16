import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bell, Lock } from 'lucide-react';

const monthData = [
  220, 250, 240, 260, 255, 280, 310, 295, 300, 280,
  260, 290, 310, 300, 285, 290, 275, 260, 240, 270,
  290, 280, 260, 250, 240, 260, 280, 290, 300, 295, 290
];

const slides = [
  { 
    total: 66, 
    label: 'Unfollowers',
    color: '#EF4444',
    arcColor: '#EF4444',
  },
  { 
    total: 42, 
    label: 'New Followers',
    color: '#1DB954',
    arcColor: '#1DB954',
  },
  { 
    total: 32, 
    label: 'Blocked',
    color: '#6B7280',
    arcColor: '#6B7280',
  }
];

function CircularGauge({ total, label, color, arcColor }: { total: number; label: string; color: string; arcColor: string }) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (total / 100) * circumference * 0.75;
  const startAngle = 135;

  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
      <svg width="300" height="300" className="absolute inset-0">
        <defs>
          <linearGradient id="gaugeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={arcColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={arcColor} stopOpacity="0.3" />
          </linearGradient>
          <filter id="arcGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="150"
          cy="150"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="14"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={-circumference * 0.125}
          strokeLinecap="round"
          transform={`rotate(${startAngle} 150 150)`}
        />
        <motion.circle
          cx="150"
          cy="150"
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={-circumference * 0.125}
          transform={`rotate(${startAngle} 150 150)`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${arcLength} ${circumference - arcLength}` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          filter="url(#arcGlow)"
        />
      </svg>

      <div className="absolute inset-0 rounded-full border border-white/5" style={{ margin: '20px' }} />

      <div className="flex flex-col items-center justify-center z-10">
        <div className="text-white/40 text-[11px] font-black tracking-[0.3em] mb-1">TOTAL</div>
        <motion.div
          key={total}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-7xl font-black leading-none mb-1"
          style={{ color, textShadow: `0 0 30px ${color}40` }}
        >
          {total}
        </motion.div>
        <div className="text-white text-lg font-bold tracking-tight">{label}</div>
      </div>
    </div>
  );
}

function ProfileSilhouettes() {
  return (
    <>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-2 left-[50%] -translate-x-1/2"
      >
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
          <Users className="w-4 h-4 text-white/40" />
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-[15%] -left-4"
      >
        <div className="w-7 h-7 rounded-full bg-white/8 border border-white/15 flex items-center justify-center">
          <Bell className="w-3.5 h-3.5 text-white/30" />
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[40%] -left-6"
      >
        <div className="w-6 h-6 rounded-full bg-white/8 border border-white/15 flex items-center justify-center">
          <Lock className="w-3 h-3 text-white/30" />
        </div>
      </motion.div>
    </>
  );
}

export function AnalyticsPreview() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'facebook'>('instagram');
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = slides[currentSlide];
  const maxValue = Math.max(...monthData);

  return (
    <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-4 items-center lg:items-stretch">
      {/* Partie gauche - Jauge circulaire */}
      <div className="relative flex flex-col items-center justify-center shrink-0">
        <div className="relative">
          <ProfileSilhouettes />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CircularGauge
                total={current.total}
                label={current.label}
                color={current.color}
                arcColor={current.arcColor}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-4 flex items-center gap-3 px-6 py-2.5 rounded-xl text-white/80 text-sm font-bold border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <Users className="w-4 h-4" />
          Accounts list
        </motion.button>

        <div className="flex gap-2 mt-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: idx === currentSlide ? current.color : 'rgba(255,255,255,0.15)',
                boxShadow: idx === currentSlide ? `0 0 8px ${current.color}60` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Partie droite - Graphique */}
      <div className="flex-1 w-full lg:w-auto flex flex-col min-w-0">
        {/* Instagram / Facebook tabs */}
        <div className="flex gap-6 justify-center mb-3">
          <button
            onClick={() => setSelectedPlatform('instagram')}
            className={`text-sm font-bold pb-1 transition-all ${
              selectedPlatform === 'instagram'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 border-b-2 border-pink-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Instagram
          </button>
          <button
            onClick={() => setSelectedPlatform('facebook')}
            className={`text-sm font-bold pb-1 transition-all ${
              selectedPlatform === 'facebook'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Facebook
          </button>
        </div>

        {/* Chart container */}
        <div
          className="flex-1 rounded-[24px] p-5 relative overflow-hidden"
          style={{
            background: selectedPlatform === 'instagram'
              ? 'linear-gradient(135deg, rgba(88,56,163,0.6) 0%, rgba(186,120,82,0.5) 50%, rgba(196,158,90,0.4) 100%)'
              : 'linear-gradient(135deg, rgba(24,119,242,0.5) 0%, rgba(66,103,178,0.4) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* MONTH / YEAR toggle */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setViewMode('month')}
              className={`text-xs font-black tracking-wider pb-1 transition-all ${
                viewMode === 'month'
                  ? 'text-white border-b border-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              MONTH
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`text-xs font-black tracking-wider pb-1 transition-all ${
                viewMode === 'year'
                  ? 'text-white border-b border-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              YEAR
            </button>
          </div>

          {/* Chart area */}
          <div className="flex gap-3">
            {/* Y axis labels */}
            <div className="flex flex-col justify-between text-[9px] text-white/40 font-bold py-1 shrink-0">
              <span>FOLLOWERS</span>
              <span>300</span>
              <span>200</span>
              <span>100</span>
              <span></span>
            </div>

            {/* Bars area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* FEBRUARY label */}
              <div className="flex justify-end mb-2">
                <span className="text-[10px] text-white/50 font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded">FEBRUARY</span>
              </div>

              <div className="relative h-[200px] flex items-end gap-[2px]">
                {monthData.map((value, index) => {
                  const height = (value / maxValue) * 100;
                  return (
                    <motion.div
                      key={`bar-${index}-${selectedPlatform}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${height}%`, opacity: 1 }}
                      transition={{
                        delay: index * 0.015,
                        duration: 0.6,
                        ease: [0.34, 1.56, 0.64, 1]
                      }}
                      className="flex-1 rounded-t-[2px] relative group"
                      style={{
                        background: 'rgba(255,255,255,0.85)',
                        minWidth: '3px',
                      }}
                    >
                      {/* Red dot on some bars (unfollower indicators) */}
                      {[5, 10, 13, 14, 17, 22].includes(index) && (
                        <div
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                          style={{ backgroundColor: '#EF4444', boxShadow: '0 0 4px rgba(239,68,68,0.6)' }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* X axis - Day labels */}
              <div className="flex justify-between mt-2 text-[7px] text-white/35 font-bold">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <span key={day} className="flex-1 text-center" style={{ fontSize: '7px' }}>
                    {day}
                  </span>
                ))}
                <span className="ml-1 text-white/50 text-[8px]">DAY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

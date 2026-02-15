import { useState, useEffect } from 'react';
import { Instagram, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SocialAnalyticsDashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState('month');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [animatedData, setAnimatedData] = useState<number[]>([]);

  // Données pour Instagram
  const instagramMonthData = Array(31).fill(0).map(() => Math.random() * 100 + 200);
  const instagramYearData = Array(12).fill(0).map(() => Math.random() * 2000 + 1000);
  
  // Données pour Facebook
  const facebookMonthData = Array(31).fill(0).map(() => Math.random() * 80 + 150);
  const facebookYearData = Array(12).fill(0).map(() => Math.random() * 1500 + 800);

  // Données pour unfollowers (pertes)
  const unfollowersMonthData = Array(31).fill(0).map(() => Math.random() * 50 + 20);
  const unfollowersYearData = Array(12).fill(0).map(() => Math.random() * 500 + 200);

  // Données pour blocages/suppressions
  const blockedMonthData = Array(31).fill(0).map(() => Math.random() * 20 + 5);
  const blockedYearData = Array(12).fill(0).map(() => Math.random() * 200 + 50);

  const slides = [
    {
      title: 'TOTAL',
      subtitle: 'Followers',
      value: 66,
      color: selectedPlatform === 'instagram' 
        ? 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)'
        : 'linear-gradient(135deg, #1877F2 0%, #0A66C2 100%)',
      data: selectedPlatform === 'instagram'
        ? (viewMode === 'month' ? instagramMonthData : instagramYearData)
        : (viewMode === 'month' ? facebookMonthData : facebookYearData),
      type: 'gain',
      icon: '+'
    },
    {
      title: 'TOTAL',
      subtitle: 'Unfollowers',
      value: 66,
      color: 'linear-gradient(135deg, #FF6B6B 0%, #C92A2A 100%)',
      data: viewMode === 'month' ? unfollowersMonthData : unfollowersYearData,
      type: 'loss',
      icon: '-'
    },
    {
      title: 'TOTAL',
      subtitle: 'Blocked/Deleted',
      value: 32,
      color: 'linear-gradient(135deg, #495057 0%, #212529 100%)',
      data: viewMode === 'month' ? blockedMonthData : blockedYearData,
      type: 'blocked',
      icon: '×'
    }
  ];

  // Animation du slide automatique
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Animation des barres du graphique
  useEffect(() => {
    setAnimatedData([]);
    const timeout = setTimeout(() => {
      setAnimatedData(slides[currentSlide].data);
    }, 300);
    return () => clearTimeout(timeout);
  }, [currentSlide, viewMode, selectedPlatform]);

  const currentSlideData = slides[currentSlide];

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* En-tête avec sélection de plateforme */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedPlatform('instagram')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              selectedPlatform === 'instagram'
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Instagram className="w-5 h-5" />
            Instagram
          </button>
          <button
            onClick={() => setSelectedPlatform('facebook')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              selectedPlatform === 'facebook'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Facebook className="w-5 h-5" />
            Facebook
          </button>
        </div>

        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-md">
          <button
            onClick={() => setViewMode('month')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            MONTH
          </button>
          <button
            onClick={() => setViewMode('year')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'year'
                ? 'bg-white text-gray-900 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            YEAR
          </button>
        </div>
      </div>

      {/* Container principal avec slide courbé */}
      <div className="relative group">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentSlide}-${selectedPlatform}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
            style={{
              background: currentSlideData.color,
            }}
          >
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

            <div className="flex flex-col md:flex-row">
              {/* Partie gauche - Compteur circulaire */}
              <div className="w-full md:w-1/3 p-8 md:p-12 flex flex-col items-center justify-center relative">
                <div className="relative">
                  <svg className="w-48 h-48 md:w-64 md:h-64 transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="12"
                    />
                    <motion.circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      fill="none"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: currentSlideData.value / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      style={{
                        filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'
                      }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-white/80 text-sm md:text-lg font-semibold mb-1">
                      {currentSlideData.title}
                    </div>
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-6xl md:text-8xl font-black text-white mb-1"
                    >
                      {currentSlideData.value}
                    </motion.div>
                    <div className="text-white/90 text-base md:text-xl font-medium">
                      {currentSlideData.subtitle}
                    </div>
                  </div>
                </div>

                <button className="mt-8 bg-black/30 hover:bg-black/50 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 backdrop-blur-sm border border-white/10">
                  <span>📋</span>
                  Accounts list
                </button>
              </div>

              {/* Partie droite - Graphique */}
              <div className="flex-1 bg-black/20 backdrop-blur-md p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-white/70 text-sm font-semibold mb-1">
                      {currentSlide === 0 ? 'FOLLOWERS' : currentSlide === 1 ? 'UNFOLLOWERS' : 'BLOCKED/DELETED'}
                    </div>
                    <div className="text-white text-xs opacity-60">
                      {viewMode === 'month' ? 'FEBRUARY' : '2026'}
                    </div>
                  </div>
                  
                  {selectedPlatform === 'instagram' ? (
                    <Instagram className="w-8 h-8 text-white/80" />
                  ) : (
                    <Facebook className="w-8 h-8 text-white/80" />
                  )}
                </div>

                <div className="relative h-48 md:h-64 flex items-end justify-between gap-[2px] md:gap-1">
                  {/* Lignes de grille */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-full h-px bg-white/5" />
                    ))}
                  </div>

                  {animatedData.map((value, i) => {
                    const maxValue = Math.max(...currentSlideData.data);
                    const height = (value / maxValue) * 100;
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: i * 0.02 }}
                        className="flex-1 rounded-t-sm relative group/bar cursor-pointer"
                        style={{
                          background: currentSlide === 0 
                            ? 'rgba(255,255,255,0.8)'
                            : currentSlide === 1
                            ? 'rgba(255,100,100,0.8)'
                            : 'rgba(150,150,150,0.8)',
                        }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {Math.round(value)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

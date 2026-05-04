import { motion } from "framer-motion";
import { Loader2, Brain, Sparkles } from "lucide-react";

interface AnalyzingOverlayProps {
  username: string;
}

export function AnalyzingOverlay({ username }: AnalyzingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
    >
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-8 text-center"
        >
          {/* Animated Icon */}
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center"
          >
            <Brain className="w-10 h-10 text-purple-400" />
          </motion.div>

          {/* Title */}
          <h2 className="text-2xl font-display font-black text-white mb-2">
            Analyse en cours
          </h2>
          
          {/* Subtitle */}
          <p className="text-gray-400 mb-6">
            L'agent analyse le profil de <span className="text-purple-400 font-semibold">@{username}</span>
          </p>

          {/* Progress Indicators */}
          <div className="space-y-3 mb-6">
            <AnalysisStep 
              label="Connexion à Instagram" 
              delay={0} 
            />
            <AnalysisStep 
              label="Extraction des données" 
              delay={0.2} 
            />
            <AnalysisStep 
              label="Analyse du profil" 
              delay={0.4} 
            />
            <AnalysisStep 
              label="Calcul des métriques" 
              delay={0.6} 
            />
          </div>

          {/* Loading Spinner */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cela peut prendre quelques secondes...</span>
          </div>

          {/* Sparkles Animation */}
          <motion.div
            animate={{ 
              opacity: [0.3, 1, 0.3],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="mt-6 flex items-center justify-center gap-2 text-purple-400"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium">Mode Pro activé</span>
            <Sparkles className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AnalysisStep({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 text-sm"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay 
        }}
        className="w-2 h-2 rounded-full bg-purple-400"
      />
      <span className="text-gray-300">{label}</span>
    </motion.div>
  );
}

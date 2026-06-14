import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Info, Lightbulb, Crown, Star, Eye, Instagram, Snowflake, Thermometer, Flame } from "lucide-react";
import { useState } from "react";
import { ProspectStatus, Circle } from "./types";

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (person: NewPersonData) => void;
}

export interface NewPersonData {
  instagramUsername: string;
  displayName: string;
  followsYou: boolean;
  youFollow: boolean;
  sector?: string;
  isProspect: boolean;
  prospectStatus?: ProspectStatus;
  isInCircle: boolean;
  circle?: Circle;
}

export function AddPersonModal({ isOpen, onClose, onAdd }: AddPersonModalProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [followsYou, setFollowsYou] = useState(false);
  const [youFollow, setYouFollow] = useState(false);
  const [sector, setSector] = useState("");
  const [isProspect, setIsProspect] = useState(false);
  const [prospectStatus, setProspectStatus] = useState<ProspectStatus>('cold');
  const [isInCircle, setIsInCircle] = useState(false);
  const [circle, setCircle] = useState<Circle>('watch');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !displayName.trim()) return;
    if (!isProspect && !isInCircle) {
      alert("Coche au moins une option : Prospect ou Cercle");
      return;
    }
    
    setIsLoading(true);
    try {
      await onAdd({
        instagramUsername: username.trim(),
        displayName: displayName.trim(),
        followsYou,
        youFollow,
        sector: sector.trim() || undefined,
        isProspect,
        prospectStatus: isProspect ? prospectStatus : undefined,
        isInCircle,
        circle: isInCircle ? circle : undefined
      });
      
      // Reset form
      setUsername("");
      setDisplayName("");
      setFollowsYou(false);
      setYouFollow(false);
      setSector("");
      setIsProspect(false);
      setProspectStatus('cold');
      setIsInCircle(false);
      setCircle('watch');
      onClose();
    } catch (error) {
      console.error("Failed to add person:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-3xl max-w-lg w-full pointer-events-auto shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="border-b border-white/10 p-4 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black text-white">Ajouter une Personne</h2>
                    <p className="text-xs text-gray-400">Ajoute quelqu'un à ton réseau</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-4 space-y-4">
                {/* Instagram Username */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Instagram Username *
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full pl-12 pr-4 py-2 rounded-xl bg-black/80 backdrop-blur-sm border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nom d'affichage *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Comment tu veux identifier cette personne"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                  />
                </div>

                {/* Sector */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Secteur (optionnel)
                  </label>
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="e.g., coaching, e-commerce, tech..."
                    className="w-full px-4 py-2 rounded-xl bg-black/80 backdrop-blur-sm border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                  />
                </div>

                {/* Follow Status */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black/80 backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={followsYou}
                      onChange={(e) => setFollowsYou(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm text-white">Te suit</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black/80 backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={youFollow}
                      onChange={(e) => setYouFollow(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-white">Tu le suis</span>
                  </label>
                </div>

                {/* Help Text */}
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-black/80 backdrop-blur-sm border border-green-500/20">
                  <Lightbulb className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-200">
                    <strong>Astuce :</strong> Coche "Prospect" si tu veux convertir cette personne, 
                    "Cercle" pour préserver/observer la relation. Tu peux cocher les deux !
                  </div>
                </div>

                {/* Prospect Option */}
                <div className="border border-white/10 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isProspect}
                      onChange={(e) => setIsProspect(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500"
                    />
                    <span className="text-sm font-semibold text-white">Suivre comme PROSPECT</span>
                  </label>
                  
                  {isProspect && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium text-white mb-2">
                        Statut initial
                      </label>
                      <select
                        value={prospectStatus}
                        onChange={(e) => setProspectStatus(e.target.value as ProspectStatus)}
                        className="w-full px-4 py-2 rounded-xl bg-black/80 backdrop-blur-sm border border-white/10 text-white focus:outline-none focus:border-green-500 transition-colors text-sm [&>option]:bg-black [&>option]:text-white"
                      >
                        <option value="cold">Froid</option>
                        <option value="warm">Tiède</option>
                        <option value="hot">Chaud</option>
                      </select>
                    </motion.div>
                  )}
                </div>

                {/* Circle Option */}
                <div className="border border-white/10 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInCircle}
                      onChange={(e) => setIsInCircle(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-white">Ajouter à un CERCLE</span>
                  </label>
                  
                  {isInCircle && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-sm font-medium text-white mb-2">
                        Cercle de priorité
                      </label>
                      <select
                        value={circle}
                        onChange={(e) => setCircle(e.target.value as Circle)}
                        className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm [&>option]:bg-black [&>option]:text-white"
                      >
                        <option value="vip">VIP (Max 10)</option>
                        <option value="keep">À garder (Max 50)</option>
                        <option value="watch">À surveiller (Max 100)</option>
                      </select>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 p-4 flex gap-3 sticky bottom-0 bg-black/80 backdrop-blur-sm">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-sm hover:bg-white/10 text-white font-medium transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!username.trim() || !displayName.trim() || (!isProspect && !isInCircle) || isLoading}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ajout...
                    </span>
                  ) : (
                    "Ajouter"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Network } from "lucide-react";

interface AddFollowerChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseClient: () => void;
  onChoosePerson: () => void;
  followerUsername?: string;
}

export function AddFollowerChoiceModal({ 
  isOpen, 
  onClose, 
  onChooseClient, 
  onChoosePerson,
  followerUsername 
}: AddFollowerChoiceModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Ajouter {followerUsername ? `@${followerUsername}` : 'ce follower'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              Choisissez comment vous souhaitez ajouter cette personne :
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  onChooseClient();
                  onClose();
                }}
                className="w-full p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:border-green-500/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-white mb-1">Client</h3>
                    <p className="text-sm text-gray-400">
                      Pour un client payant ou potentiel client business
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onChoosePerson();
                  onClose();
                }}
                className="w-full p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Network className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-white mb-1">People (Prospect/Connexion)</h3>
                    <p className="text-sm text-gray-400">
                      Pour un prospect à convertir ou une connexion à entretenir
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-medium transition-colors"
            >
              Annuler
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

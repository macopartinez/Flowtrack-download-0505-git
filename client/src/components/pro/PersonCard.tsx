import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, MessageCircle, UserCheck, UserX, Clock, Eye, Target, Crown, Star, CheckCircle, Folder, MoreVertical, AlertCircle, Users } from "lucide-react";
import { useState } from "react";
import { Person, getDisplayBadges, isProspect, isInCircle } from "./types";
import { BadgeIcon } from "./BadgeIcon";

interface PersonCardProps {
  person: Person;
  onClick: () => void;
  onEdit?: (person: Person) => void;
  onDelete?: (person: Person) => void;
}

export function PersonCard({ person, onClick, onEdit, onDelete }: PersonCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const badges = getDisplayBadges(person);
  
  const formatDuration = (days: number) => {
    if (days < 7) return `${days}j`;
    if (days < 30) return `${Math.floor(days / 7)}sem`;
    if (days < 365) return `${Math.floor(days / 30)}mois`;
    return `${Math.floor(days / 365)}an`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 50) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getScoreLabel = (score: number, type: 'prospect' | 'health') => {
    if (type === 'prospect') {
      if (score >= 75) return 'Prospect chaud';
      if (score >= 50) return 'Prospect tiède';
      return 'Prospect froid';
    } else {
      if (score >= 75) return 'Connexion solide';
      if (score >= 50) return 'Attention requise';
      return 'Connexion fragile';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="relative bg-black/80 backdrop-blur-sm bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-white/20 transition-all group overflow-hidden"
    >
      <div className="relative z-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-xl font-bold text-white">{person.displayName}</h3>
            {badges.map((badge, idx) => (
              <div key={idx} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${badge.color}`}>
                <BadgeIcon iconName={badge.icon} className="w-3 h-3" />
                <span className="font-semibold">{badge.label}</span>
              </div>
            ))}
          </div>
          <a
            href={`https://instagram.com/${person.instagramUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-gray-400 hover:text-green-400 transition-colors"
          >
            @{person.instagramUsername}
          </a>
          {person.sector && (
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Folder className="w-3 h-3" />
              {person.sector}
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Scores */}
      {isProspect(person) && person.score !== undefined && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-3 ${getScoreColor(person.score)}`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{getScoreLabel(person.score, 'prospect')}</span>
          </div>
          <span className="text-2xl font-black">{person.score}/100</span>
        </div>
      )}

      {isInCircle(person) && person.healthScore !== undefined && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-3 ${getScoreColor(person.healthScore)}`}>
          <div className="flex items-center gap-2">
            {person.healthScore >= 75 ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-semibold">{getScoreLabel(person.healthScore, 'health')}</span>
          </div>
          <span className="text-2xl font-black">{person.healthScore}/100</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Follow Status */}
        <div className={`px-3 py-2 rounded-lg border ${
          person.followsYou && person.youFollow
            ? 'bg-green-500/10 border-green-500/20 text-green-300'
            : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
        }`}>
          <div className="text-xs">Statut</div>
          <div className="text-sm font-bold">
            {person.followsYou && person.youFollow ? 'Mutuel ✓' : 
             person.followsYou ? 'Te suit' :
             person.youFollow ? 'Tu suis' : 'Aucun'}
          </div>
        </div>

        {/* Duration or Conversion */}
        {person.followDuration !== undefined ? (
          <div className="px-3 py-2 rounded-lg border bg-purple-500/10 border-purple-500/20 text-purple-300">
            <div className="text-xs">Durée</div>
            <div className="text-sm font-bold">{formatDuration(person.followDuration)}</div>
          </div>
        ) : person.converted ? (
          <div className="px-3 py-2 rounded-lg border bg-green-500/10 border-green-500/20 text-green-300">
            <div className="text-xs">Statut</div>
            <div className="text-sm font-bold flex items-center gap-1">Converti <CheckCircle className="w-3 h-3 text-green-400" /></div>
          </div>
        ) : null}
      </div>

      {/* Mutual Connections */}
      {person.mutualConnections !== undefined && person.mutualConnections > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-3">
          <Users className="w-4 h-4" />
          <span className="text-sm">{person.mutualConnections} connexions en commun</span>
        </div>
      )}

      {/* Last Signal */}
      {person.signals.length > 0 && (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Dernier signal</div>
          <div className="text-sm text-white">{person.signals[person.signals.length - 1].description}</div>
        </div>
      )}

      {/* Menu Dropdown */}
      {showMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 right-6 bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10 min-w-[160px]"
        >
          <button 
            onClick={() => {
              setShowMenu(false);
              onClick();
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
          >
            Voir détails
          </button>
          <button 
            onClick={() => {
              setShowMenu(false);
              onEdit?.(person);
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
          >
            Modifier
          </button>
          <button 
            onClick={() => {
              setShowMenu(false);
              onDelete?.(person);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Supprimer
          </button>
        </div>
      )}
      </div>
    </motion.div>
  );
}

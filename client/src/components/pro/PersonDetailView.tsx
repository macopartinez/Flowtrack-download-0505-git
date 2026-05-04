import { ArrowLeft, Trash, Zap, MessageCircle, Crown, Star, Eye, Flame, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Thermometer, Snowflake, Calendar, Download } from "lucide-react";
import { useState } from "react";
import { Person, ProspectStatus, Circle, isProspect, isInCircle } from "./types";
import { RadarBackground } from "@/components/RadarBackground";
import { exportToPDF } from "../../utils/pdfExport";

interface PersonDetailViewProps {
  person: Person;
  onBack: () => void;
  onUpdate: (person: Person) => void;
  onDelete: () => void;
}

export function PersonDetailView({ person, onBack, onUpdate, onDelete }: PersonDetailViewProps) {
  const [notes, setNotes] = useState(person.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (!person) {
    return null;
  }

  const signals = person.signals || [];
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Date inconnue';
    try {
      return new Date(date).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (e) {
      return 'Date invalide';
    }
  };

  const changeProspectStatus = (newStatus: ProspectStatus) => {
    console.log('🔄 Changing prospect status:', person.prospectStatus, '→', newStatus);
    onUpdate({ ...person, prospectStatus: newStatus });
  };

  const changeCircle = (newCircle: Circle) => {
    console.log('🔄 Changing circle:', person.circle, '→', newCircle);
    // Remove old circle tags and add new one
    const newTags = person.tags.filter(t => t !== 'vip' && t !== 'keep' && t !== 'watch');
    newTags.push(newCircle as any);
    console.log('🏷️ New tags:', newTags);
    onUpdate({ ...person, circle: newCircle, tags: newTags });
  };

  const toggleConversion = () => {
    console.log('🔄 Toggling conversion:', person.converted, '→', !person.converted);
    onUpdate({ 
      ...person, 
      converted: !person.converted,
      convertedAt: !person.converted ? new Date() : undefined,
      prospectStatus: !person.converted ? 'converted' : 'warm'
    });
  };

  const saveNotes = () => {
    onUpdate({ ...person, notes, signals });
    setIsEditingNotes(false);
  };

  const getCircleConfig = (c: Circle) => {
    switch (c) {
      case 'vip':
        return { label: 'Cercle 1 — VIP', desc: 'Alertes immédiates', icon: <Crown className="w-5 h-5" />, max: 'Max 10 comptes' };
      case 'keep':
        return { label: 'Cercle 2 — À garder', desc: 'Alerte hebdomadaire', icon: <Star className="w-5 h-5" />, max: 'Max 50 comptes' };
      case 'watch':
        return { label: 'Cercle 3 — À surveiller', desc: 'Rapport mensuel', icon: <Eye className="w-5 h-5" />, max: 'Max 100 comptes' };
    }
  };

  const displayScore = person.healthScore || person.score || 0;
  const scoreLabel = isInCircle(person) ? 'Relationship Score' : 'Score';
  const scoreSubtitle = isInCircle(person) 
    ? displayScore >= 75 ? 'Connexion solide et stable' : displayScore >= 50 ? 'Attention, signal de refroidissement' : 'Connexion fragile — action recommandée'
    : displayScore >= 75 ? 'Prospect très chaud' : displayScore >= 50 ? 'Prospect tiède' : 'Prospect froid';

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white z-[9999] overflow-hidden">
      {/* Radar Background */}
      <RadarBackground />
      
      <div className="absolute inset-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Retour</span>
            </button>
            <h1 className="text-4xl font-display font-black text-white mb-1">{person.displayName}</h1>
            <a
              href={`https://instagram.com/${person.instagramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-green-400 transition-colors"
            >
              @{person.instagramUsername}
            </a>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const tags: string[] = [];
                if (isProspect(person)) tags.push(`Prospect ${person.prospectStatus || ''}`);
                if (isInCircle(person) && person.circle) tags.push(person.circle);
                
                exportToPDF({
                  title: person.displayName,
                  subtitle: `@${person.instagramUsername}`,
                  content: notes,
                  metadata: {
                    author: 'FlowTrack Pro',
                    date: new Date(),
                    tags
                  }
                });
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-colors flex items-center gap-2"
            >
              <Trash className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Score Badge */}
        <div className="flex items-center gap-3 mb-6">
          {isInCircle(person) && person.circle && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              person.circle === 'vip' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
              person.circle === 'keep' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
              'bg-gray-500/20 border-gray-500/30 text-gray-400'
            }`}>
              {getCircleConfig(person.circle).icon}
              <span className="font-semibold">{getCircleConfig(person.circle).label.split(' — ')[1]}</span>
            </div>
          )}
          {isProspect(person) && person.prospectStatus && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              person.prospectStatus === 'hot' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
              person.prospectStatus === 'warm' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
              person.prospectStatus === 'cold' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
              person.prospectStatus === 'converted' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
              'bg-gray-500/20 border-gray-500/30 text-gray-400'
            }`}>
              {person.prospectStatus === 'hot' && <Flame className="w-4 h-4" />}
              {person.prospectStatus === 'warm' && <Thermometer className="w-4 h-4" />}
              {person.prospectStatus === 'cold' && <Snowflake className="w-4 h-4" />}
              {person.prospectStatus === 'converted' && <CheckCircle className="w-4 h-4" />}
              {person.prospectStatus === 'lost' && <AlertCircle className="w-4 h-4" />}
              <span className="font-semibold">
                {person.prospectStatus === 'hot' ? 'Chaud' : 
                 person.prospectStatus === 'warm' ? 'Tiède' : 
                 person.prospectStatus === 'cold' ? 'Froid' :
                 person.prospectStatus === 'converted' ? 'Converti' : 'Perdu'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-purple-500/20 border-purple-500/30 text-purple-400">
            <span className="text-sm">Score: {displayScore}/100</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
          <Calendar className="w-3 h-3" />
          <span>Ajouté le {formatDate(person.addedAt)} • Connexion depuis {person.followDuration || 0} jours</span>
        </div>

        {/* Main Score Card */}
        <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{scoreLabel}</h2>
              <p className="text-sm text-gray-400 mb-4">{scoreSubtitle}</p>
              <p className="text-xs text-gray-500">
                Score basé sur: durée du follow mutuel, stabilité, récence, activité du profil
              </p>
            </div>
            <div className="text-6xl font-black text-white">{displayScore}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Statut de connexion</div>
            <div className="text-lg font-bold text-white">
              {person.followsYou && person.youFollow ? 'Mutuel' : 
               person.followsYou ? 'Te suit' :
               person.youFollow ? 'Tu suis' : 'Aucun'}
            </div>
            <div className="text-xs text-gray-500">
              {person.followsYou && person.youFollow ? 'Vous vous suivez' : 
               person.followsYou ? 'Te suit' :
               person.youFollow ? 'Tu le suis' : 'Pas de suivi'}
            </div>
          </div>

          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Durée de connexion</div>
            <div className="text-lg font-bold text-white">{person.followDuration || 0} jours</div>
            <div className="text-xs text-gray-500">Connexion récente</div>
          </div>

          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Connexions mutuelles</div>
            <div className="text-lg font-bold text-white">{person.mutualConnections || 0}</div>
            <div className="text-xs text-gray-500">En commun</div>
          </div>

          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Signaux détectés</div>
            <div className="text-lg font-bold text-white">{signals.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>

        {/* Timeline des signaux */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-4">Timeline des signaux</h3>
          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            {signals.length > 0 ? (
              <div className="space-y-3">
                {signals.slice().reverse().slice(0, 5).map((signal, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b border-white/10 last:border-0">
                    <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="text-sm text-white">{signal.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(signal.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun signal détecté pour le moment
              </div>
            )}
          </div>
        </div>

        {/* Change Circle (for connections) */}
        {isInCircle(person) && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Changer de cercle</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['vip', 'keep', 'watch'] as Circle[]).map((c) => {
                const config = getCircleConfig(c);
                const isActive = person.circle === c;
                return (
                  <button
                    key={c}
                    onClick={() => changeCircle(c)}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? c === 'vip' ? 'bg-yellow-500/20 border-yellow-500/30' :
                          c === 'keep' ? 'bg-blue-500/20 border-blue-500/30' :
                          'bg-gray-500/20 border-gray-500/30'
                        : 'bg-black/80 backdrop-blur-sm border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {config.icon}
                      <span className="font-semibold text-white">{config.label.split(' — ')[1]}</span>
                    </div>
                    <div className="text-xs text-gray-400">{config.desc}</div>
                    <div className="text-xs text-gray-500 mt-1">{config.max}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Change Status (for prospects) */}
        {isProspect(person) && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Changer le statut</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['cold', 'warm', 'hot', 'converted', 'lost'] as ProspectStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => changeProspectStatus(status)}
                  className={`px-4 py-2 rounded-full border transition-all ${
                    person.prospectStatus === status
                      ? status === 'hot' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                        status === 'warm' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
                        status === 'cold' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                        status === 'converted' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                        'bg-gray-500/20 border-gray-500/30 text-gray-400'
                      : 'bg-black/80 backdrop-blur-sm border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {status === 'hot' && <Flame className="w-4 h-4" />}
                    {status === 'warm' && <Thermometer className="w-4 h-4" />}
                    {status === 'cold' && <Snowflake className="w-4 h-4" />}
                    {status === 'converted' && <CheckCircle className="w-4 h-4" />}
                    {status === 'lost' && <AlertCircle className="w-4 h-4" />}
                    {status === 'hot' ? 'Chaud' : 
                     status === 'warm' ? 'Tiède' : 
                     status === 'cold' ? 'Froid' :
                     status === 'converted' ? 'Converti' : 'Perdu'}
                  </span>
                </button>
              ))}
            </div>
            {!person.converted && (
              <button
                onClick={toggleConversion}
                className="w-full px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all font-semibold"
              >
                Marquer comme converti
              </button>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Notes</h3>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                Modifier
              </button>
            )}
          </div>
          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoute tes notes ici..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
                  rows={6}
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveNotes}
                    className="flex-1 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => {
                      setNotes(person.notes || '');
                      setIsEditingNotes(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {notes || <span className="text-gray-500 italic">Aucune note pour le moment</span>}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check, Users, UserPlus, Target, TrendingUp, FileText, Download, Sparkles, Crown, Star, Eye, Flame } from "lucide-react";
import { useState } from "react";

interface ProTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

type TutorialStep = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string[];
  image?: string;
};

const tutorialSteps: TutorialStep[] = [
  {
    title: "Bienvenue dans le Mode Pro",
    description: "Gérez vos clients et votre réseau professionnel comme un expert",
    icon: Crown,
    details: [
      "Suivez vos clients Instagram avec des métriques avancées",
      "Gérez vos prospects et votre cercle de contacts",
      "Analyse automatique des profils par nos agents IA",
      "Exportez vos notes et rapports en PDF"
    ]
  },
  {
    title: "Gestion des Clients",
    description: "Suivez la croissance et les objectifs de vos clients",
    icon: Users,
    details: [
      "Ajoutez des clients avec leur nom d'utilisateur Instagram",
      "Définissez des tags personnalisés pour organiser vos clients",
      "Suivez l'évolution des followers et following avec des graphiques",
      "Créez des milestones avec deadlines et objectifs automatiques",
      "Prenez des notes enrichies avec liens, surlignage et références"
    ]
  },
  {
    title: "Gestion du Réseau (People)",
    description: "Organisez vos prospects et contacts importants",
    icon: Target,
    details: [
      "Ajoutez des personnes en tant que Prospects ou Cercle",
      "Prospects: Classez-les en Chaud/Tiède/Froid selon leur potentiel",
      "Cercle: VIP, À garder, À surveiller pour vos contacts clés",
      "Analyse automatique du profil par nos agents lors de l'ajout",
      "Suivez les signaux d'engagement et l'évolution du score"
    ]
  },
  {
    title: "Prospects - Convertir vos Leads",
    description: "Transformez vos prospects en clients",
    icon: Flame,
    details: [
      "Statut Chaud 🔥: Prospect très engagé, prêt à convertir",
      "Statut Tiède 🌡️: Prospect intéressé, à relancer",
      "Statut Froid ❄️: Prospect à réchauffer progressivement",
      "Score automatique basé sur l'engagement et la durée",
      "Convertissez en client d'un simple clic quand c'est gagné"
    ]
  },
  {
    title: "Cercle - Vos Contacts Clés",
    description: "Maintenez vos relations importantes",
    icon: Star,
    details: [
      "VIP 👑: Vos contacts les plus importants et influents",
      "À garder ⭐: Contacts précieux à entretenir régulièrement",
      "À surveiller 👁️: Contacts à observer et engager prudemment",
      "Health Score pour mesurer la qualité de la relation",
      "Détection automatique des signaux (follow/unfollow, activité)"
    ]
  },
  {
    title: "Analyse Automatique par Agents",
    description: "L'IA analyse les profils pour vous",
    icon: Sparkles,
    details: [
      "Lors de l'ajout d'une personne, nos agents analysent le profil",
      "Extraction automatique: followers, following, posts, bio",
      "Détection du statut privé/public du compte",
      "Mise à jour en temps réel avec overlay de progression",
      "Données enrichies pour un meilleur scoring"
    ]
  },
  {
    title: "Notes et Export PDF",
    description: "Documentez et partagez vos informations",
    icon: FileText,
    details: [
      "Prenez des notes détaillées pour chaque client/personne",
      "Ajoutez des liens cliquables dans vos notes",
      "Surlignez les passages importants en couleur",
      "Liez vos notes aux milestones pour un suivi précis",
      "Exportez tout en PDF professionnel d'un clic"
    ]
  },
  {
    title: "Milestones et Objectifs",
    description: "Définissez et suivez les objectifs",
    icon: TrendingUp,
    details: [
      "Créez des milestones personnalisés pour chaque client",
      "Définissez des deadlines avec compte à rebours en temps réel",
      "Objectifs automatiques: followers, vues, publications",
      "Milestones récurrents: quotidiens, hebdomadaires, mensuels",
      "Marquez comme réussi ✓ ou échoué ✗ avec historique"
    ]
  },
  {
    title: "Filtres et Recherche",
    description: "Trouvez rapidement ce que vous cherchez",
    icon: Target,
    details: [
      "Filtrez par type: Tous, Prospects, VIP, À garder, À surveiller",
      "Recherche instantanée par nom ou username",
      "Vue Clients ou Vue People selon vos besoins",
      "Organisation automatique par score et statut",
      "Interface fluide et responsive"
    ]
  }
];

export function ProTutorial({ isOpen, onClose }: ProTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleNext = () => {
    setCompletedSteps(prev => new Set(Array.from(prev).concat(currentStep)));
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  const handleFinish = () => {
    setCompletedSteps(prev => new Set(Array.from(prev).concat(currentStep)));
    localStorage.setItem('pro-tutorial-completed', 'true');
    onClose();
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

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
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100]"
          />

          {/* Tutorial Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-black via-green-950/20 to-black border border-green-500/30 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="border-b border-green-500/20 p-5 bg-black/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-black text-white">Guide du Mode Pro</h2>
                      <p className="text-sm text-gray-400">Maîtrisez toutes les fonctionnalités</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Étape {currentStep + 1} sur {tutorialSteps.length}</span>
                  <span>{Math.round(progress)}% complété</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex h-[calc(90vh-200px)]">
                {/* Step Navigation Sidebar */}
                <div className="w-56 border-r border-green-500/20 bg-black/30 p-3 overflow-y-auto">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chapitres</h3>
                  <div className="space-y-2">
                    {tutorialSteps.map((s, index) => {
                      const StepIcon = s.icon;
                      const isCompleted = completedSteps.has(index);
                      const isCurrent = index === currentStep;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleStepClick(index)}
                          className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${
                            isCurrent
                              ? 'bg-green-500/20 border border-green-500/40 text-white'
                              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isCurrent ? 'bg-green-500/30' : 'bg-white/5'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <StepIcon className="w-4 h-4" />
                            )}
                          </div>
                          <span className="text-xs font-medium line-clamp-2">{s.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Step Icon and Title */}
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-7 h-7 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-display font-black text-white mb-2">{step.title}</h3>
                          <p className="text-base text-gray-400">{step.description}</p>
                        </div>
                      </div>

                      {/* Details List */}
                      <div className="space-y-3 mb-6">
                        {step.details.map((detail, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                          >
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{detail}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Tips Box */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-semibold text-white mb-2">💡 Astuce Pro</h4>
                            <p className="text-sm text-gray-300">
                              {currentStep === 0 && "Commencez par ajouter vos premiers clients pour voir toute la puissance du Mode Pro !"}
                              {currentStep === 1 && "Utilisez les tags pour organiser vos clients par secteur, niveau d'engagement ou type de service."}
                              {currentStep === 2 && "L'analyse automatique se lance dès l'ajout - patientez quelques secondes pour voir les données."}
                              {currentStep === 3 && "Un prospect Chaud qui vous suit mutuellement a plus de chances de convertir rapidement."}
                              {currentStep === 4 && "Surveillez le Health Score : s'il baisse, c'est le moment de réengager la relation."}
                              {currentStep === 5 && "Les agents analysent le profil en temps réel - vous verrez un overlay pendant le processus."}
                              {currentStep === 6 && "Exportez vos notes en PDF pour créer des rapports professionnels à partager avec votre équipe."}
                              {currentStep === 7 && "Les milestones récurrents se créent automatiquement - parfait pour les publications régulières."}
                              {currentStep === 8 && "Combinez les filtres et la recherche pour trouver exactement qui vous cherchez en un instant."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer Navigation */}
              <div className="border-t border-green-500/20 p-5 bg-black/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Précédent
                  </button>

                  <div className="flex gap-2">
                    {tutorialSteps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleStepClick(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentStep
                            ? 'bg-green-500 w-8'
                            : completedSteps.has(index)
                            ? 'bg-emerald-500'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>

                  {currentStep === tutorialSteps.length - 1 ? (
                    <button
                      onClick={handleFinish}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                    >
                      <Check className="w-5 h-5" />
                      Terminer
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                    >
                      Suivant
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

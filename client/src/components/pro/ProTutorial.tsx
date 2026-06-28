import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check, Target, FileText, Sparkles, Crown, Star, Eye, Flame, Thermometer, Activity, Heart } from "lucide-react";
import { useState } from "react";

// Clé localStorage versionnée : on incrémente la version quand le contenu du
// tutoriel change significativement, afin qu'il se ré-affiche UNE seule fois
// pour les utilisateurs ayant déjà vu l'ancienne version, puis plus jamais.
export const PRO_TUTORIAL_STORAGE_KEY = 'pro-tutorial-completed-v2';

interface ProTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

type TutorialStep = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string[];
  tip: string;
  image?: string;
};

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Pro Mode",
    description: "Manage your professional network like an expert",
    icon: Crown,
    details: [
      "Manage your prospects and your inner circle of contacts in the People view",
      "Track every relationship with advanced metrics",
      "Automatic profile analysis powered by our AI agents",
      "Export your notes and reports to PDF"
    ],
    tip: "Start by adding your first people to unlock the full power of Pro Mode!"
  },
  {
    title: "The People Network — Overview",
    description: "The heart of relationship tracking: prospects and key contacts",
    icon: Target,
    details: [
      "Switch to the People view to see all your relationships as cards",
      "Two families: Prospects (to convert) and Circle (to nurture)",
      "Each card sums up the essentials: score, sentiment, connection status and latest signal",
      "A colored border shows the sentiment (red = hot, orange = warm, blue = cold)",
      "Click a card to open the detailed profile and all its stats"
    ],
    tip: "The People view reads at a glance: spot the red borders first — those are today's priorities."
  },
  {
    title: "Prospects — Convert Your Leads",
    description: "Turn your prospects into clients",
    icon: Flame,
    details: [
      "Hot status 🔥: highly engaged prospect, ready to convert — reach out now",
      "Warm status 🌡️: interested prospect, keep nurturing and following up regularly",
      "Cold status ❄️: prospect to warm up gradually with value",
      "The Score /100 sums up the potential: ≥75 hot, 50-74 warm, <50 cold",
      "\"Mark as converted\" in one click when a prospect becomes a client"
    ],
    tip: "A hot prospect who follows you back is more likely to convert quickly — make them a priority."
  },
  {
    title: "Circle — Your Key Contacts",
    description: "Keep your most important relationships at the right level",
    icon: Star,
    details: [
      "VIP 👑: your most important contacts — instant alerts (max 10)",
      "To keep ⭐: valuable contacts to nurture — weekly alert (max 50)",
      "To watch 👁️: contacts to keep an eye on — monthly report (max 100)",
      "The Relationship Score /100 measures how strong the relationship is",
      "Move a contact between circles anytime from their detailed profile"
    ],
    tip: "Watch the Relationship Score: if it drops below 50, that's the cooling-off signal — re-engage the relationship."
  },
  {
    title: "Understanding People Stats",
    description: "Decode every number on a person's profile",
    icon: Activity,
    details: [
      "Score / Sentiment: potential (prospect) or strength (circle) + Hot/Warm/Cold temperature",
      "Connection status: Mutual, Follows you, You follow or None — the basis of every relationship",
      "Connection length: how many days the link has existed (longer duration boosts the score)",
      "Mutual connections: friends in common, useful to gauge closeness and credibility",
      "Detected signals: total number of captured events (likes, comments, follow/unfollow)"
    ],
    tip: "A \"Mutual\" status + a long duration + mutual connections = a strong, high-value relationship."
  },
  {
    title: "Conversation Dynamics & Setting",
    description: "Measure the real quality of your DM exchanges",
    icon: Thermometer,
    details: [
      "Response time (theirs / yours): a growing delay = dropping interest",
      "Response rate & short replies: a high rate of short replies = low engagement",
      "Cadence: whether the exchange frequency is rising ↗, falling ↘ or holding steady",
      "\"Seen, no reply\" alerts you when your last message went unanswered",
      "Setting / qualification: what the prospect revealed (Goal, Situation, Pain, Budget, Timing)"
    ],
    tip: "Follow the \"Next step\" suggested by the Setting: it's the most useful action to take right now to move forward."
  },
  {
    title: "Timeline & Relationship Evolution",
    description: "Visualize the history of interactions over time",
    icon: Heart,
    details: [
      "Interaction timeline: every like ❤️ and comment 💬 on your posts",
      "The streak (continuous line) shows consistency — a \"break\" flags posts with no interaction",
      "Filter the timeline by Likes or Comments to target one type of engagement",
      "Relationship evolution: follow, unfollow, ghost and refollow, timestamped",
      "Click \"View post →\" to find the relevant post back on Instagram"
    ],
    tip: "A recent break in a VIP's streak is a warning sign: that's often where a relationship starts cooling off."
  },
  {
    title: "Automatic Analysis by Agents",
    description: "AI analyzes profiles for you",
    icon: Sparkles,
    details: [
      "When you add a person, our agents analyze the profile",
      "Automatic extraction: followers, following, posts, bio",
      "Detection of the account's private/public status",
      "Real-time updates with a progress overlay",
      "Enriched data for better scoring"
    ],
    tip: "The agents analyze the profile in real time — you'll see an overlay during the process, just wait a few seconds."
  },
  {
    title: "Notes and PDF Export",
    description: "Document and share your insights",
    icon: FileText,
    details: [
      "Take detailed notes for every person",
      "Add clickable links inside your notes",
      "Highlight key passages in color",
      "Export everything to a professional PDF in one click"
    ],
    tip: "Export a person's profile to PDF to create a pro report with their stats, timeline and your notes."
  },
  {
    title: "Filters and Search",
    description: "Find what you're looking for fast",
    icon: Eye,
    details: [
      "Filter by type: All, Prospects, VIP, To keep, To watch",
      "Filter by sentiment (Hot/Warm/Cold), combinable with the type filter",
      "Instant search by name or username",
      "Automatic organization by score and status"
    ],
    tip: "Combine the \"Prospects\" filter with the \"Hot\" sentiment to show only the leads ready to convert."
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

  // Toute fermeture (Terminer, croix, clic sur le fond) marque le tutoriel comme
  // vu : il ne se ré-affichera donc plus automatiquement à la prochaine entrée Pro.
  const markCompletedAndClose = () => {
    setCompletedSteps(prev => new Set(Array.from(prev).concat(currentStep)));
    localStorage.setItem(PRO_TUTORIAL_STORAGE_KEY, 'true');
    onClose();
  };

  const handleFinish = markCompletedAndClose;

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
            onClick={markCompletedAndClose}
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
                      <h2 className="text-xl font-display font-black text-white">Pro Mode Guide</h2>
                      <p className="text-sm text-gray-400">Master every feature</p>
                    </div>
                  </div>
                  <button
                    onClick={markCompletedAndClose}
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
                  <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex h-[calc(90vh-200px)]">
                {/* Step Navigation Sidebar */}
                <div className="w-56 border-r border-green-500/20 bg-black/30 p-3 overflow-y-auto">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chapters</h3>
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
                            <h4 className="font-semibold text-white mb-2">💡 Pro Tip</h4>
                            <p className="text-sm text-gray-300">{step.tip}</p>
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
                    Previous
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
                      Finish
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                    >
                      Next
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

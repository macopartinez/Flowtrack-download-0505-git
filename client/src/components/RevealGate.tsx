import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";

interface RevealGateProps {
  onReveal: () => void;
  onClose: () => void;
}

interface RevealAnswers {
  feeling?: string;
  recentTension?: string;
  unresolved?: string;
  firstInstinct?: string;
  commitments?: string[];
}

interface QuestionTheme {
  id: keyof RevealAnswers;
  type: 'single' | 'multiple';
  subtitle?: string;
  // Plusieurs formulations neutres par thème : on en tire une au hasard à
  // chaque ouverture pour que le questionnaire ne reste jamais identique,
  // tout en gardant les `value` (et donc le schéma des réponses) stables.
  titles: string[];
  options: { value: string; label: string }[];
}

// Pool de questions. Les libellés restent introspectifs, doux et ouverts —
// un signal, pas un verdict (voir la philosophie du tunnel de vente).
const QUESTION_POOL: QuestionTheme[] = [
  {
    id: 'feeling',
    type: 'single',
    titles: [
      'Before we show you who it is — how are you feeling right now?',
      'Take a second before we continue — what\'s present for you right now?',
      'Before the name appears — where\'s your head at this moment?',
    ],
    options: [
      { value: 'anxious', label: 'A little tense, my mind is moving fast' },
      { value: 'curious', label: 'Curious but calm' },
      { value: 'suspicion', label: 'I have a quiet sense of who it might be' },
      { value: 'mixed', label: 'A mix of things I can\'t quite name' },
    ],
  },
  {
    id: 'recentTension',
    type: 'single',
    titles: [
      'In the past few weeks, has anything felt different with the people close to you?',
      'Lately, have your connections felt the way they usually do?',
      'Looking back over the last month — has anything shifted in how people show up for you?',
    ],
    options: [
      { value: 'yes_tension', label: 'Yes — I noticed a bit of distance somewhere' },
      { value: 'little_distance', label: 'A little — nothing I could put my finger on' },
      { value: 'normal', label: 'No — things felt steady to me' },
      { value: 'not_paying', label: 'Honestly, I wasn\'t paying close attention' },
    ],
  },
  {
    id: 'unresolved',
    type: 'single',
    titles: [
      'Is there anyone in your life right now with whom you feel there\'s something unresolved?',
      'Is there a relationship right now that still feels like an open question?',
      'When you think of the people around you, does any connection feel unfinished?',
    ],
    options: [
      { value: 'yes_know', label: 'Yes, and I have a sense of who' },
      { value: 'maybe', label: 'Maybe — I haven\'t really sat with it' },
      { value: 'not_aware', label: 'Not that I\'m aware of' },
      { value: 'few_people', label: 'A few people, actually' },
    ],
  },
  {
    id: 'firstInstinct',
    type: 'single',
    titles: [
      'When you find out who it is — what\'s your first instinct likely to be?',
      'Once you see the name — what do you imagine yourself doing first?',
      'When the answer is in front of you — how do you tend to react to news like this?',
    ],
    options: [
      { value: 'reach_out', label: 'Reach out and gently ask what happened' },
      { value: 'withdraw', label: 'Step back and process it on my own' },
      { value: 'hurt', label: 'Feel it, and wonder what part was mine' },
      { value: 'angry', label: 'Feel a flash of frustration' },
      { value: 'observe', label: 'Take some distance before doing anything' },
    ],
  },
  {
    id: 'commitments',
    type: 'multiple',
    subtitle: 'You can select multiple',
    titles: [
      'Before you see the name — what do you want to commit to?',
      'Before we reveal anything — what do you want to hold onto?',
      'Before the name appears — what kind of response do you want to choose?',
    ],
    options: [
      { value: 'breathe', label: 'To take a breath before reacting' },
      { value: 'self_reflect', label: 'To ask myself first: what was my role in this?' },
      { value: 'remember_signal', label: 'To remember that a signal reflects a feeling, not a verdict' },
      { value: 'be_kind', label: 'To be kind to myself, whatever I discover' },
    ],
  },
];

// Tire une variante de titre au hasard pour chaque thème.
function buildQuestions() {
  return QUESTION_POOL.map((theme) => ({
    ...theme,
    title: theme.titles[Math.floor(Math.random() * theme.titles.length)],
  }));
}

export function RevealGate({ onReveal, onClose }: RevealGateProps) {
  // Construit le questionnaire une seule fois par montage → la sélection
  // aléatoire reste stable pendant toute la session du gate.
  const [questions] = useState(buildQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<RevealAnswers>({});
  const [showTransition, setShowTransition] = useState(false);

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const isMultiple = question.type === 'multiple';

  const currentAnswer = answers[question.id];
  const canProceed = isMultiple
    ? ((currentAnswer as string[] | undefined)?.length ?? 0) > 0
    : !!currentAnswer;

  // Fermeture au clavier (Escape) — accessibilité.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSelect = (value: string) => {
    if (isMultiple) {
      const current = (answers[question.id] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [question.id]: updated });
    } else {
      setAnswers({ ...answers, [question.id]: value });
    }
  };

  const handleNext = () => {
    if (!canProceed) return;

    if (isLastQuestion) {
      setShowTransition(true);
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion === 0) {
      onClose();
    } else {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  if (showTransition) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center"
          >
            <Heart className="w-10 h-10 text-green-400" />
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-3xl md:text-4xl font-display font-black text-white mb-6"
          >
            You've taken a moment for yourself.
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xl text-gray-400 mb-4"
          >
            That already makes you different from most people.
          </motion.p>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-lg text-gray-500 mb-12 max-w-xl mx-auto"
          >
            What you're about to see is just a signal — not a verdict. How you respond to it will say more about you than it says about them.
          </motion.p>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            autoFocus
            onClick={() => {
              // Sauvegarder les réponses dans localStorage (analytics tunnel)
              localStorage.setItem('revealGateAnswers', JSON.stringify(answers));
              // Afficher les comptes
              onReveal();
            }}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all duration-300 flex items-center gap-3 mx-auto"
          >
            View Accounts
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-y-auto"
    >
      <div className="max-w-3xl w-full mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-3 leading-tight">
              {question.title}
            </h2>
            {question.subtitle && (
              <p className="text-gray-400 mb-8">{question.subtitle}</p>
            )}

            <div
              role={isMultiple ? 'group' : 'radiogroup'}
              aria-label={question.title}
              className="space-y-3 mb-12"
            >
              {question.options.map((option) => {
                const isSelected = isMultiple
                  ? (currentAnswer as string[] | undefined)?.includes(option.value)
                  : currentAnswer === option.value;

                return (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    role={isMultiple ? 'checkbox' : 'radio'}
                    aria-checked={isSelected}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full p-6 rounded-2xl text-left transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
                        : 'bg-white/5 border-2 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                        isSelected ? 'border-green-500 bg-green-500' : 'border-white/30'
                      }`}>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-white"
                          />
                        )}
                      </div>
                      <span className="text-white font-medium text-lg">{option.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className={`flex items-center ${currentQuestion === 0 ? 'justify-end' : 'justify-between'}`}>
              {currentQuestion > 0 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 rounded-full text-gray-400 hover:text-white transition-colors font-bold"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className={`px-8 py-3 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${
                  canProceed
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLastQuestion ? 'Continue' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

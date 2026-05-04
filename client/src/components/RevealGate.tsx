import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { useLocation } from "wouter";

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

const QUESTIONS = [
  {
    id: 'feeling',
    title: 'Before we show you who it is — how are you feeling right now?',
    type: 'single',
    options: [
      { value: 'anxious', label: 'Anxious, my heart is racing a little' },
      { value: 'curious', label: 'Curious but calm' },
      { value: 'suspicion', label: 'Already have a feeling who it might be' },
      { value: 'mixed', label: 'A mix of things I can\'t quite name' }
    ]
  },
  {
    id: 'recentTension',
    title: 'In the past few weeks, has anything felt different with the people close to you?',
    type: 'single',
    options: [
      { value: 'yes_tension', label: 'Yes — there\'s been some tension I noticed' },
      { value: 'little_distance', label: 'A little — some distance but nothing specific' },
      { value: 'normal', label: 'No — everything seemed normal to me' },
      { value: 'not_paying', label: 'I wasn\'t paying attention, honestly' }
    ]
  },
  {
    id: 'unresolved',
    title: 'Is there anyone in your life right now with whom you feel there\'s something unresolved?',
    type: 'single',
    options: [
      { value: 'yes_know', label: 'Yes, and I know exactly who' },
      { value: 'maybe', label: 'Maybe, but I haven\'t faced it yet' },
      { value: 'not_aware', label: 'Not that I\'m aware of' },
      { value: 'few_people', label: 'There are a few people actually' }
    ]
  },
  {
    id: 'firstInstinct',
    title: 'When you find out who it is — what\'s your first instinct likely to be?',
    type: 'single',
    options: [
      { value: 'reach_out', label: 'Reach out immediately and ask why' },
      { value: 'withdraw', label: 'Withdraw and process alone' },
      { value: 'hurt', label: 'Feel hurt and look for what I did wrong' },
      { value: 'angry', label: 'Feel angry and want to confront them' },
      { value: 'observe', label: 'Observe from a distance before doing anything' }
    ]
  },
  {
    id: 'commitments',
    title: 'Before you see the name — what do you commit to?',
    subtitle: 'You can select multiple',
    type: 'multiple',
    options: [
      { value: 'breathe', label: 'To take a breath before reacting' },
      { value: 'self_reflect', label: 'To ask myself first: what was my role in this?' },
      { value: 'remember_signal', label: 'To remember that a virtual signal reflects a real feeling' },
      { value: 'be_kind', label: 'To be kind to myself, whatever I discover' }
    ]
  }
];

export function RevealGate({ onReveal, onClose }: RevealGateProps) {
  const [, navigate] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<RevealAnswers>({});
  const [showTransition, setShowTransition] = useState(false);

  const question = QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === QUESTIONS.length - 1;
  const isMultiple = question.type === 'multiple';

  const currentAnswer = answers[question.id as keyof RevealAnswers];
  const canProceed = isMultiple 
    ? ((currentAnswer as string[] | undefined)?.length ?? 0) > 0
    : !!currentAnswer;

  const handleSelect = (value: string) => {
    if (isMultiple) {
      const current = (answers[question.id as keyof RevealAnswers] as string[]) || [];
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
            onClick={() => {
              // Sauvegarder les réponses dans localStorage
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500">
              Question {currentQuestion + 1} of {QUESTIONS.length}
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
              animate={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
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

            <div className="space-y-3 mb-12">
              {question.options.map((option) => {
                const isSelected = isMultiple
                  ? (currentAnswer as string[] | undefined)?.includes(option.value)
                  : currentAnswer === option.value;

                return (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
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

            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-full text-gray-400 hover:text-white transition-colors font-bold"
              >
                {currentQuestion === 0 ? 'Cancel' : 'Back'}
              </button>
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

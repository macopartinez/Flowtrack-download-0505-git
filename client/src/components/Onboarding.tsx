import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, Eye, TrendingUp, Shield } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    id: 1,
    title: "Welcome to Waler!",
    description: "Discover how Waler helps you understand your Instagram relationships",
    icon: Shield,
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">
          Waler is a tool for <strong className="text-green-400">relationship clarity</strong>, not surveillance.
        </p>
        <p className="text-gray-300">
          We help you understand who disconnects from you and why,
          so you can better know yourself and grow.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: "How does it work?",
    description: "Our Chrome extension tracks your followers",
    icon: Eye,
    content: (
      <div className="space-y-4">
        <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-4">
          <h4 className="font-semibold text-green-400 mb-2">Chrome Extension</h4>
          <p className="text-sm text-gray-300">
            Waler uses a Chrome extension that reads your Instagram follower data directly from your browser session.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>• <strong className="text-green-400">Unfollow detection</strong>: Tracks who stopped following you</li>
            <li>• <strong className="text-green-400">Ghost follower detection</strong>: Identifies blocked or deleted accounts</li>
          </ul>
        </div>
        <p className="text-gray-400 text-sm">
          Your data is synced privately and securely to your personal dashboard.
        </p>
      </div>
    ),
  },
  {
    id: 4,
    title: "Your Dashboard",
    description: "Discover the main features",
    icon: TrendingUp,
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gradient-to-r from-amber-500/10 to-red-500/10 backdrop-blur-sm border border-amber-500/30 rounded-xl p-3">
            <h5 className="font-semibold text-amber-400 text-sm mb-1">📉 Unfollowers</h5>
            <p className="text-xs text-gray-300">
              People who recently unfollowed you
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-3">
            <h5 className="font-semibold text-green-400 text-sm mb-1">📈 Followers</h5>
            <p className="text-xs text-gray-300">
              New followers to your account
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500/10 to-gray-500/10 backdrop-blur-sm border border-purple-500/30 rounded-xl p-3">
            <h5 className="font-semibold text-purple-400 text-sm mb-1">👻 Ghosts & Blockers</h5>
            <p className="text-xs text-gray-300">
              Deleted accounts (auto-detected) + People you manually mark as blockers
            </p>
          </div>
        </div>

        <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-3">
          <div className="flex items-start gap-2 text-sm text-gray-300">
            <BarChart3 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p><strong className="text-green-400">Charts:</strong> Visualize the evolution of your stats over 30 days</p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const filteredSteps = steps;

  const currentStepData = filteredSteps[currentStep];
  const isLastStep = currentStep === filteredSteps.length - 1;
  const StepIcon = currentStepData.icon;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/30 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-full flex items-center justify-center">
                <StepIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{currentStepData.title}</h2>
                <p className="text-gray-400 text-sm">{currentStepData.description}</p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
            {filteredSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= currentStep ? 'bg-green-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
            >
              Skip tutorial
            </button>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2 text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                {isLastStep ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

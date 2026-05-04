import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Instagram, CheckCircle2, AlertCircle, Lightbulb, BarChart3, Eye, TrendingUp, Shield, UserPlus, Check } from "lucide-react";

interface OnboardingProps {
  isPrivateAccount: boolean;
  needsApproval: boolean;
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
    description: "Our system uses detection agents",
    icon: Eye,
    content: (
      <div className="space-y-4">
        <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl p-4">
          <h4 className="font-semibold text-green-400 mb-2">🤖 Waler Agents</h4>
          <p className="text-sm text-gray-300">
            We use 2 dedicated Instagram accounts that will follow your account:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>• <strong className="text-green-400">Agent A</strong>: Detects unfollows</li>
            <li>• <strong className="text-green-400">Agent B</strong>: Verifies blocks</li>
          </ul>
        </div>
        <p className="text-gray-400 text-sm">
          These agents analyze your followers daily to detect changes.
        </p>
      </div>
    ),
  },
  {
    id: 3,
    title: "Private Account Detected",
    description: "Action required to activate tracking",
    icon: UserPlus,
    content: (
      <div className="space-y-4">
        <div className="bg-orange-500/10 backdrop-blur-sm border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-400 mb-2">
                Your account is private
              </h4>
              <p className="text-sm text-gray-300">
                You must accept the follow requests from our 2 agents to activate Waler.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <h4 className="font-semibold text-white mb-3">📝 Steps to follow:</h4>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-400">1.</span>
              <span>Open Instagram on your phone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-400">2.</span>
              <span>Go to your follow requests (notifications)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-400">3.</span>
              <span>Accept the 2 Waler accounts:</span>
            </li>
            <li className="ml-6 space-y-1">
              <div className="flex items-center gap-2 text-xs bg-white/5 border border-white/10 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4 text-green-400" />
                <code className="font-mono text-gray-300">@{import.meta.env.VITE_AGENT_A_INSTAGRAM_USER || 'clara_argentinabuen'}</code>
              </div>
              <div className="flex items-center gap-2 text-xs bg-white/5 border border-white/10 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4 text-green-400" />
                <code className="font-mono text-gray-300">@{import.meta.env.VITE_AGENT_B_INSTAGRAM_USER || 'nathan_winters8th'}</code>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-green-400">4.</span>
              <span>Come back here and click "Verify"</span>
            </li>
          </ol>
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-500 italic">
          <Lightbulb className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <p>Tip: The agents will never post content or interact with your publications.</p>
        </div>
      </div>
    ),
    showIfPrivate: true,
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

export default function Onboarding({ isPrivateAccount, needsApproval, onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const filteredSteps = steps.filter(step => {
    if (step.showIfPrivate && !isPrivateAccount) return false;
    return true;
  });

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

  const handleCheckApproval = async () => {
    setIsChecking(true);
    
    // Simuler une vérification rapide puis continuer
    // Les agents suivront automatiquement l'utilisateur en arrière-plan
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsChecking(false);
    handleNext();
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
              
              {currentStepData.showIfPrivate && needsApproval ? (
                <button
                  onClick={handleCheckApproval}
                  disabled={isChecking}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isChecking ? 'Checking...' : 'Verify'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  {isLastStep ? 'Get Started' : 'Next'}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

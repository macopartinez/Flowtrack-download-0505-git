import { motion } from "framer-motion";
import { Sparkles, Lock, ArrowRight } from "lucide-react";
import { QuestionnaireAnswers } from "@/types/questionnaire";

interface AIInsightsSummaryProps {
  answers: QuestionnaireAnswers;
  onUnlock: () => void;
  showPricing?: boolean;
}

function generateInsights(answers: QuestionnaireAnswers) {
  // Pattern detection based on q2_pattern
  const isRecurring = answers.q2_pattern?.toString().includes("more often than");
  const isFirstTime = answers.q2_pattern?.toString().includes("completely new");
  
  // Responsibility level from q6_responsibility
  const highResponsibility = answers.q6_responsibility?.toString().includes("4") || answers.q6_responsibility?.toString().includes("5");
  const lowResponsibility = answers.q6_responsibility?.toString().includes("1") || answers.q6_responsibility?.toString().includes("2");
  
  // Emotional reaction from q8
  const emotionalReaction = answers.q8?.toString() || "";
  
  return {
    pattern: isRecurring 
      ? "Recurring disconnection pattern" 
      : isFirstTime 
      ? "First-time experience with disconnection"
      : "Emerging relationship awareness",
    
    attachmentStyle: highResponsibility
      ? "Self-reflective and accountable"
      : lowResponsibility
      ? "Externally-focused perspective"
      : "Balanced relational awareness",
    
    primaryInsight: isRecurring
      ? "You've recognized a pattern in how your close relationships end. This awareness is the first step toward breaking the cycle."
      : "This disconnection caught you off-guard, which suggests you may not have been reading the subtle signals in the relationship.",
    
    emotionalState: emotionalReaction.includes("Anger")
      ? "You're processing feelings of injustice, which is natural but may cloud your ability to see your role clearly."
      : emotionalReaction.includes("Sadness")
      ? "Your sadness shows the depth of this connection. Allow yourself to grieve while staying curious about what happened."
      : "You're experiencing complex emotions, which shows emotional maturity and readiness for growth."
  };
}

export function AIInsightsSummary({ answers, onUnlock, showPricing = true }: AIInsightsSummaryProps) {
  const insights = generateInsights(answers);
  
  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-4">
          <Sparkles className="w-4 h-4 text-green-400" />
          <span className="text-sm font-bold text-green-300">AI Analysis Complete</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-3">
          Here's what we understood about <span className="text-gradient">you</span>
        </h2>
        <p className="text-gray-400 text-lg">
          Based on your answers, our AI has identified key patterns in how you experience relationships.
        </p>
      </motion.div>

      {/* Free Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Your Pattern</h3>
              <p className="text-gray-300 leading-relaxed">{insights.pattern}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Relational Style</h3>
              <p className="text-gray-300 leading-relaxed">{insights.attachmentStyle}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Key Insight</h3>
              <p className="text-gray-300 leading-relaxed">{insights.primaryInsight}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Blurred Premium Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-10 rounded-2xl flex items-center justify-center">
          <div className="text-center px-6">
            <Lock className="w-12 h-12 text-white/80 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Unlock Your Full Analysis</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              Get your complete psychological profile, personalized recommendations, and a 30-day action plan to transform your relationships.
            </p>
            <button
              onClick={onUnlock}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300"
            >
              Unlock Full Analysis
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500 mt-3">Starting at $9.99/month</p>
          </div>
        </div>

        {/* Blurred content preview */}
        <div className="blur-sm pointer-events-none select-none space-y-4 opacity-40">
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Deep Psychological Analysis</h3>
            <p className="text-gray-300 leading-relaxed mb-3">
              Your answers reveal a complex attachment pattern rooted in early relationship experiences. 
              The way you process disconnection suggests...
            </p>
            <p className="text-gray-300 leading-relaxed">
              This manifests in your current relationships through specific behaviors that may be 
              unconsciously pushing people away while simultaneously...
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Personalized Recommendations</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Practice vulnerable communication in low-stakes situations</li>
              <li>• Develop awareness of your emotional triggers before they escalate</li>
              <li>• Create a personal "relationship check-in" ritual every two weeks</li>
              <li>• Work with a therapist on attachment-focused exercises</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">30-Day Transformation Plan</h3>
            <p className="text-gray-300 leading-relaxed">
              Week 1: Self-awareness foundation building...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

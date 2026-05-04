import { motion } from "framer-motion";
import { Sparkles, Check, Users, ArrowRight, Star, Clock } from "lucide-react";
import { QuestionnaireAnswers, UsageMode } from "@/types/questionnaire";
import { PRICING_PLANS } from "@/config/pricing";
import { useState, useMemo, useEffect } from "react";

type BillingPeriod = 'monthly' | 'yearly';

interface PaywallStepProps {
  answers: QuestionnaireAnswers;
  selectedPlan: 'premium' | 'pro' | null;
  onPlanSelect: (planId: 'premium' | 'pro') => void;
  usageMode?: UsageMode | null;
}

// Compte à rebours pour l'offre limitée (6 heures 3 minutes 3 secondes)
const COUNTDOWN_HOURS = 6;
const COUNTDOWN_MINUTES = 3;
const COUNTDOWN_SECONDS = 3;

function generateInsights(answers: QuestionnaireAnswers) {
  const isRecurring = answers.q2_pattern?.toString().includes("more often than");
  const isFirstTime = answers.q2_pattern?.toString().includes("completely new");
  
  const highResponsibility = answers.q6_responsibility?.toString().includes("4") || answers.q6_responsibility?.toString().includes("5");
  const lowResponsibility = answers.q6_responsibility?.toString().includes("1") || answers.q6_responsibility?.toString().includes("2");
  
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
  };
}

export function PaywallStep({ answers, selectedPlan, onPlanSelect, usageMode }: PaywallStepProps) {
  const insights = generateInsights(answers);
  const [hoveredPlan, setHoveredPlan] = useState<'premium' | 'pro' | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [timeLeft, setTimeLeft] = useState({
    hours: COUNTDOWN_HOURS,
    minutes: COUNTDOWN_MINUTES,
    seconds: COUNTDOWN_SECONDS,
  });

  // Compte à rebours
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  // Reorder plans based on usage mode - recommended plan first
  const orderedPlans = useMemo(() => {
    if (usageMode === 'professional') {
      // Pro first for professional users
      return PRICING_PLANS.sort((a, b) => (a.id === 'pro' ? -1 : b.id === 'pro' ? 1 : 0));
    } else {
      // Premium first for personal users
      return PRICING_PLANS.sort((a, b) => (a.id === 'premium' ? -1 : b.id === 'premium' ? 1 : 0));
    }
  }, [usageMode]);

  const recommendedPlan = usageMode === 'professional' ? 'pro' : 'premium';
  
  // Prix dynamiques selon le billing period
  const getPlanPrice = (planId: 'premium' | 'pro') => {
    if (billingPeriod === 'monthly') {
      return planId === 'premium' ? 14.99 : 29.99;
    } else {
      return planId === 'premium' ? 149.99 : 299.99;
    }
  };
  
  const getYearlySavings = (planId: 'premium' | 'pro') => {
    const monthlyPrice = planId === 'premium' ? 14.99 : 29.99;
    const yearlyPrice = planId === 'premium' ? 149.99 : 299.99;
    const monthlyForYear = monthlyPrice * 12;
    return monthlyForYear - yearlyPrice;
  };
  
  const yearlyDiscount = Math.round((1 - (299.99 / (29.99 * 12))) * 100);
  
  return (
    <div className="w-full max-w-6xl space-y-12">
      {/* Countdown Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-4 mb-6"
      >
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Clock className="w-5 h-5 text-red-400 animate-pulse" />
          <span className="text-red-100 font-bold">Offre spéciale expire dans</span>
          <div className="flex items-center gap-2">
            <div className="bg-red-500/30 border border-red-500/50 rounded-lg px-3 py-1">
              <span className="font-mono text-xl font-bold">{formatTime(timeLeft.hours)}</span>
              <span className="text-xs ml-1">h</span>
            </div>
            <span className="text-2xl font-bold">:</span>
            <div className="bg-red-500/30 border border-red-500/50 rounded-lg px-3 py-1">
              <span className="font-mono text-xl font-bold">{formatTime(timeLeft.minutes)}</span>
              <span className="text-xs ml-1">m</span>
            </div>
            <span className="text-2xl font-bold">:</span>
            <div className="bg-red-500/30 border border-red-500/50 rounded-lg px-3 py-1">
              <span className="font-mono text-xl font-bold">{formatTime(timeLeft.seconds)}</span>
              <span className="text-xs ml-1">s</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-4">
          <Sparkles className="w-4 h-4 text-green-400" />
          <span className="text-sm font-bold text-green-300">AI Analysis Complete</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-3">
          Here's what we understood about <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">you</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Based on your answers, our AI has identified key patterns. Choose a plan to unlock your full analysis.
        </p>
      </motion.div>

      {/* Free Preview Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Your Pattern</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{insights.pattern}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Relational Style</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{insights.attachmentStyle}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Key Insight</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{insights.primaryInsight}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pricing Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-2xl font-bold text-white text-center mb-6">
          Choose your plan to unlock your full analysis
        </h3>
        
        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Annuel
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                -{yearlyDiscount}%
              </span>
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {orderedPlans.map((plan) => (
            <motion.div
              key={plan.id}
              onHoverStart={() => setHoveredPlan(plan.id)}
              onHoverEnd={() => setHoveredPlan(null)}
              onClick={() => onPlanSelect(plan.id)}
              className={`relative rounded-2xl p-8 border-2 transition-all cursor-pointer ${
                selectedPlan === plan.id
                  ? 'border-[#02c950] bg-[#02c950]/10 shadow-[0_0_30px_rgba(2,201,80,0.3)]'
                  : plan.id === recommendedPlan
                  ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:border-green-400'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {plan.id === recommendedPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Recommended
                </div>
              )}

              {selectedPlan === plan.id && (
                <div className="absolute -top-4 right-4 px-4 py-1 rounded-full bg-[#02c950] text-black text-sm font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Selected
                </div>
              )}

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                plan.id === 'premium' 
                  ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' 
                  : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
              }`}>
                {plan.id === 'premium' ? (
                  <Sparkles className="w-7 h-7 text-green-400" />
                ) : (
                  <Users className="w-7 h-7 text-green-400" />
                )}
              </div>

              {/* Plan name */}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{getPlanPrice(plan.id).toFixed(2)}€</span>
                  <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'mois' : 'an'}</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-green-400 mt-1">
                    Économisez {getYearlySavings(plan.id).toFixed(2)}€ par rapport au mensuel
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-1">
                  {plan.trialDays}-day free trial • Cancel anytime
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.id === recommendedPlan ? 'bg-green-500/20' : 'bg-green-500/20'
                    }`}>
                      <Check className={`w-3 h-3 ${
                        plan.id === recommendedPlan ? 'text-green-400' : 'text-green-400'
                      }`} />
                    </div>
                    <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Indicator */}
              <div className={`w-full py-3 rounded-xl font-bold text-center transition-all ${
                selectedPlan === plan.id
                  ? 'bg-[#02c950] text-black'
                  : plan.id === recommendedPlan
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-white/10 text-white'
              }`}>
                {selectedPlan === plan.id ? 'Selected' : plan.id === recommendedPlan ? 'Recommended' : 'Select Plan'}
              </div>
            </motion.div>
          ))}
        </div>

        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-400 text-sm">
              Click "Continue" below to proceed with your {selectedPlan === 'premium' ? 'Premium' : 'Pro'} plan
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-6 text-sm text-gray-500 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>7-14 day free trial</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>Cancel anytime</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>Secure payment</span>
        </div>
      </motion.div>
    </div>
  );
}

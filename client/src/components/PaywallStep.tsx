import { motion } from "framer-motion";
import { Sparkles, Check, Users, Star } from "lucide-react";
import { QuestionnaireAnswers, UsageMode } from "@/types/questionnaire";
import { PRICING_PLANS } from "@/config/pricing";
import { useOfferCountdown, resolveYearlyPrice, yearlyStandardPrice } from "@/hooks/use-offer-countdown";
import { useMemo } from "react";

type BillingPeriod = 'monthly' | 'yearly';

interface PaywallStepProps {
  answers: QuestionnaireAnswers;
  selectedPlan: 'premium' | 'pro' | null;
  onPlanSelect: (planId: 'premium' | 'pro') => void;
  usageMode?: UsageMode | null;
  billingPeriod: BillingPeriod;
  onBillingPeriodChange: (period: BillingPeriod) => void;
}

// Insights « professionnels » : on lit les réponses du questionnaire pro
// (ids préfixés `p_`) pour résumer la maturité du pipeline du prospect.
function generateProInsights(answers: QuestionnaireAnswers) {
  const tracking = answers.p_tracking?.toString() || "";
  const noSystem = tracking.includes("head") || tracking.includes("don't");
  const hasCrm = tracking.includes("CRM");

  const gap = answers.p_gap?.toString() || "";
  const goal = answers.p_goal?.toString() || "";

  return {
    pattern: noSystem
      ? "Leads tracked by memory — high leak risk"
      : hasCrm
      ? "Structured pipeline, room to optimize"
      : "Manual tracking, ready to scale",

    attachmentStyle: gap.includes("first message")
      ? "Strong on volume, conversations stall early"
      : gap.includes("offer") || gap.includes("price")
      ? "Good at nurturing, loses leads at the close"
      : gap.includes("follow-up")
      ? "Strong on outreach, weak on follow-up"
      : "Balanced seller, steady through the funnel",

    primaryInsight: goal.includes("cold")
      ? "Your priority is timing — catching warm leads before they slip away is exactly where signal tracking pays off."
      : goal.includes("pipeline")
      ? "You want visibility. Seeing every prospect and their temperature at a glance is the fastest win here."
      : "Turning more conversations into clients starts with knowing who to message, and when — which is what we'll surface for you.",
  };
}

function generatePersonalInsights(answers: QuestionnaireAnswers) {
  // Chaque carte est pilotée par une question DISTINCTE pour éviter les
  // redondances : Pattern ← q2_pattern, Style ← q1, Insight ← q8.
  const pattern = answers.q2_pattern?.toString() || "";
  const style = answers.q1?.toString() || "";
  const reaction = answers.q8?.toString() || "";

  // Your Pattern — la disconnection est-elle récurrente ? (q2_pattern)
  const patternInsight = pattern.includes("more often than")
    ? "A recurring pattern in how your close bonds tend to end"
    : pattern.includes("completely new")
    ? "A first real experience of this kind of disconnection"
    : pattern.includes("similar")
    ? "You've felt this before — and this time you're paying attention"
    : "An emerging awareness of how you connect with others";

  // Relational Style — comment tu vis tes relations proches (q1)
  const styleInsight = style.includes("a lot of investment")
    ? "Deeply invested — you give a lot, sometimes more than you receive"
    : style.includes("some distance")
    ? "Self-protective — you open up slowly and on your own terms"
    : style.includes("balanced")
    ? "Balanced — you adapt to each person and each moment"
    : style.includes("anxiety")
    ? "Security-seeking — the fear of losing people stays close"
    : "A nuanced, evolving way of relating to others";

  // Key Insight — ta réaction émotionnelle face au signal (q8)
  const primaryInsight = reaction.includes("Anger")
    ? "There's a real sense of injustice here. Naming it matters — and it can also reveal the part of the story that's yours to learn from."
    : reaction.includes("Sadness")
    ? "The pain you feel reflects how much this mattered. Let yourself grieve while staying curious about what quietly shifted."
    : reaction.includes("Confusion")
    ? "Not knowing why is hard. The signals were likely there — just quieter than the unfollow itself."
    : reaction.includes("Relief")
    ? "Part of you saw it coming. That instinct is worth trusting in your next close relationship."
    : reaction.includes("Several")
    ? "You're holding several emotions at once — a sign you're processing this with real depth."
    : "This change is worth reading slowly, for what it reveals about you — not just about the other person.";

  return {
    pattern: patternInsight,
    attachmentStyle: styleInsight,
    primaryInsight,
  };
}

function generateInsights(answers: QuestionnaireAnswers, usageMode?: UsageMode | null) {
  return usageMode === 'professional'
    ? generateProInsights(answers)
    : generatePersonalInsights(answers);
}

export function PaywallStep({ answers, selectedPlan, onPlanSelect, usageMode, billingPeriod, onBillingPeriodChange }: PaywallStepProps) {
  const insights = generateInsights(answers, usageMode);
  const isPro = usageMode === 'professional';

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

  // L'offre limitée, c'est la remise annuelle (partagée avec les autres pages de
  // tarification) : une fois le compte à rebours expiré, l'annuel redevient 12× le mensuel.
  const { offerActive } = useOfferCountdown();

  const planMonthly = (planId: 'premium' | 'pro') => (planId === 'premium' ? 4.99 : 14.99);
  const planYearlyOffer = (planId: 'premium' | 'pro') => (planId === 'premium' ? 47.99 : 143.99);

  // Prix dynamiques selon le billing period
  const getPlanPrice = (planId: 'premium' | 'pro') => {
    if (billingPeriod === 'monthly') {
      return planMonthly(planId);
    }
    return resolveYearlyPrice(planMonthly(planId), planYearlyOffer(planId), offerActive);
  };

  const getYearlySavings = (planId: 'premium' | 'pro') => {
    return yearlyStandardPrice(planMonthly(planId)) - planYearlyOffer(planId);
  };

  const yearlyDiscount = Math.round((1 - (143.99 / (14.99 * 12))) * 100);
  
  return (
    <div className="w-full max-w-6xl space-y-12">
      {/* Reflection summary (based on the user's own answers — no AI) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#02c950]/10 border border-[#02c950]/30 mb-4">
          <Sparkles className="w-4 h-4 text-[#02c950]" />
          <span className="text-sm font-bold text-[#02c950]">Your reflection, summarized</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-3">
          Here's what stood out from <span className="text-gradient">your answers</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {isPro
            ? "A quick read on how you work today. Choose a plan to turn social signals into a pipeline and stop losing warm leads."
            : "A quick summary based on what you shared. Choose a plan to keep tracking your relationships and continue your reflection over time."}
        </p>
      </motion.div>

      {/* Free Preview Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-4 mb-8"
      >
        <div className="oled-card rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#02c950] mt-2 shrink-0 shadow-[0_0_8px_rgba(2,201,80,0.7)]"></div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">{isPro ? 'Your Pipeline' : 'Your Pattern'}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{insights.pattern}</p>
            </div>
          </div>
        </div>

        <div className="oled-card rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#02c950] mt-2 shrink-0 shadow-[0_0_8px_rgba(2,201,80,0.7)]"></div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">{isPro ? 'Your Selling Style' : 'Relational Style'}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{insights.attachmentStyle}</p>
            </div>
          </div>
        </div>

        <div className="oled-card rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#02c950] mt-2 shrink-0 shadow-[0_0_8px_rgba(2,201,80,0.7)]"></div>
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
          Choose your plan to start tracking your relationships
        </h3>
        
        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-1 bg-[#060606]/85 backdrop-blur-xl border border-white/10 rounded-full p-1">
            <button
              onClick={() => onBillingPeriodChange('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#02c950] text-black shadow-[0_0_20px_rgba(2,201,80,0.45)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => onBillingPeriodChange('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-[#02c950] text-black shadow-[0_0_20px_rgba(2,201,80,0.45)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              {offerActive && (
                <span className="absolute -top-2 -right-2 bg-[#02c950] text-black text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(2,201,80,0.5)]">
                  -{yearlyDiscount}%
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {orderedPlans.map((plan) => (
            <motion.div
              key={plan.id}
              onClick={() => onPlanSelect(plan.id)}
              className={`relative rounded-2xl p-8 border transition-all cursor-pointer backdrop-blur-xl ${
                selectedPlan === plan.id
                  ? 'border-[#02c950] bg-[#02c950]/[0.06] shadow-[0_0_40px_-8px_rgba(2,201,80,0.55)]'
                  : plan.id === recommendedPlan
                  ? 'border-[#02c950]/45 bg-[#060606]/85 hover:border-[#02c950]/70'
                  : 'border-white/10 bg-[#060606]/85 hover:border-white/25'
              }`}
            >
              {/* Badges — une seule rangée centrée pour ne jamais se chevaucher */}
              {(plan.id === recommendedPlan || selectedPlan === plan.id) && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap">
                  {plan.id === recommendedPlan && (
                    <span className="px-3 py-1 rounded-full bg-[#02c950]/15 border border-[#02c950]/40 text-[#02c950] text-xs font-bold flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" />
                      Recommended
                    </span>
                  )}
                  {selectedPlan === plan.id && (
                    <span className="px-3 py-1 rounded-full bg-[#02c950] text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_18px_rgba(2,201,80,0.5)]">
                      <Check className="w-3.5 h-3.5" />
                      Selected
                    </span>
                  )}
                </div>
              )}

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[#02c950]/12 border border-[#02c950]/25">
                {plan.id === 'premium' ? (
                  <Sparkles className="w-7 h-7 text-[#02c950]" />
                ) : (
                  <Users className="w-7 h-7 text-[#02c950]" />
                )}
              </div>

              {/* Plan name */}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  {billingPeriod === 'yearly' && offerActive && (
                    <span className="text-2xl font-bold text-gray-500 line-through">{yearlyStandardPrice(planMonthly(plan.id)).toFixed(2)}€</span>
                  )}
                  <span className="text-5xl font-black text-white">{getPlanPrice(plan.id).toFixed(2)}€</span>
                  <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingPeriod === 'yearly' && offerActive && (
                  <p className="text-sm text-[#02c950] mt-1">
                    Save {getYearlySavings(plan.id).toFixed(2)}€ compared to monthly
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
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[#02c950]/15 border border-[#02c950]/25">
                      <Check className="w-3 h-3 text-[#02c950]" />
                    </div>
                    <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Indicator */}
              <div className={`w-full py-3 rounded-xl font-bold text-center transition-all ${
                selectedPlan === plan.id
                  ? 'bg-[#02c950] text-black shadow-[0_0_24px_-6px_rgba(2,201,80,0.6)]'
                  : plan.id === recommendedPlan
                  ? 'bg-[#02c950]/15 text-[#02c950] border border-[#02c950]/40'
                  : 'bg-white/5 text-white border border-white/10'
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
              Click "Continue" below to proceed with your {selectedPlan === 'premium' ? 'Base' : 'Pro'} plan
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
          <Check className="w-4 h-4 text-[#02c950]" />
          <span>7-14 day free trial</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-[#02c950]" />
          <span>Cancel anytime</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-[#02c950]" />
          <span>Secure payment</span>
        </div>
      </motion.div>
    </div>
  );
}

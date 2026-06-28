import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  Crown, Check, X, ArrowLeft, Clock, Sparkles, Zap, Shield,
  Users, TrendingUp, BarChart3, FileText, Target, Calendar,
  Award, Briefcase, Star,
  Thermometer, Activity
} from 'lucide-react';
import { GlassText } from '@/components/GlassText';
import { RadarBackground } from '@/components/RadarBackground';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useOfferCountdown, yearlyStandardPrice } from '@/hooks/use-offer-countdown';

type BillingPeriod = 'monthly' | 'yearly';

export default function UpgradeToPro() {
  const [, setLocation] = useLocation();
  const { tier, upgradeToPro } = useSubscription();
  // TODO: Get actual billing period from user's subscription
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [currentBillingPeriod] = useState<BillingPeriod>('yearly'); // User's current billing period
  const timeLeft = useOfferCountdown();

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  const handleUpgrade = async () => {
    try {
      await upgradeToPro();
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  // L'offre limitée, c'est la remise annuelle : tant que le compte à rebours tourne,
  // les forfaits annuels sont remisés ; une fois expiré, le prix annuel redevient
  // 12× le prix mensuel (aucune économie). Les prix mensuels ne changent pas.
  const offerActive = timeLeft.offerActive;

  const premiumMonthly = 4.99;
  const proMonthly = 14.99;
  const premiumYearlyOffer = 47.99;
  const proYearlyOffer = 143.99;
  const premiumYearlyStandard = yearlyStandardPrice(premiumMonthly);
  const proYearlyStandard = yearlyStandardPrice(proMonthly);

  const premiumPrice =
    billingPeriod === 'monthly'
      ? premiumMonthly
      : offerActive
        ? premiumYearlyOffer
        : premiumYearlyStandard;
  const proPrice =
    billingPeriod === 'monthly'
      ? proMonthly
      : offerActive
        ? proYearlyOffer
        : proYearlyStandard;
  const yearlyDiscount = Math.round((1 - proYearlyOffer / (proMonthly * 12)) * 100);

  const premiumFeatures = [
    '1 Instagram account',
    '30-day change history',
    'See who unfollowed or blocked you',
    'Relationship & psychological insights',
    'Real-time unfollower alerts',
    'PDF export',
    'Email support',
  ];

  const proExclusiveFeatures = [
    { icon: Users, text: 'Up to 3 Instagram accounts', highlight: true },
    { icon: Calendar, text: 'Unlimited history', highlight: true },
    { icon: Briefcase, text: 'Client & prospect CRM (VIP / Keep / Watch)', highlight: true },
    { icon: Thermometer, text: 'DM conversation temperature (hot / warm / cold)', highlight: true },
    { icon: Target, text: 'Lead qualification phases', highlight: true },
    { icon: Activity, text: 'Interaction signal timeline', highlight: true },
    { icon: BarChart3, text: 'Contact health & priority scoring', highlight: true },
    { icon: FileText, text: 'PDF progress reports', highlight: true },
    { icon: Clock, text: 'Upcoming features', highlight: true },
    { icon: Award, text: '"Waler Pro Coach" badge', highlight: true },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-body text-white relative overflow-hidden">
      <RadarBackground />

      {/* Header */}
      <nav className="fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => setLocation('/dashboard/1')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <GlassText text="WALER" fontSize={32} />
          <div className="w-32" />
        </div>
      </nav>

      {/* Countdown Banner */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-black/60 border-b border-[#02c950]/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          {timeLeft.expired ? (
            <div className="flex items-center justify-center gap-3 flex-wrap text-center">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300 font-semibold">
                The special offer has ended — standard pricing now applies.
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Clock className="w-5 h-5 text-[#02c950] animate-pulse" />
              <span className="text-gray-200 font-semibold">Special offer expires in</span>
              <div className="flex items-center gap-1.5">
                {([
                  { value: timeLeft.hours, unit: 'h' },
                  { value: timeLeft.minutes, unit: 'm' },
                  { value: timeLeft.seconds, unit: 's' },
                ] as const).map((part, i) => (
                  <div key={part.unit} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-xl font-bold text-[#02c950]/60">:</span>}
                    <div className="bg-[#02c950]/10 border border-[#02c950]/30 rounded-lg px-3 py-1 min-w-[3rem] text-center tabular-nums">
                      <span className="font-mono text-xl font-bold text-white">{formatTime(part.value)}</span>
                      <span className="text-xs ml-1 text-[#02c950]">{part.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-44 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-4 py-2 mb-4"
            >
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-green-300 font-semibold text-sm">Level up</span>
            </motion.div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Unlock Professional mode
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              You're currently on the <span className="text-white font-bold">Base</span> plan.
              Discover what the <span className="text-[#02c950] font-bold">Pro</span> plan can do for you.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative ${
                  billingPeriod === 'yearly'
                    ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
                {offerActive && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    -{yearlyDiscount}%
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            {/* Current Plan - Base */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative oled-card rounded-2xl p-8"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#02c950]/15 border border-[#02c950]/40 text-[#02c950] px-3 py-1.5 rounded-full text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                Your current plan
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-green-400" />
              </div>

              {/* Plan name */}
              <h3 className="text-2xl font-bold text-white mb-2">Base</h3>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  {billingPeriod === 'yearly' && offerActive && (
                    <span className="text-2xl font-bold text-gray-500 line-through">{premiumYearlyStandard.toFixed(2)}€</span>
                  )}
                  <span className="text-5xl font-black text-white">{premiumPrice.toFixed(2)}€</span>
                  <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingPeriod === 'yearly' && offerActive && (
                  <p className="text-sm text-green-400 mt-1">
                    Save {(premiumYearlyStandard - premiumPrice).toFixed(2)}€ compared to monthly
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-1">
                  7-14 day free trial • Cancel anytime
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {premiumFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-green-500/20">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Indicator */}
              <div className="w-full py-3 rounded-xl font-bold text-center bg-white/10 text-white">
                Current Plan
              </div>
            </motion.div>

            {/* Upgrade Plan - Pro */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative rounded-2xl p-8 border-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/50 shadow-[0_0_30px_rgba(2,201,80,0.3)]"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold flex items-center gap-2">
                <Star className="w-4 h-4" />
                Recommended
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-green-400" />
              </div>

              {/* Plan name */}
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  {billingPeriod === 'yearly' && offerActive && (
                    <span className="text-2xl font-bold text-gray-500 line-through">{proYearlyStandard.toFixed(2)}€</span>
                  )}
                  <span className="text-5xl font-black text-white">{proPrice.toFixed(2)}€</span>
                  <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingPeriod === 'yearly' && offerActive && (
                  <p className="text-sm text-green-400 mt-1">
                    Save {(proYearlyStandard - proPrice).toFixed(2)}€ compared to monthly
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-1">
                  7-14 day free trial • Cancel anytime
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {proExclusiveFeatures.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-green-500/20">
                        <Icon className="w-3 h-3 text-green-400" />
                      </div>
                      <span className="text-gray-300 text-sm leading-relaxed">{feature.text}</span>
                      {feature.highlight && (
                        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <button
                onClick={handleUpgrade}
                className="w-full py-3 rounded-xl font-bold text-center bg-gradient-to-r from-green-500 to-emerald-500 text-white transition-all hover:from-green-600 hover:to-emerald-600"
              >
                Upgrade to Pro now
              </button>
            </motion.div>
          </div>

          {/* Pro Mode Preview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-6xl mx-auto mb-16"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-[#02c950]/10 border border-[#02c950]/30 rounded-full px-4 py-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#02c950]" />
                <span className="text-[#02c950] font-semibold text-sm">Exclusive Features</span>
              </div>
              <h2 className="text-4xl font-bold mb-4 text-gradient">
                Professional Mode Preview
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                The tools that turn your Instagram DMs into a real pipeline — built into Pro.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 - CRM */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="oled-card rounded-2xl p-6"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[#02c950]/12 border border-[#02c950]/25">
                  <Briefcase className="w-7 h-7 text-[#02c950]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Client &amp; Prospect CRM</h3>
                <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                  Keep every client and prospect in one place — sort them into VIP, Keep and Watch circles, add notes, and never lose a warm lead.
                </p>
                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#02c950]/15 border border-[#02c950]/30 flex items-center justify-center text-[#02c950] text-sm font-bold">
                      SD
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">@sarah.designs</div>
                      <div className="text-xs text-gray-500">Prospect</div>
                    </div>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#02c950]/15 border border-[#02c950]/30 text-[#02c950]">
                      VIP
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Activity className="w-3.5 h-3.5 text-[#02c950]" />
                    <span>Liked your last 3 posts</span>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2 - Analytics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="oled-card rounded-2xl p-6"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[#02c950]/12 border border-[#02c950]/25">
                  <Thermometer className="w-7 h-7 text-[#02c950]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Conversation Temperature</h3>
                <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                  Pro reads your DM dynamics and scores each contact hot, warm or cold — then tells you the next step to move them forward.
                </p>
                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Signal</span>
                    <span className="text-xs text-[#02c950] font-bold">Hot</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    {['Cold', 'Warm', 'Hot'].map((label, i) => (
                      <div
                        key={label}
                        className={`flex-1 text-center text-[10px] font-bold py-1 rounded ${
                          i === 2 ? 'bg-[#02c950] text-black' : 'bg-white/5 text-gray-500'
                        }`}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Target className="w-3.5 h-3.5 text-[#02c950]" />
                    <span>Next step: book a call</span>
                  </div>
                </div>
              </motion.div>

              {/* Feature 3 - Reports */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="oled-card rounded-2xl p-6"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-[#02c950]/12 border border-[#02c950]/25">
                  <FileText className="w-7 h-7 text-[#02c950]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">PDF Reports &amp; Export</h3>
                <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                  Export a clean PDF summary of your people and their progress in one click — ready to share or keep as a record.
                </p>
                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                  <div className="space-y-2">
                    {['People_summary.pdf', 'Prospects_June.pdf', 'Client_progress.pdf'].map((file) => (
                      <div key={file} className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#02c950]" />
                        <span className="text-xs text-gray-300">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5" />
                <span>Secure payment</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Zap className="w-5 h-5" />
                <span>Instant activation</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-5 h-5" />
                <span>10,000+ Pro users</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <TrendingUp className="w-5 h-5" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, ArrowLeft, Clock, Sparkles, Zap, Shield, Users, TrendingUp, Award, Star } from 'lucide-react';
import { GlassText } from '@/components/GlassText';
import { RadarBackground } from '@/components/RadarBackground';

type BillingPeriod = 'monthly' | 'yearly';

interface Plan {
  id: 'premium' | 'pro';
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  highlightedFeatures: string[];
  limitations: string[];
  popular?: boolean;
  icon: React.ElementType;
}

const PLANS: Plan[] = [
  {
    id: 'premium',
    name: 'premium',
    displayName: 'Premium',
    priceMonthly: 14.99,
    priceYearly: 149.99,
    icon: Star,
    features: [
      'Suivi de 3 comptes Instagram',
      'Historique de 30 jours',
      'Alertes unfollowers en temps réel',
      'Statistiques de base',
      'Export CSV',
      'Support par email',
    ],
    highlightedFeatures: [
      'Alertes instantanées',
      'Export de données',
    ],
    limitations: [
      'Pas de gestion de clients',
      'Pas de CRM intégré',
      'Historique limité',
    ],
  },
  {
    id: 'pro',
    name: 'pro',
    displayName: 'Pro',
    priceMonthly: 29.99,
    priceYearly: 299.99,
    icon: Crown,
    popular: true,
    features: [
      'Suivi illimité de comptes',
      'Historique illimité',
      'Alertes unfollowers en temps réel',
      'Statistiques avancées',
      'Export CSV & PDF',
      'Support prioritaire 24/7',
      'Gestion de clients (CRM)',
      'Suivi de prospects',
      'Tableau de bord professionnel',
      'Rapports personnalisés',
      'API access',
      'Mode multi-utilisateurs',
    ],
    highlightedFeatures: [
      'CRM intégré complet',
      'Suivi illimité',
      'Support 24/7',
    ],
    limitations: [],
  },
];

// Compte à rebours pour l'offre limitée (6 heures 3 minutes 3 secondes)
const COUNTDOWN_HOURS = 6;
const COUNTDOWN_MINUTES = 3;
const COUNTDOWN_SECONDS = 3;

export default function PlanComparison() {
  const [, setLocation] = useLocation();
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

  const handlePlanSelect = (planId: 'premium' | 'pro') => {
    // TODO: Implement checkout logic
    console.log(`Selected plan: ${planId}, billing: ${billingPeriod}`);
    // For now, redirect to dashboard
    setLocation('/dashboard/1');
  };

  const getDiscount = () => {
    const premiumMonthly = PLANS[0].priceMonthly * 12;
    const premiumYearly = PLANS[0].priceYearly;
    const discount = Math.round((1 - premiumYearly / premiumMonthly) * 100);
    return discount;
  };

  const getSavingsAmount = (planId: 'premium' | 'pro') => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return 0;
    const monthlyForYear = plan.priceMonthly * 12;
    return monthlyForYear - plan.priceYearly;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-body text-white relative overflow-hidden">
      <RadarBackground />

      {/* Header */}
      <nav className="fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => setLocation('/dashboard/1')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <GlassText text="WALER" fontSize={32} />
          <div className="w-20" />
        </div>
      </nav>

      {/* Countdown Banner */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Clock className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-red-100 font-bold">Offre limitée expire dans</span>
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
              <span className="text-green-300 font-semibold text-sm">Débloquez tout le potentiel de Waler</span>
            </motion.div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Choisissez votre plan
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Comparez nos plans et choisissez celui qui correspond le mieux à vos besoins
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
                  -{getDiscount()}%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan, index) => {
              const PlanIcon = plan.icon;
              const price = billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly;
              const periodLabel = billingPeriod === 'monthly' ? '/mois' : '/an';
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-3xl p-8 backdrop-blur-xl border-2 ${
                    plan.popular
                      ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.3)]'
                      : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      Plus populaire
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                      plan.popular ? 'bg-green-500/20' : 'bg-green-500/20'
                    }`}>
                      <PlanIcon className={`w-8 h-8 ${plan.popular ? 'text-green-400' : 'text-green-400'}`} />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{plan.displayName}</h2>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-bold">{price.toFixed(2)}€</span>
                      <span className="text-gray-400">{periodLabel}</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <p className="text-sm text-green-400 mt-2">
                        Économisez {getSavingsAmount(plan.id).toFixed(2)}€ par rapport au mensuel
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all mb-8 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]'
                    }`}
                  >
                    Choisir {plan.displayName}
                  </button>

                  {/* Features */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400" />
                      Inclus
                    </h3>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}

                    {plan.limitations.length > 0 && (
                      <>
                        <h3 className="font-bold text-lg mb-4 mt-8 flex items-center gap-2">
                          <X className="w-5 h-5 text-red-400" />
                          Limitations
                        </h3>
                        {plan.limitations.map((limitation, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-400">{limitation}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Trust Badges */}
          <div className="mt-16 text-center">
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2 text-gray-400">
                <Shield className="w-5 h-5" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Zap className="w-5 h-5" />
                <span>Activation instantanée</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-5 h-5" />
                <span>+10,000 utilisateurs</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <TrendingUp className="w-5 h-5" />
                <span>Annulation à tout moment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

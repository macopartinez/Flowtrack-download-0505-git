import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Crown, Check, X, ArrowLeft, Clock, Sparkles, Zap, Shield, 
  Users, TrendingUp, BarChart3, FileText, Target, Calendar,
  MessageSquare, Award, Briefcase, UserPlus, LineChart, Star
} from 'lucide-react';
import { GlassText } from '@/components/GlassText';
import { RadarBackground } from '@/components/RadarBackground';
import { useSubscription } from '@/contexts/SubscriptionContext';

type BillingPeriod = 'monthly' | 'yearly';

// Compte à rebours pour l'offre limitée (6 heures 3 minutes 3 secondes)
const COUNTDOWN_HOURS = 6;
const COUNTDOWN_MINUTES = 3;
const COUNTDOWN_SECONDS = 3;

export default function UpgradeToPro() {
  const [, setLocation] = useLocation();
  const { tier, upgradeToPro } = useSubscription();
  // TODO: Get actual billing period from user's subscription
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [currentBillingPeriod] = useState<BillingPeriod>('yearly'); // User's current billing period
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

  const handleUpgrade = async () => {
    try {
      await upgradeToPro();
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  const premiumPrice = billingPeriod === 'monthly' ? 14.99 : 149.99;
  const proPrice = billingPeriod === 'monthly' ? 29.99 : 299.99;
  const difference = proPrice - premiumPrice;
  const yearlyDiscount = Math.round((1 - (299.99 / (29.99 * 12))) * 100);

  const premiumFeatures = [
    'Suivi de 3 comptes Instagram',
    'Historique de 30 jours',
    'Alertes unfollowers en temps réel',
    'Statistiques de base',
    'Export CSV',
    'Support par email',
  ];

  const proExclusiveFeatures = [
    { icon: Users, text: 'Suivi illimité de comptes', highlight: true },
    { icon: Calendar, text: 'Historique illimité', highlight: true },
    { icon: Briefcase, text: 'Gestion de clients (CRM)', highlight: true },
    { icon: UserPlus, text: 'Suivi de prospects', highlight: true },
    { icon: BarChart3, text: 'Statistiques avancées', highlight: true },
    { icon: FileText, text: 'Rapports personnalisés', highlight: true },
    { icon: Target, text: 'Tableau de bord professionnel', highlight: true },
    { icon: MessageSquare, text: 'Support prioritaire 24/7', highlight: true },
    { icon: Zap, text: 'API access', highlight: true },
    { icon: Award, text: 'Mode multi-utilisateurs', highlight: true },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-body text-white relative overflow-hidden">
      <RadarBackground />

      {/* Header */}
      <nav className="fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => setLocation('/dashboard/1')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Retour au Dashboard
          </button>
          <GlassText text="WALER" fontSize={32} />
          <div className="w-32" />
        </div>
      </nav>

      {/* Countdown Banner */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
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
              <span className="text-green-300 font-semibold text-sm">Passez au niveau supérieur</span>
            </motion.div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Débloquez le mode Professionnel
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Vous êtes actuellement sur le plan <span className="text-purple-400 font-bold">Premium</span>. 
              Découvrez ce que le plan <span className="text-green-400 font-bold">Pro</span> peut vous apporter.
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
                  -{yearlyDiscount}%
                </span>
              </button>
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            {/* Current Plan - Premium */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative rounded-2xl p-8 border-2 bg-white/5 backdrop-blur-sm border-white/10"
            >
              <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                ✓ Votre plan actuel
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-green-400" />
              </div>

              {/* Plan name */}
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{premiumPrice.toFixed(2)}€</span>
                  <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'mois' : 'an'}</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-green-400 mt-1">
                    Économisez {((14.99 * 12) - premiumPrice).toFixed(2)}€ par rapport au mensuel
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
                  <span className="text-5xl font-black text-white">{proPrice.toFixed(2)}€</span>
                  <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'mois' : 'an'}</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-green-400 mt-1">
                    Économisez {((29.99 * 12) - proPrice).toFixed(2)}€ par rapport au mensuel
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
                          Nouveau
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
                Passer à Pro maintenant
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
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-4 py-2 mb-4">
                <Sparkles className="w-4 h-4 text-green-400" />
                <span className="text-green-300 font-semibold text-sm">Fonctionnalités Exclusives</span>
              </div>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Aperçu du Mode Professionnel
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Découvrez les fonctionnalités exclusives qui transformeront votre gestion Instagram en véritable outil professionnel
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 - CRM */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-green-400">CRM Intégré</h3>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  Gérez tous vos clients Instagram en un seul endroit. Suivez leurs statistiques, ajoutez des notes et organisez vos interactions professionnelles.
                </p>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
                    <div>
                      <div className="text-sm font-bold">@client_example</div>
                      <div className="text-xs text-gray-500">12.5K followers</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    <div className="flex justify-between mb-1">
                      <span>Engagement:</span>
                      <span className="text-green-400">+15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dernière analyse:</span>
                      <span>Il y a 2h</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2 - Analytics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <LineChart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-green-400">Statistiques Avancées</h3>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  Accédez à des analyses détaillées avec graphiques interactifs, tendances et prévisions de croissance pour vos clients.
                </p>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Croissance mensuelle</span>
                    <span className="text-xs text-green-400 font-bold">+23.5%</span>
                  </div>
                  <div className="h-20 flex items-end gap-1">
                    {[40, 55, 45, 70, 65, 80, 90].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Feature 3 - Reports */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6 hover:border-green-500/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-green-400">Rapports Personnalisés</h3>
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  Générez des rapports professionnels en PDF pour vos clients avec votre branding personnalisé et logo.
                </p>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-400" />
                      <span className="text-xs">Rapport_Janvier_2024.pdf</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-400" />
                      <span className="text-xs">Analyse_Mensuelle.pdf</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-400" />
                      <span className="text-xs">Rapport_Client_XYZ.pdf</span>
                    </div>
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
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Zap className="w-5 h-5" />
                <span>Activation instantanée</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-5 h-5" />
                <span>+10,000 utilisateurs Pro</span>
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

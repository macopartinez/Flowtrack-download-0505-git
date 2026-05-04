import { useState } from "react";
import { useLocation } from "wouter";
import { usePlans, useCreateCheckout, useUserPlan } from "@/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { RadarBackground } from "@/components/RadarBackground";
import { GlassText } from "@/components/GlassText";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const [, navigate] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isSimulating, setIsSimulating] = useState(false);
  const { user } = useAuth();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: userPlan } = useUserPlan();
  const { mutate: createCheckout, isPending: isCheckoutPending } = useCreateCheckout();
  const { toast } = useToast();

  const handleSimulateSubscription = async () => {
    if (!user) return;
    
    setIsSimulating(true);
    try {
      const response = await fetch(`/api/admin/trigger-follow/${user.id}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Agents activés !",
          description: `Les agents A et B vont te suivre (@${data.username})`,
        });
      } else {
        toast({
          title: "Agents non actifs",
          description: "Lance les agents A et B manuellement d'abord",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de déclencher les agents",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSubscribe = (planName: string, priceId: string | null) => {
    if (!user) {
      navigate("/onboard");
      return;
    }

    // Sauvegarder le plan sélectionné dans localStorage
    localStorage.setItem('selectedPlan', JSON.stringify({
      planName,
      priceId,
      billingPeriod
    }));

    // Rediriger vers l'onboarding pour compléter le questionnaire
    navigate("/onboard");
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#02c950]" />
      </div>
    );
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "base":
        return Zap;
      case "pro":
        return Crown;
      default:
        return Zap;
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const currentPlanName = userPlan?.plan.name || "base";

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-body text-white relative overflow-hidden">
      <RadarBackground />

      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <GlassText text="WALER" fontSize={32} />
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-white hover:text-[#02c950]"
          >
            Retour
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Choisissez votre <span className="text-[#02c950]">plan</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto"
            >
              Commencez gratuitement, passez au Pro quand vous êtes prêt
            </motion.p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-full p-1 bg-white/5 border border-white/10">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-[#02c950] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "yearly"
                    ? "bg-[#02c950] text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Annuel
                <span className="ml-2 text-xs bg-[#02c950]/20 text-[#02c950] px-2 py-1 rounded-full">
                  -17%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans?.map((plan, index) => {
              const Icon = getPlanIcon(plan.name);
              const price = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceYearly;
              const priceId =
                billingPeriod === "monthly"
                  ? plan.stripePriceIdMonthly
                  : plan.stripePriceIdYearly;
              const isCurrentPlan = currentPlanName === plan.name;
              const isPopular = plan.name === "pro";

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-3xl border p-8 backdrop-blur-xl ${
                    isPopular
                      ? "border-[#02c950] bg-[#02c950]/5 scale-105"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#02c950] text-black px-4 py-1 rounded-full text-sm font-bold">
                      Le plus populaire
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Plan actuel
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#02c950]/20 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#02c950]" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{plan.displayName}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{formatPrice(price)}€</span>
                      <span className="text-gray-400">
                        /{billingPeriod === "monthly" ? "mois" : "an"}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#02c950] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-3">
                    <Button
                      onClick={() => handleSubscribe(plan.name, priceId)}
                      disabled={isCurrentPlan || isCheckoutPending}
                      className={`w-full h-12 rounded-xl font-bold ${
                        isPopular
                          ? "bg-[#02c950] hover:bg-[#02c950]/90 text-black"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {isCheckoutPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Chargement...
                        </>
                      ) : isCurrentPlan ? (
                        "Plan actuel"
                      ) : (
                        "Choisir ce plan"
                      )}
                    </Button>

                    {/* Bouton de simulation */}
                    {!isCurrentPlan && (
                      <Button
                        onClick={handleSimulateSubscription}
                        disabled={isSimulating}
                        variant="outline"
                        className="w-full h-10 rounded-xl font-medium bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/50"
                      >
                        {isSimulating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Activation...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Simuler (Test)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ or Additional Info */}
          <div className="mt-20 text-center">
            <p className="text-gray-400">
              Besoin d'aide pour choisir ?{" "}
              <a href="mailto:support@waler.app" className="text-[#02c950] hover:underline">
                Contactez-nous
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

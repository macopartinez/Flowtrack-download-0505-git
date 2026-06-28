import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SubscriptionTier } from '@/config/pricing';

interface SubscriptionContextType {
  tier: SubscriptionTier | null;
  isLoading: boolean;
  isPremium: boolean;
  isPro: boolean;
  trialEndsAt: Date | null;
  isTrialActive: boolean;
  upgradeToPremium: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  useEffect(() => {
    // Fetch user subscription from backend
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      console.log('🔄 Fetching subscription status...');
      const response = await fetch('/api/subscription/status', {
        credentials: 'include'
      });
      
      console.log('📡 Subscription API response:', { 
        ok: response.ok, 
        status: response.status 
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Subscription data received:', data);
        setTier(data.tier);
        if (data.trialEndsAt) {
          setTrialEndsAt(new Date(data.trialEndsAt));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Subscription fetch failed:', { 
          status: response.status, 
          error: errorData 
        });
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    try {
      // Récupérer les plans disponibles
      const plansResponse = await fetch('/api/plans', { credentials: 'include' });
      const plans = await plansResponse.json();
      
      // Trouver le plan Premium. Côté serveur, ce plan est nommé "base"
      // (routes.ts mappe 'premium' → 'base'), donc on accepte les deux clés.
      const premiumPlan = plans.find((p: any) => {
        const name = p.name.toLowerCase();
        return name === 'premium' || name === 'base';
      });
      if (!premiumPlan) {
        throw new Error('Premium plan not found');
      }

      // Utiliser le prix annuel par défaut
      const priceId = premiumPlan.stripePriceIdYearly;
      if (!priceId) {
        throw new Error('Stripe price not configured for Premium');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId, billingPeriod: 'yearly' })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to upgrade to Premium:', error);
      throw error;
    }
  };

  const upgradeToPro = async () => {
    try {
      // Récupérer les plans disponibles
      const plansResponse = await fetch('/api/plans', { credentials: 'include' });
      const plans = await plansResponse.json();
      
      // Trouver le plan Pro
      const proPlan = plans.find((p: any) => p.name.toLowerCase() === 'pro');
      if (!proPlan) {
        throw new Error('Pro plan not found');
      }

      // Utiliser le prix annuel par défaut
      const priceId = proPlan.stripePriceIdYearly;
      if (!priceId) {
        throw new Error('Stripe price not configured for Pro');
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ priceId, billingPeriod: 'yearly' })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to upgrade to Pro:', error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchSubscription();
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  };

  const isPremium = tier === 'premium' || tier === 'pro';
  const isPro = tier === 'pro';
  const isTrialActive = trialEndsAt ? new Date() < trialEndsAt : false;

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        isLoading,
        isPremium,
        isPro,
        trialEndsAt,
        isTrialActive,
        upgradeToPremium,
        upgradeToPro,
        cancelSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export type SubscriptionTier = 'premium' | 'pro';

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'month';
  trialDays: number;
  features: string[];
  cta: string;
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    trialDays: 7,
    cta: 'Start 7-Day Free Trial',
    features: [
      'Complete AI relationship analysis',
      'See who unfollowed/blocked you (with RevealGate)',
      'Full change history (30 days)',
      'Personalized psychological insights',
      'Real-time notifications',
      'Unlimited introspection questionnaires'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    trialDays: 14,
    popular: true,
    cta: 'Start 14-Day Free Trial',
    features: [
      'Everything in Premium',
      'Personal + Professional dual mode',
      'Unlimited client management',
      'Track client followers/following growth',
      'Custom milestones & progress tracking',
      'Professional notebook with tags',
      'Client onboarding links',
      'Progress reports & PDF export',
      'Portfolio statistics & proof',
      'Messaging hub with clients',
      '"Waler Pro Coach" badge'
    ]
  }
];

export function getPlanById(id: SubscriptionTier): PricingPlan | undefined {
  return PRICING_PLANS.find(plan => plan.id === id);
}

export function isPremiumFeature(feature: string): boolean {
  const premiumFeatures = [
    'ai_insights',
    'reveal_gate',
    'full_history',
    'notifications'
  ];
  return premiumFeatures.includes(feature);
}

export function isProFeature(feature: string): boolean {
  const proFeatures = [
    'client_management',
    'client_analytics',
    'milestones',
    'professional_notebook',
    'reports_export',
    'messaging_hub',
    'pro_badge'
  ];
  return proFeatures.includes(feature);
}

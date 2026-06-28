import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Plan = {
  id: number;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  maxAccounts: number;
  maxHistoryDays: number;
  features: string[];
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
};

type Subscription = {
  id: number;
  userId: number;
  planId: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  billingPeriod: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
};

type UserPlan = {
  plan: Plan;
  subscription: Subscription | null;
};

/**
 * Récupère tous les plans disponibles
 */
export function usePlans() {
  return useQuery<Plan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await fetch("/api/plans");
      if (!res.ok) {
        throw new Error("Failed to fetch plans");
      }
      return res.json();
    },
  });
}

/**
 * Récupère le plan actuel de l'utilisateur
 */
export function useUserPlan() {
  return useQuery<UserPlan>({
    queryKey: ["subscription", "current"],
    queryFn: async () => {
      const res = await fetch("/api/subscription/current", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch user plan");
      }
      return res.json();
    },
  });
}

/**
 * Crée une session Stripe Checkout
 */
export function useCreateCheckout() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { priceId: string; billingPeriod: "monthly" | "yearly" }) => {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create checkout session");
      }

      return res.json() as Promise<{ sessionId: string; url: string }>;
    },
    onSuccess: (data) => {
      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Ouvre le portail client Stripe
 */
export function useCustomerPortal() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/portal", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create portal session");
      }

      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: (data) => {
      // Ouvrir le portail dans un nouvel onglet
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

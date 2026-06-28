import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Types derived from schema/routes
type ConnectInput = z.infer<typeof api.users.connect.input>;
type User = z.infer<typeof api.users.get.responses[200]>;
type Stats = z.infer<typeof api.stats.get.responses[200]>;

// Hook to connect an account
export function useConnectAccount() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: ConnectInput) => {
      // Simulate network delay for effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await fetch(api.users.connect.path, {
        method: api.users.connect.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to connect account");
      }

      return api.users.connect.responses[200].parse(await res.json());
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Hook to fetch user details
export function useUser(id: number | null) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.users.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("User not found");
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Hook to fetch stats
export function useStats(userId: number | null) {
  return useQuery({
    queryKey: ['stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      const url = buildUrl(api.stats.get.path, { userId });
      const res = await fetch(url, {
        cache: 'no-store', // Désactiver le cache du navigateur
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
    enabled: !!userId,
    staleTime: 0, // Les données sont immédiatement considérées comme obsolètes
    gcTime: 0, // Ne pas garder en cache
    refetchOnMount: true, // Recharger à chaque montage du composant
    refetchOnWindowFocus: true, // Recharger quand la fenêtre reprend le focus
  });
}

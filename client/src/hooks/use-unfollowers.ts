import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useAuth } from "./use-auth";

export function useUnfollowers(accountId?: number | null) {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['unfollowers', accountId ?? user?.id],
    queryFn: async () => {
      const url = accountId ? `${api.unfollowers.list.path}?accountId=${accountId}` : api.unfollowers.list.path;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch unfollowers");
      return res.json();
    },
    enabled: !isLoading && !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useGhostFollowers(accountId?: number | null) {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['ghost-followers', accountId ?? user?.id],
    queryFn: async () => {
      const url = accountId ? `${api.unfollowers.ghostFollowers.path}?accountId=${accountId}` : api.unfollowers.ghostFollowers.path;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch ghost followers: ${res.status}`);
      return res.json();
    },
    enabled: !isLoading && !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useUnfollowerStats(accountId?: number | null) {
  const { user, isLoading } = useAuth();

  return useQuery({
    queryKey: ['unfollower-stats', accountId ?? user?.id],
    queryFn: async () => {
      const url = accountId ? `${api.unfollowers.stats.path}?accountId=${accountId}` : api.unfollowers.stats.path;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch unfollower stats");
      return res.json();
    },
    enabled: !isLoading && !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

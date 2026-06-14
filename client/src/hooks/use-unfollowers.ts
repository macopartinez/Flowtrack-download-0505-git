import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useAuth } from "./use-auth";

export function useUnfollowers() {
  const { user, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['unfollowers', user?.id],
    queryFn: async () => {
      console.log('🚀 Fetching unfollowers...');
      const res = await fetch(api.unfollowers.list.path, {
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.text();
        console.error('❌ Failed to fetch unfollowers:', error);
        throw new Error("Failed to fetch unfollowers");
      }
      const data = await res.json();
      console.log('✅ Unfollowers fetched:', data);
      return data;
    },
    enabled: !isLoading && !!user,
    staleTime: 0,
  });
}

export function useGhostFollowers() {
  const { user, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['ghost-followers', user?.id],
    queryFn: async () => {
      console.log('🚀 Fetching ghost followers...');
      const res = await fetch(api.unfollowers.ghostFollowers.path, {
        credentials: 'include',
      });
      
      console.log('📡 Response status:', res.status, res.statusText);
      
      const text = await res.text();
      console.log('📄 Response text (first 200 chars):', text.substring(0, 200));
      
      if (!res.ok) {
        console.error('❌ Failed to fetch ghost followers. Status:', res.status);
        throw new Error(`Failed to fetch ghost followers: ${res.status}`);
      }
      
      try {
        const data = JSON.parse(text);
        console.log('✅ Ghost followers fetched:', data);
        return data;
      } catch (err) {
        console.error('❌ JSON parse error:', err);
        console.error('❌ Response was:', text);
        throw err;
      }
    },
    enabled: !isLoading && !!user,
    staleTime: 0,
  });
}

export function useUnfollowerStats() {
  const { user, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['unfollower-stats', user?.id],
    queryFn: async () => {
      console.log('🚀 Fetching unfollower stats...');
      const res = await fetch(api.unfollowers.stats.path, {
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.text();
        console.error('❌ Failed to fetch unfollower stats:', error);
        throw new Error("Failed to fetch unfollower stats");
      }
      const data = await res.json();
      console.log('✅ Unfollower stats fetched:', data);
      return data;
    },
    enabled: !isLoading && !!user,
    staleTime: 0,
  });
}

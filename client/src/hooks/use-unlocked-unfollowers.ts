import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useUnlockedUnfollowers() {
  return useQuery({
    queryKey: ['unlocked-unfollowers'],
    queryFn: async () => {
      const res = await fetch('/api/unfollowers/unlocked/list', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error("Failed to fetch unlocked unfollowers");
      }
      const data = await res.json();
      console.log('🔓 Unlocked IDs loaded:', data.unlockedIds);
      return data.unlockedIds as number[];
    },
    staleTime: 0, // Always refetch to ensure fresh data
  });
}

export function useCheckUnlocked(unfollowerId: number | null) {
  return useQuery({
    queryKey: ['unlocked-unfollower', unfollowerId],
    queryFn: async () => {
      if (!unfollowerId) return false;
      const res = await fetch(`/api/unfollowers/${unfollowerId}/unlocked`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error("Failed to check unlock status");
      }
      const data = await res.json();
      return data.unlocked as boolean;
    },
    enabled: !!unfollowerId,
  });
}

export function useUnlockUnfollower() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (unfollowerId: number) => {
      const res = await fetch(`/api/unfollowers/${unfollowerId}/unlock`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error("Failed to unlock unfollower");
      }
      return res.json();
    },
    onSuccess: async (_, unfollowerId) => {
      console.log('✅ Account unlocked:', unfollowerId);
      // Invalider et refetch immédiatement les caches
      await queryClient.invalidateQueries({ queryKey: ['unlocked-unfollowers'] });
      await queryClient.refetchQueries({ queryKey: ['unlocked-unfollowers'] });
      await queryClient.invalidateQueries({ queryKey: ['unlocked-unfollower', unfollowerId] });
    },
  });
}

export function useUnlockAllUnfollowers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/unfollowers/unlock-all', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error("Failed to unlock all unfollowers");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      console.log('✅ All accounts unlocked:', data.count);
      // Invalider et refetch immédiatement les caches
      await queryClient.invalidateQueries({ queryKey: ['unlocked-unfollowers'] });
      await queryClient.refetchQueries({ queryKey: ['unlocked-unfollowers'] });
    },
  });
}

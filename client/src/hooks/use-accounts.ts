import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export interface InstagramAccount {
  id: number;
  username: string;
  avatarUrl: string | null;
  instagramUserId: string | null;
  isOwner: boolean;
  active: boolean;
  followersCount: number | null;
}

export interface AccountsResponse {
  accounts: InstagramAccount[];
  activeAccountId: number;
  ownerId: number;
}

/** Liste des comptes Instagram du login (owner + comptes liés) et compte actif. */
export function useAccounts() {
  const { user, isLoading } = useAuth();

  return useQuery<AccountsResponse>({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/accounts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
    enabled: !isLoading && !!user,
    staleTime: 0,
  });
}

/** Supprime un compte Instagram lié (et ses données) du login owner. */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: number) => {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete account");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["unfollowers"] });
    },
  });
}

/** Bascule le compte Instagram actif et rafraîchit toutes les données dépendantes. */
export function useSwitchAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: number) => {
      const res = await fetch("/api/accounts/switch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) throw new Error("Failed to switch account");
      return res.json();
    },
    onSuccess: () => {
      // Invalider toutes les données scopées au compte actif.
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["unfollowers"] });
      queryClient.invalidateQueries({ queryKey: ["ghost-followers"] });
      queryClient.invalidateQueries({ queryKey: ["unfollower-stats"] });
    },
  });
}

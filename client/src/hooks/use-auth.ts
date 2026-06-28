import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  email: string;
  platform: string;
  avatarUrl: string | null;
  isConnected: boolean | null;
  isVerified: boolean | null;
  createdAt: Date | null;
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  username: string;
  email: string;
  password: string;
  platform: "instagram";
  usageMode?: "personal" | "professional";
  selectedPlan?: "premium" | "pro" | null;
};

async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }
  return res.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Sign-in failed");
      }
      
      return res.json() as Promise<User>;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      navigate(`/dashboard/${user.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Sign-in error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Sign-up failed");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // data contient { user, verificationCode, verificationRequired }
      queryClient.setQueryData(["auth", "me"], data.user);
      
      // Rediriger vers la page de vérification si nécessaire
      if (data.verificationRequired && !data.user.isVerified) {
        navigate("/verification");
      } else {
        navigate(`/dashboard/${data.user.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Sign-up error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
      navigate("/");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isLoading && !isAuthenticated) {
    navigate("/");
  }

  return { user, isLoading, isAuthenticated };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type VerificationData = {
  verificationCode: string;
  username: string;
  expiresAt: string;
};

type VerifyInput = {
  userId: number;
  code: string;
};

export function useVerification(userId: number | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Generate verification code
  const generateCode = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/verification/generate", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate the code");
      }

      return res.json() as Promise<VerificationData>;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify code
  const verifyCode = useMutation({
    mutationFn: async (input: VerifyInput) => {
      const res = await fetch("/api/auth/verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }

      return data;
    },
    onSuccess: () => {
      // Invalider le cache de l'utilisateur pour récupérer isVerified: true
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      
      toast({
        title: "Account verified!",
        description: "Your account has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resend code
  const resendCode = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/verification/resend", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to resend the code");
      }

      return res.json() as Promise<VerificationData>;
    },
    onSuccess: () => {
      toast({
        title: "Code resent",
        description: "A new verification code has been generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    generateCode: generateCode.mutate,
    generateCodeAsync: generateCode.mutateAsync,
    isGenerating: generateCode.isPending,
    
    verifyCode: verifyCode.mutate,
    verifyCodeAsync: verifyCode.mutateAsync,
    isVerifying: verifyCode.isPending,
    
    resendCode: resendCode.mutate,
    resendCodeAsync: resendCode.mutateAsync,
    isResending: resendCode.isPending,
  };
}

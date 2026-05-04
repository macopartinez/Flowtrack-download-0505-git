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
        throw new Error(error.message || "Échec de la génération du code");
      }

      return res.json() as Promise<VerificationData>;
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
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
        throw new Error(data.message || "Échec de la vérification");
      }

      return data;
    },
    onSuccess: () => {
      // Invalider le cache de l'utilisateur pour récupérer isVerified: true
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      
      toast({
        title: "Compte vérifié !",
        description: "Votre compte a été vérifié avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de vérification",
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
        throw new Error(error.message || "Échec du renvoi du code");
      }

      return res.json() as Promise<VerificationData>;
    },
    onSuccess: () => {
      toast({
        title: "Code renvoyé",
        description: "Un nouveau code de vérification a été généré.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
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

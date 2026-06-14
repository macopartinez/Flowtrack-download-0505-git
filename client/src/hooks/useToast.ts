import { useToast as useToastOriginal } from '@/components/ui/use-toast';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

/**
 * Hook personnalisé pour les toasts avec helpers
 */
export function useToast() {
  const { toast: originalToast, ...rest } = useToastOriginal();

  const toast = {
    ...rest,

    /**
     * Toast de succès
     */
    success: (title: string, description?: string, duration?: number) => {
      originalToast({
        title: `✅ ${title}`,
        description,
        duration: duration || 3000,
      });
    },

    /**
     * Toast d'erreur
     */
    error: (title: string, description?: string, duration?: number) => {
      originalToast({
        title: `❌ ${title}`,
        description,
        variant: 'destructive',
        duration: duration || 5000,
      });
    },

    /**
     * Toast d'avertissement
     */
    warning: (title: string, description?: string, duration?: number) => {
      originalToast({
        title: `⚠️ ${title}`,
        description,
        duration: duration || 4000,
      });
    },

    /**
     * Toast d'information
     */
    info: (title: string, description?: string, duration?: number) => {
      originalToast({
        title: `ℹ️ ${title}`,
        description,
        duration: duration || 3000,
      });
    },

    /**
     * Toast de chargement
     */
    loading: (title: string, description?: string) => {
      return originalToast({
        title: `⏳ ${title}`,
        description,
        duration: Infinity,
      });
    },

    /**
     * Toast de promesse (loading → success/error)
     */
    promise: async <T,>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      }
    ): Promise<T> => {
      const loadingToast = originalToast({
        title: `⏳ ${options.loading}`,
        duration: Infinity,
      });

      try {
        const result = await promise;
        
        loadingToast.dismiss();
        
        const successMessage = typeof options.success === 'function'
          ? options.success(result)
          : options.success;

        originalToast({
          title: `✅ ${successMessage}`,
          duration: 3000,
        });

        return result;
      } catch (error: any) {
        loadingToast.dismiss();

        const errorMessage = typeof options.error === 'function'
          ? options.error(error)
          : options.error;

        originalToast({
          title: `❌ ${errorMessage}`,
          description: error.message,
          variant: 'destructive',
          duration: 5000,
        });

        throw error;
      }
    },

    /**
     * Toast personnalisé
     */
    custom: originalToast,
  };

  return toast;
}

/**
 * Helper pour afficher les erreurs API
 */
export function useApiErrorToast() {
  const toast = useToast();

  return (error: any, defaultMessage: string = 'Une erreur s\'est produite') => {
    const message = error?.message || error?.data?.message || defaultMessage;
    const details = error?.data?.details;

    toast.error(message, details);
  };
}

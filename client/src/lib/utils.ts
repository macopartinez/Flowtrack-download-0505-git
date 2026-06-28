import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Avatar de repli (quand aucune vraie photo Instagram n'est disponible).
 * Initiales sur fond vert de marque — minimaliste et identifiable, plutôt que
 * les visages cartoon « émoji » de l'ancien style avataaars.
 */
export function fallbackAvatar(seed: string): string {
  const s = encodeURIComponent(seed || "waler");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${s}&backgroundColor=16a34a,15803d,166534&fontWeight=600`;
}

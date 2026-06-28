import { useEffect, useState } from 'react';

// Offre limitée partagée par toutes les pages de tarification (Upgrade, paywall,
// comparaison). L'offre EST la remise annuelle : tant que le compte à rebours
// tourne, les forfaits annuels sont remisés ; une fois expiré, le prix annuel
// redevient 12× le prix mensuel (aucune économie). Les prix mensuels ne changent pas.
//
// L'échéance est persistée dans localStorage pour que le compteur continue à
// descendre en temps réel — et reste cohérent — même après un rechargement, un
// retour ultérieur, ou en passant d'une page de tarification à une autre.
const COUNTDOWN_DURATION_MS = (6 * 3600 + 3 * 60 + 3) * 1000;
const DEADLINE_KEY = 'waler_pro_offer_deadline';

// Renvoie l'échéance stockée, ou en crée une neuve (now + durée) au premier passage.
function getOfferDeadline(): number {
  try {
    const stored = localStorage.getItem(DEADLINE_KEY);
    if (stored) {
      const ts = parseInt(stored, 10);
      if (!Number.isNaN(ts)) return ts;
    }
  } catch {
    // localStorage indisponible (mode privé) — on retombe sur une échéance volatile.
  }
  const deadline = Date.now() + COUNTDOWN_DURATION_MS;
  try {
    localStorage.setItem(DEADLINE_KEY, String(deadline));
  } catch {
    /* ignore */
  }
  return deadline;
}

export interface OfferCountdown {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  /** Raccourci pratique : true tant que l'offre limitée est encore valable. */
  offerActive: boolean;
}

function computeTimeLeft(deadline: number): OfferCountdown {
  const diff = Math.max(0, deadline - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const expired = diff <= 0;
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired,
    offerActive: !expired,
  };
}

/**
 * Compte à rebours temps réel de l'offre limitée. On recalcule depuis l'échéance
 * persistée à chaque tick, donc il reste exact après un rechargement.
 */
export function useOfferCountdown(): OfferCountdown {
  const [timeLeft, setTimeLeft] = useState<OfferCountdown>(() =>
    computeTimeLeft(getOfferDeadline())
  );

  useEffect(() => {
    const deadline = getOfferDeadline();
    const tick = () => setTimeLeft(computeTimeLeft(deadline));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

/**
 * Prix annuel à afficher selon l'état de l'offre : le prix « offre » remisé tant
 * qu'elle est active, sinon 12× le mensuel (le prix « standard », sans économie).
 */
export function yearlyStandardPrice(monthly: number): number {
  return +(monthly * 12).toFixed(2);
}

export function resolveYearlyPrice(
  monthly: number,
  yearlyOffer: number,
  offerActive: boolean
): number {
  return offerActive ? yearlyOffer : yearlyStandardPrice(monthly);
}

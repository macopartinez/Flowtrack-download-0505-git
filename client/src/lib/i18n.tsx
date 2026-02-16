import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    "nav.login": "Login",
    "nav.connect": "Connect account",
    "hero.title1": "Track",
    "hero.title2": "who unfollows you",
    "hero.desc": "Connect your Instagram or Facebook account and get real-time analytics on your audience growth and losses.",
    "hero.cta": "Connect your account",
    "hero.secure": "No password required • 100% Secure",
    "features.speed.title": "Real-time surveillance",
    "features.speed.desc": "Get notified when someone unfollows your account.",
    "features.insights.title": "Deep Analytics",
    "features.insights.desc": "Track and viewing your profile(s) with our advanced tools.",
    "features.security.title": "Account Safety",
    "features.security.desc": "We use official APIs and bank-grade encryption to keep your account 100% secure.",
    "cta.title1": "Ready to see",
    "cta.title2": "who's watching?",
    "cta.desc": "Join thousands of creators who already use Flowtrack to understand their audience and grow smarter.",
    "analytics.total": "TOTAL",
    "analytics.unfollowers": "Unfollowers",
    "analytics.followers": "New Followers",
    "analytics.blocked": "Blocked",
    "analytics.accounts": "Accounts list",
    "analytics.disclaimer": "*Simplified dashboard, not actual representative dashboard",
    "footer.rights": "All rights reserved."
  },
  fr: {
    "nav.login": "Connexion",
    "nav.connect": "Connecter un compte",
    "hero.title1": "Suivez",
    "hero.title2": "qui vous désabonne",
    "hero.desc": "Connectez votre compte Instagram ou Facebook et obtenez des analyses en temps réel sur la croissance et les pertes de votre audience.",
    "hero.cta": "Connecter votre compte",
    "hero.secure": "Aucun mot de passe requis • 100% Sécurisé",
    "features.speed.title": "Surveillance en temps réel",
    "features.speed.desc": "Soyez notifié dès que quelqu'un se désabonne de votre compte.",
    "features.insights.title": "Analyses Approfondies",
    "features.insights.desc": "Suivez et visualisez votre ou vos profils avec nos outils avancés.",
    "features.security.title": "Sécurité du Compte",
    "features.security.desc": "Nous utilisons les API officielles et un cryptage de niveau bancaire pour sécuriser votre compte à 100%.",
    "cta.title1": "Prêt à voir",
    "cta.title2": "qui vous suit ?",
    "cta.desc": "Rejoignez des milliers de créateurs qui utilisent déjà Flowtrack pour comprendre leur audience et progresser.",
    "analytics.total": "TOTAL",
    "analytics.unfollowers": "Désabonnements",
    "analytics.followers": "Nouveaux Suiveurs",
    "analytics.blocked": "Bloqués",
    "analytics.accounts": "Liste des comptes",
    "analytics.disclaimer": "*Tableau de bord simplifié, non représentatif du tableau de bord réel",
    "footer.rights": "Tous droits réservés."
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language");
      return (saved as Language) || "en";
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations["en"]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

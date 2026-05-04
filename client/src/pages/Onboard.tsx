import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GlassText } from "@/components/GlassText";
import { RadarBackground } from "@/components/RadarBackground";
import { BackgroundWaler } from "@/components/BackgroundWaler";
import { useAuth } from "@/hooks/use-auth";
import { Instagram, ArrowRight, ArrowLeft, Loader2, Mail, AtSign, Lock, X } from "lucide-react";
import { QUESTIONNAIRE_STEPS, QuestionnaireAnswers, UsageMode } from "@/types/questionnaire";
import { QuestionOption } from "@/components/questionnaire/QuestionOption";
import { QuestionScale } from "@/components/questionnaire/QuestionScale";
import { QuestionTextarea } from "@/components/questionnaire/QuestionTextarea";
import { QuestionCountry } from "@/components/questionnaire/QuestionCountry";
import { WarningBox } from "@/components/questionnaire/WarningBox";
import { UsageCard } from "@/components/questionnaire/UsageCard";
import { PaywallStep } from "@/components/PaywallStep";

// Nouveau flux: Questionnaire (0-10) → Username (11) → Vérification compte (12) → Follow Waler (13) → Code 6 chiffres (14) → PAYWALL (15) → Email (16) → Password (17) → Follow Agents (18)
const TOTAL_STEPS = 19;
const QUESTIONNAIRE_END = 10; // Summary
const USERNAME_STEP = 11;
const VERIFICATION_STEP = 12;
const FOLLOW_WALER_STEP = 13;
const CODE_VERIFICATION_STEP = 14;
const PAYWALL_STEP = 15;
const EMAIL_STEP = 16;
const PASSWORD_STEP = 17;
const FOLLOW_AGENTS_STEP = 18;

export default function Onboard() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [, setLocation] = useLocation();
  const { register, isRegistering } = useAuth();
  
  // Questionnaire state
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<QuestionnaireAnswers>({});
  const [usageMode, setUsageMode] = useState<UsageMode | null>(null);
  const [consent, setConsent] = useState(false);
  
  // Technical steps state
  const [platform, setPlatform] = useState<"instagram" | null>("instagram");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const topRef = useRef<HTMLDivElement>(null);
  
  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  
  // Follow Waler state
  const [hasFollowedWaler, setHasFollowedWaler] = useState(false);
  
  // Code verification state
  const [codeToSend, setCodeToSend] = useState(''); // Code que l'utilisateur doit envoyer à Waler (VERIFY-XXX)
  const [userCode, setUserCode] = useState(''); // Code à 6 chiffres que l'utilisateur entre
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCodeVerifying, setIsCodeVerifying] = useState(false);
  const [codeError, setCodeError] = useState('');
  
  // Follow agents state
  const [hasFollowedAgentA, setHasFollowedAgentA] = useState(false);
  const [hasFollowedAgentB, setHasFollowedAgentB] = useState(false);
  
  // Pricing state
  const [selectedPricingPlan, setSelectedPricingPlan] = useState<'premium' | 'pro' | null>(null);

  const isQuestionnairePhase = step <= QUESTIONNAIRE_END;

  // Scroll to top whenever step changes
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  // Reset country when continent changes
  useEffect(() => {
    if (questionnaireAnswers.continent && questionnaireAnswers.country) {
      setQuestionnaireAnswers(prev => ({ ...prev, country: undefined }));
    }
  }, [questionnaireAnswers.continent]);

  const updateAnswer = (questionId: string, value: any) => {
    setQuestionnaireAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const stepTitle = useMemo(() => {
    if (step <= QUESTIONNAIRE_END) {
      return QUESTIONNAIRE_STEPS[step]?.title || '';
    }
    if (step === USERNAME_STEP) return "What's your Instagram username?";
    if (step === VERIFICATION_STEP) return "Verifying your account...";
    if (step === FOLLOW_WALER_STEP) return "Follow @waler to continue";
    if (step === CODE_VERIFICATION_STEP) return "Verify your Instagram access";
    if (step === PAYWALL_STEP) return "Unlock your personalized insights";
    if (step === EMAIL_STEP) return "What's your email?";
    if (step === PASSWORD_STEP) return "Create a secure password";
    if (step === FOLLOW_AGENTS_STEP) return "Follow our agents";
    return '';
  }, [step]);

  const stepPhase = useMemo(() => {
    if (step <= QUESTIONNAIRE_END) {
      return QUESTIONNAIRE_STEPS[step]?.phase || '';
    }
    if (step === USERNAME_STEP) return 'Account Setup 1/7';
    if (step === VERIFICATION_STEP) return 'Verification 1/3';
    if (step === FOLLOW_WALER_STEP) return 'Verification 2/3';
    if (step === CODE_VERIFICATION_STEP) return 'Verification 3/3';
    if (step === PAYWALL_STEP) return 'Choose Your Plan';
    if (step === EMAIL_STEP) return 'Account Setup 2/7';
    if (step === PASSWORD_STEP) return 'Account Setup 3/7';
    if (step === FOLLOW_AGENTS_STEP) return 'Account Setup 4/7';
    return '';
  }, [step]);

  const canProceed = () => {
    // Questionnaire phase (steps 0-10)
    if (step === 0) return consent;
    if (step === 1) return usageMode !== null;
    if (step === 2) {
      return questionnaireAnswers.gender && questionnaireAnswers.age_range && questionnaireAnswers.country;
    }
    if (step === 3) {
      return questionnaireAnswers.q1 && questionnaireAnswers.q2;
    }
    if (step === 4) {
      return questionnaireAnswers.q2_pattern;
    }
    if (step === 5) {
      return questionnaireAnswers.q3 && questionnaireAnswers.q4 && questionnaireAnswers.q5 && questionnaireAnswers.q5_last_interaction;
    }
    if (step === 6) {
      return questionnaireAnswers.q6 && questionnaireAnswers.q6_responsibility;
    }
    if (step === 7) {
      return questionnaireAnswers.q7 && questionnaireAnswers.q8;
    }
    if (step === 8) {
      return questionnaireAnswers.q9_hope && questionnaireAnswers.q9_reflection_frequency;
    }
    if (step === 9) {
      return questionnaireAnswers.q10_motivation;
    }
    if (step === 10) return true; // Summary page
    
    // Username step (11)
    if (step === USERNAME_STEP) return username.trim().length > 0;
    
    // Verification step (12)
    if (step === VERIFICATION_STEP) return verificationStatus === 'success';
    
    // Follow Waler step (13)
    if (step === FOLLOW_WALER_STEP) return hasFollowedWaler;
    
    // Code verification step (14)
    if (step === CODE_VERIFICATION_STEP) return userCode.length === 6;
    
    // Paywall step (15) - MUST select a plan to proceed
    if (step === PAYWALL_STEP) return selectedPricingPlan !== null;
    
    // Email step (16)
    if (step === EMAIL_STEP) return email.trim().length > 0 && email.includes("@");
    
    // Password step (17)
    if (step === PASSWORD_STEP) return password.trim().length >= 8;
    
    // Follow agents step (18)
    if (step === FOLLOW_AGENTS_STEP) return hasFollowedAgentA && hasFollowedAgentB;
    
    return false;
  };

  const verifyInstagramAccount = async () => {
    setVerificationStatus('checking');
    setVerificationMessage('Checking if account exists...');
    
    try {
      // Simuler une vérification (à remplacer par vraie API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Appeler API pour vérifier le compte Instagram
      // const response = await fetch(`/api/instagram/verify/${username}`);
      // const data = await response.json();
      
      // Pour l'instant, on simule le succès
      const accountExists = true; // Remplacer par vraie vérification
      
      if (accountExists) {
        setVerificationStatus('success');
        setVerificationMessage(`Account @${username} verified!`);
      } else {
        setVerificationStatus('error');
        setVerificationMessage(`Account @${username} not found`);
      }
    } catch (error) {
      setVerificationStatus('error');
      setVerificationMessage('Verification failed. Please try again.');
    }
  };

  const generateCodeToSend = async () => {
    setIsGeneratingCode(true);
    setCodeError('');
    
    try {
      // Appeler l'API pour générer le code que l'utilisateur doit envoyer
      const response = await fetch('/api/verification/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagramUsername: username })
      });
      
      const data = await response.json();
      
      if (data.success && data.codeToSend) {
        setCodeToSend(data.codeToSend);
      } else {
        setCodeError('Failed to generate code. Please try again.');
      }
    } catch (error) {
      setCodeError('Network error. Please check your connection.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const verifyCode = async () => {
    if (userCode.length !== 6) return;
    
    setIsCodeVerifying(true);
    setCodeError('');
    
    try {
      const response = await fetch('/api/verification/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code: userCode })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        // Code valide, on peut continuer
        setDirection(1);
        setStep(prev => prev + 1);
      } else {
        setCodeError('Invalid code. Please try again.');
        setUserCode('');
      }
    } catch (error) {
      setCodeError('Verification failed. Please try again.');
    } finally {
      setIsCodeVerifying(false);
    }
  };

  const goNext = async () => {
    if (!canProceed()) return;
    
    // Si on passe de username à verification, lancer la vérification
    if (step === USERNAME_STEP) {
      setDirection(1);
      setStep(prev => prev + 1);
      // Lancer la vérification après le changement d'étape
      setTimeout(() => verifyInstagramAccount(), 300);
      return;
    }
    
    // Si on passe de verification à follow Waler, générer le code immédiatement
    if (step === VERIFICATION_STEP) {
      setDirection(1);
      setStep(prev => prev + 1);
      // Générer le code dès qu'on arrive sur Follow Waler
      setTimeout(() => generateCodeToSend(), 300);
      return;
    }
    
    // Si on passe de follow Waler à code verification, juste continuer
    if (step === FOLLOW_WALER_STEP) {
      setDirection(1);
      setStep(prev => prev + 1);
      return;
    }
    
    // Si on est à l'étape de vérification du code, vérifier le code
    if (step === CODE_VERIFICATION_STEP) {
      verifyCode();
      return;
    }
    
    // Si on est à l'étape password, créer le compte
    if (step === PASSWORD_STEP) {
      handleSubmit();
      return;
    }
    
    // Si on est à l'étape follow agents (dernière étape), terminer et aller au dashboard
    if (step === FOLLOW_AGENTS_STEP) {
      // Attendre un peu pour que la session soit bien établie
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Récupérer l'utilisateur connecté et rediriger vers son dashboard
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        console.log("Auth check response status:", res.status);
        
        if (!res.ok) {
          console.error("Auth check failed:", res.status, res.statusText);
          // Essayer de récupérer depuis le localStorage comme fallback
          const lastUserId = localStorage.getItem('lastUserId');
          if (lastUserId) {
            console.log("Using lastUserId from localStorage:", lastUserId);
            setLocation(`/dashboard/${lastUserId}`);
          } else {
            setLocation("/");
          }
          return;
        }
        
        const user = await res.json();
        console.log("User from auth check:", user);
        
        if (user && user.id) {
          // Sauvegarder l'ID pour référence future
          localStorage.setItem('lastUserId', user.id.toString());
          // Rediriger vers le dashboard de l'utilisateur
          setLocation(`/dashboard/${user.id}`);
        } else {
          console.error("No user or user.id in response");
          setLocation("/");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Essayer de récupérer depuis le localStorage comme fallback
        const lastUserId = localStorage.getItem('lastUserId');
        if (lastUserId) {
          console.log("Using lastUserId from localStorage after error:", lastUserId);
          setLocation(`/dashboard/${lastUserId}`);
        } else {
          setLocation("/");
        }
      }
      return;
    }
    
    setDirection(1);
    setStep(prev => prev + 1);
  };

  const goBack = () => {
    if (step === 0) {
      setLocation("/");
      return;
    }
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!platform || !username || !email || !password) {
      console.error("Missing required fields:", { platform, username, email, password: password ? "***" : null });
      return;
    }
    
    // SECURITY: Verify that a plan was selected before allowing account creation
    if (!selectedPricingPlan) {
      console.error("Cannot create account without selecting a pricing plan");
      setDirection(-1);
      setStep(PAYWALL_STEP);
      return;
    }
    
    console.log("Registering with:", { username, email, platform, usageMode });
    
    try {
      // Créer le compte avec le plan sélectionné
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username, 
          email, 
          password, 
          platform,
          usageMode: usageMode || 'personal',
          selectedPlan: selectedPricingPlan
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Registration failed:", error);
        alert(error.error || "Registration failed");
        return;
      }
      
      const data = await response.json();
      console.log("Registration successful:", data);
      
      // Sauvegarder l'ID utilisateur dans localStorage
      if (data.user && data.user.id) {
        localStorage.setItem('lastUserId', data.user.id.toString());
        console.log("Saved user ID to localStorage:", data.user.id);
      }
      
      // Déclencher le follow automatique des agents
      try {
        await fetch('/api/agents/follow-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instagramUsername: username })
        });
        console.log('Agents will follow user');
      } catch (error) {
        console.error('Error triggering agent follows:', error);
      }
      
      // Attendre un peu pour que le compte soit créé
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Aller à l'étape follow agents
      setDirection(1);
      setStep(FOLLOW_AGENTS_STEP);
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goNext();
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div ref={topRef} className="min-h-screen w-full bg-[#0a0a0a] relative font-body text-white">
      <RadarBackground />
      <BackgroundWaler />

      <nav className="fixed w-full top-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => setLocation("/")} style={{ position: 'absolute', left: '15px', top: '15px' }} data-testid="link-home">
            <GlassText text="WALER" fontSize={36} />
          </button>
        </div>
      </nav>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-32">
        <div className="w-full max-w-3xl my-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                {stepPhase}
              </span>
              <span className="text-xs text-gray-500">
                {step + 1} / {TOTAL_STEPS}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    flex: i === step ? 2 : 1,
                    backgroundColor: i <= step 
                      ? (i <= QUESTIONNAIRE_END ? "#3b82f6" : "#02c950")
                      : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <h1
                className="text-3xl md:text-5xl font-display font-black text-center mb-4 tracking-tight text-white"
                data-testid="onboard-question"
              >
                {stepTitle}
              </h1>
              
              {(isQuestionnairePhase && QUESTIONNAIRE_STEPS[step]?.subtitle) && (
                <p className="text-center text-gray-400 mb-12 max-w-2xl">
                  {QUESTIONNAIRE_STEPS[step].subtitle}
                </p>
              )}

              {/* QUESTIONNAIRE STEPS */}
              {step === 0 && (
                <div className="w-full max-w-2xl space-y-6">
                  {QUESTIONNAIRE_STEPS[0].warningBoxes?.map((warning, i) => (
                    <WarningBox key={i} warning={warning} />
                  ))}
                  <div
                    onClick={() => setConsent(!consent)}
                    className="flex items-start gap-4 p-5 rounded-xl bg-[#1a1a1a] border border-white/30 cursor-pointer hover:bg-[#222222] hover:border-white/40 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded accent-[#02c950] cursor-pointer"
                    />
                    <span className="text-sm text-gray-300 leading-relaxed">
                      I understand that this questionnaire is a space for personal reflection. I commit to using it with kindness toward myself and others.
                    </span>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-4xl">
                  <UsageCard
                    mode="personal"
                    selected={usageMode === 'personal'}
                    onClick={() => setUsageMode('personal')}
                  />
                  <UsageCard
                    mode="professional"
                    selected={usageMode === 'professional'}
                    onClick={() => setUsageMode('professional')}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="w-full max-w-2xl space-y-8">
                  {QUESTIONNAIRE_STEPS[2].questions.map((q) => (
                    <div key={q.id} className="space-y-4">
                      <label className="block text-base font-medium text-white">{q.label}</label>
                      {q.type === 'country' ? (
                        <QuestionCountry
                          value={questionnaireAnswers[q.id] as string}
                          onChange={(value) => updateAnswer(q.id, value)}
                          continent={questionnaireAnswers.continent as string}
                          label={q.label}
                          required={q.required}
                        />
                      ) : (
                        <div className="space-y-2">
                          {q.options?.map((opt, i) => (
                            <QuestionOption
                              key={i}
                              option={opt}
                              selected={questionnaireAnswers[q.id] === (typeof opt === 'string' ? opt : opt.main)}
                              onClick={() => updateAnswer(q.id, typeof opt === 'string' ? opt : opt.main)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="w-full max-w-2xl space-y-8">
                  {QUESTIONNAIRE_STEPS[3].questions.map((q) => (
                    <div key={q.id} className="space-y-4">
                      <label className="block text-base font-medium text-white">{q.label}</label>
                      {q.type === 'options' && (
                        <div className="space-y-2">
                          {q.options?.map((opt, i) => (
                            <QuestionOption
                              key={i}
                              option={opt}
                              selected={questionnaireAnswers[q.id] === (typeof opt === 'string' ? opt : opt.main)}
                              onClick={() => updateAnswer(q.id, typeof opt === 'string' ? opt : opt.main)}
                            />
                          ))}
                        </div>
                      )}
                      {q.type === 'scale' && (
                        <QuestionScale
                          steps={q.scaleSteps || 5}
                          minLabel={q.scaleMin || ''}
                          maxLabel={q.scaleMax || ''}
                          selected={questionnaireAnswers[q.id] as number || null}
                          onSelect={(value) => updateAnswer(q.id, value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="w-full max-w-2xl space-y-8">
                  {QUESTIONNAIRE_STEPS[4].questions.map((q) => (
                    <div key={q.id} className="space-y-4">
                      <label className="block text-base font-medium text-white">{q.label}</label>
                      {q.type === 'textarea' && (
                        <QuestionTextarea
                          value={(questionnaireAnswers[q.id] as string) || ''}
                          onChange={(value) => updateAnswer(q.id, value)}
                          placeholder={q.placeholder}
                          hint={q.hint}
                        />
                      )}
                      {q.type === 'options' && (
                        <div className="space-y-2">
                          {q.options?.map((opt, i) => (
                            <QuestionOption
                              key={i}
                              option={opt}
                              selected={questionnaireAnswers[q.id] === opt}
                              onClick={() => updateAnswer(q.id, opt)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="w-full max-w-2xl space-y-8">
                  {QUESTIONNAIRE_STEPS[5].questions.map((q) => (
                    <div key={q.id} className="space-y-4">
                      <label className="block text-base font-medium text-white">{q.label}</label>
                      <div className="space-y-2">
                        {q.options?.map((opt, i) => (
                          <QuestionOption
                            key={i}
                            option={opt}
                            selected={questionnaireAnswers[q.id] === (typeof opt === 'string' ? opt : opt.main)}
                            onClick={() => updateAnswer(q.id, typeof opt === 'string' ? opt : opt.main)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 6 && (
                <div className="w-full max-w-2xl space-y-8">
                  {QUESTIONNAIRE_STEPS[6].questions.map((q) => (
                    <div key={q.id} className="space-y-4">
                      <label className="block text-base font-medium text-white">{q.label}</label>
                      {q.type === 'textarea' && (
                        <QuestionTextarea
                          value={(questionnaireAnswers[q.id] as string) || ''}
                          onChange={(value) => updateAnswer(q.id, value)}
                          placeholder={q.placeholder}
                        />
                      )}
                      {q.type === 'options' && (
                        <div className="space-y-2">
                          {q.options?.map((opt, i) => (
                            <QuestionOption
                              key={i}
                              option={opt}
                              selected={questionnaireAnswers[q.id] === opt}
                              onClick={() => updateAnswer(q.id, opt)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Generic renderer for steps 7-10 (The signal, The Future, Engagement, Summary) */}
              {step >= 7 && step <= 10 && (
                <div className="w-full max-w-2xl space-y-8">
                  {step === 10 && (
                    <>
                      <div className="inline-block px-4 py-1.5 rounded-full bg-[#1a1a1a] border border-white/30 text-sm mb-6">
                        {usageMode === 'personal' ? 'Personal use' : 'Professional use'}
                      </div>
                      
                      <div className="bg-[#1a1a1a] border border-white/30 rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">What you've done</h3>
                        <p className="text-gray-300 leading-relaxed">
                          You've taken a step back from a painful situation, and asked yourself the fundamental question: <em className="text-white font-medium">who am I in this relationship?</em> This isn't about guilt — it's about understanding.
                        </p>
                      </div>

                      <div className="bg-[#1a1a1a] border border-white/30 rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Next step</h3>
                        <p className="text-gray-300 leading-relaxed">
                          Now that you've reflected on your situation, let's create your Waler account to help you track your relationships in a healthy and caring way.
                        </p>
                      </div>
                    </>
                  )}
                  
                  {step !== 10 && QUESTIONNAIRE_STEPS[step]?.questions.map((q) => (
                    <div key={q.id} className="space-y-4">
                      <label className="block text-base font-medium text-white">{q.label}</label>
                      {q.hint && q.type !== 'textarea' && <p className="text-sm text-gray-400 -mt-2">{q.hint}</p>}
                      
                      {q.type === 'textarea' && (
                        <QuestionTextarea
                          value={(questionnaireAnswers[q.id] as string) || ''}
                          onChange={(value) => updateAnswer(q.id, value)}
                          placeholder={q.placeholder}
                          hint={q.hint}
                        />
                      )}
                      
                      {q.type === 'options' && (
                        <div className="space-y-2">
                          {q.options?.map((opt, i) => (
                            <QuestionOption
                              key={i}
                              option={opt}
                              selected={questionnaireAnswers[q.id] === (typeof opt === 'string' ? opt : opt.main)}
                              onClick={() => updateAnswer(q.id, typeof opt === 'string' ? opt : opt.main)}
                            />
                          ))}
                        </div>
                      )}
                      
                      {q.type === 'scale' && (
                        <QuestionScale
                          steps={q.scaleSteps || 5}
                          minLabel={q.scaleMin || ''}
                          maxLabel={q.scaleMax || ''}
                          selected={questionnaireAnswers[q.id] as number || null}
                          onSelect={(value) => updateAnswer(q.id, value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 11: Username */}
              {step === USERNAME_STEP && (
                <div className="w-full max-w-md">
                  <div className="relative">
                    <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="your_username"
                      autoFocus
                      className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/5 border border-white/10 text-white text-lg placeholder:text-gray-600 focus:outline-none focus:border-[#02c950] focus:shadow-[0_0_30px_rgba(2,201,80,0.15)] transition-all"
                      data-testid="input-username"
                    />
                  </div>
                </div>
              )}

              {/* Step 12: Verification */}
              {step === VERIFICATION_STEP && (
                <div className="w-full max-w-md space-y-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    {verificationStatus === 'checking' && (
                      <>
                        <Loader2 className="w-16 h-16 text-[#02c950] animate-spin mb-6" />
                        <p className="text-gray-400 text-lg">{verificationMessage}</p>
                      </>
                    )}
                    
                    {verificationStatus === 'success' && (
                      <>
                        <div className="w-20 h-20 rounded-full bg-[#02c950]/20 flex items-center justify-center mb-6">
                          <Instagram className="w-10 h-10 text-[#02c950]" />
                        </div>
                        <p className="text-white text-xl font-bold mb-2">Account Verified!</p>
                        <p className="text-gray-400 text-center">{verificationMessage}</p>
                      </>
                    )}
                    
                    {verificationStatus === 'error' && (
                      <>
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                          <X className="w-10 h-10 text-red-500" />
                        </div>
                        <p className="text-white text-xl font-bold mb-2">Verification Failed</p>
                        <p className="text-gray-400 text-center mb-6">{verificationMessage}</p>
                        <button
                          onClick={() => {
                            setDirection(-1);
                            setStep(USERNAME_STEP);
                            setVerificationStatus('idle');
                          }}
                          className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                        >
                          Try Again
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Step 13: Follow Waler */}
              {step === FOLLOW_WALER_STEP && (
                <div className="w-full max-w-md space-y-6">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#02c950] to-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(2,201,80,0.3)]">
                        <Instagram className="w-12 h-12 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-3">
                        Follow @waler to receive your code
                      </h3>
                      
                      <p className="text-gray-400 mb-6">
                        You need to follow our verification account to receive the 6-digit code via Direct Message.
                      </p>
                      
                      {isGeneratingCode ? (
                        <div className="flex items-center justify-center py-8 mb-6">
                          <Loader2 className="w-8 h-8 text-[#02c950] animate-spin" />
                          <p className="ml-3 text-gray-400">Generating your code...</p>
                        </div>
                      ) : codeToSend ? (
                        <div className="w-full bg-[#02c950]/10 border border-[#02c950]/30 rounded-xl p-4 mb-6 space-y-3">
                          <p className="text-sm text-gray-300">
                            🔑 <strong>Your verification code:</strong>
                          </p>
                          <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                            <code className="text-[#02c950] text-xl font-bold font-mono">{codeToSend}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(codeToSend);
                              }}
                              className="px-4 py-2 rounded-lg bg-[#02c950] text-black text-sm font-bold hover:bg-[#02d955] transition-all"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-sm text-gray-300">
                            <strong>Step 1:</strong> Follow @waler
                          </p>
                          <p className="text-sm text-gray-300">
                            <strong>Step 2:</strong> Send this code to @waler via DM
                          </p>
                          <p className="text-sm text-gray-300">
                            <strong>Step 3:</strong> You'll receive a 6-digit code
                          </p>
                        </div>
                      ) : (
                        <div className="w-full bg-[#02c950]/10 border border-[#02c950]/30 rounded-xl p-4 mb-6">
                          <p className="text-sm text-gray-300 mb-2">
                            <strong>Step 1:</strong> Click the button below to open @waler profile
                          </p>
                          <p className="text-sm text-gray-300 mb-2">
                            <strong>Step 2:</strong> Click "Follow" on the profile
                          </p>
                          <p className="text-sm text-gray-300">
                            <strong>Step 3:</strong> Come back here and confirm
                          </p>
                        </div>
                      )}
                      
                      <a
                        href={`https://www.instagram.com/${import.meta.env.VITE_WALER_INSTAGRAM_USER || 'waler'}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#02c950] to-emerald-500 hover:from-[#02d955] hover:to-emerald-600 text-white font-bold transition-all flex items-center justify-center gap-3 mb-4 shadow-[0_0_20px_rgba(2,201,80,0.3)]"
                      >
                        <Instagram className="w-5 h-5" />
                        Open @waler Profile
                      </a>
                      
                      <div className="w-full border-t border-white/10 pt-6">
                        <label className="flex items-center justify-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={hasFollowedWaler}
                            onChange={(e) => setHasFollowedWaler(e.target.checked)}
                            className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-[#02c950] checked:border-[#02c950] transition-all cursor-pointer"
                          />
                          <span className="text-white font-medium group-hover:text-[#02c950] transition-colors">
                            I have followed @waler
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-center text-gray-500 text-sm">
                    Tip: Make sure you're logged into Instagram before clicking the button
                  </p>
                </div>
              )}

              {/* Step 14: Code Verification */}
              {step === CODE_VERIFICATION_STEP && (
                <div className="w-full max-w-md space-y-6">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Instagram className="w-6 h-6 text-[#02c950]" />
                      <div>
                        <p className="text-white font-bold">Send a message to @waler</p>
                        <p className="text-gray-400 text-sm">We'll send you a 6-digit code</p>
                      </div>
                    </div>
                    
                    {isGeneratingCode ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-[#02c950] animate-spin" />
                        <p className="ml-3 text-gray-400">Generating your code...</p>
                      </div>
                    ) : codeToSend ? (
                      <>
                        <div className="bg-[#02c950]/10 border border-[#02c950]/30 rounded-xl p-4 space-y-3">
                          <p className="text-sm text-gray-300">
                            <strong>Step 1:</strong> Copy this code:
                          </p>
                          <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                            <code className="text-[#02c950] text-xl font-bold font-mono">{codeToSend}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(codeToSend);
                              }}
                              className="px-4 py-2 rounded-lg bg-[#02c950] text-black text-sm font-bold hover:bg-[#02d955] transition-all"
                            >
                              Copy
                            </button>
                          </div>
                          <p className="text-sm text-gray-300">
                            <strong>Step 2:</strong> Send this code to <strong className="text-[#02c950]">@waler.web</strong> on Instagram
                          </p>
                          <p className="text-sm text-gray-300">
                            <strong>Step 3:</strong> You'll receive a 6-digit code in response
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-400">
                            Enter the 6-digit code you received:
                          </label>
                          <input
                            type="text"
                            value={userCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setUserCode(value);
                              setCodeError('');
                            }}
                            placeholder="000000"
                            maxLength={6}
                            className="w-full px-6 py-5 rounded-2xl bg-white/5 border border-white/10 text-white text-2xl font-mono text-center tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-[#02c950] focus:shadow-[0_0_30px_rgba(2,201,80,0.15)] transition-all"
                          />
                          
                          {codeError && (
                            <p className="text-red-400 text-sm text-center">{codeError}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">Generating your verification code...</p>
                      </div>
                    )}
                  </div>
                  
                  <a
                    href={`https://www.instagram.com/direct/t/${import.meta.env.VITE_WALER_INSTAGRAM_USER || 'waler.web'}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-gradient-to-r from-[#02c950] to-emerald-500 hover:from-[#02d955] hover:to-emerald-600 text-white font-bold transition-all shadow-[0_0_20px_rgba(2,201,80,0.3)]"
                  >
                    <Instagram className="w-5 h-5" />
                    Open Chat with @waler
                  </a>
                </div>
              )}

              {/* Step 15: PAYWALL */}
              {step === PAYWALL_STEP && (
                <PaywallStep
                  answers={questionnaireAnswers}
                  selectedPlan={selectedPricingPlan}
                  onPlanSelect={(planId) => setSelectedPricingPlan(planId)}
                  usageMode={usageMode}
                />
              )}

              {/* Step 15: Email */}
              {step === EMAIL_STEP && (
                <div className="w-full max-w-md">
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="email@example.com"
                      autoFocus
                      className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/5 border border-white/10 text-white text-lg placeholder:text-gray-600 focus:outline-none focus:border-[#02c950] focus:shadow-[0_0_30px_rgba(2,201,80,0.15)] transition-all"
                      data-testid="input-email"
                    />
                  </div>
                </div>
              )}

              {/* Step 17: Password */}
              {step === PASSWORD_STEP && (
                <div className="w-full max-w-md">
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="••••••••"
                      autoFocus
                      minLength={8}
                      className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/5 border border-white/10 text-white text-lg placeholder:text-gray-600 focus:outline-none focus:border-[#02c950] focus:shadow-[0_0_30px_rgba(2,201,80,0.15)] transition-all"
                      data-testid="input-password"
                    />
                  </div>
                  <p className="text-gray-500 text-sm mt-3 text-center">Minimum 8 characters</p>
                </div>
              )}

              {/* Step 18: Follow Agents */}
              {step === FOLLOW_AGENTS_STEP && (
                <div className="w-full max-w-2xl space-y-6">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#02c950] to-[#02a040] flex items-center justify-center">
                        <Instagram className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3 text-center">
                      Follow our tracking agents
                    </h3>
                    
                    <p className="text-gray-400 mb-8 text-center">
                      Our agents will follow you back and start tracking your Instagram activity
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      {/* Agent A */}
                      <div className="bg-[#02c950]/10 border border-[#02c950]/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">A</span>
                          </div>
                          <div>
                            <p className="text-white font-bold">Agent A</p>
                            <p className="text-gray-400 text-sm">@{import.meta.env.VITE_AGENT_A_INSTAGRAM_USER || 'agent_a'}</p>
                          </div>
                        </div>
                        <a
                          href={`https://www.instagram.com/${import.meta.env.VITE_AGENT_A_INSTAGRAM_USER || 'agent_a'}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Instagram className="w-4 h-4" />
                          Follow Agent A
                        </a>
                        <label className="flex items-center gap-2 mt-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasFollowedAgentA}
                            onChange={(e) => setHasFollowedAgentA(e.target.checked)}
                            className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-[#02c950] checked:border-[#02c950] transition-all cursor-pointer"
                          />
                          <span className="text-gray-400 text-sm">I followed Agent A</span>
                        </label>
                      </div>

                      {/* Agent B */}
                      <div className="bg-[#02c950]/10 border border-[#02c950]/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">B</span>
                          </div>
                          <div>
                            <p className="text-white font-bold">Agent B</p>
                            <p className="text-gray-400 text-sm">@{import.meta.env.VITE_AGENT_B_INSTAGRAM_USER || 'agent_b'}</p>
                          </div>
                        </div>
                        <a
                          href={`https://www.instagram.com/${import.meta.env.VITE_AGENT_B_INSTAGRAM_USER || 'agent_b'}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Instagram className="w-4 h-4" />
                          Follow Agent B
                        </a>
                        <label className="flex items-center gap-2 mt-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasFollowedAgentB}
                            onChange={(e) => setHasFollowedAgentB(e.target.checked)}
                            className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-[#02c950] checked:border-[#02c950] transition-all cursor-pointer"
                          />
                          <span className="text-gray-400 text-sm">I followed Agent B</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <p className="text-sm text-blue-300 text-center">
                        Our agents will automatically follow you back within a few minutes
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-12 w-full max-w-md mx-auto">
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-gray-400 hover:text-white transition-colors"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={goNext}
              disabled={!canProceed() || isRegistering}
              className={`flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold transition-all duration-300 ${
                canProceed()
                  ? "bg-[#02c950] text-black shadow-[0_0_30px_rgba(2,201,80,0.4)] hover:shadow-[0_0_40px_rgba(2,201,80,0.6)]"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              }`}
              data-testid="button-next"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : step === 11 ? (
                <>
                  Start Tracking
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}

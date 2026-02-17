import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GlassText } from "@/components/GlassText";
import { RadarBackground } from "@/components/RadarBackground";
import { BackgroundFlowtrack } from "@/components/BackgroundFlowtrack";
import { useConnectAccount } from "@/hooks/use-flowtrack";
import { Instagram, Facebook, ArrowRight, ArrowLeft, Loader2, Mail, AtSign } from "lucide-react";

const steps = [
  { id: "platform", title: "Which platform do you use?" },
  { id: "username", title: "What's your username?" },
  { id: "email", title: "What's your email?" },
];

export default function Onboard() {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<"instagram" | "facebook" | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [direction, setDirection] = useState(1);
  const { mutate: connect, isPending } = useConnectAccount();
  const [, setLocation] = useLocation();

  const canProceed = () => {
    if (step === 0) return platform !== null;
    if (step === 1) return username.trim().length > 0;
    if (step === 2) return email.trim().length > 0 && email.includes("@");
    return false;
  };

  const goNext = () => {
    if (!canProceed()) return;
    if (step === 2) {
      handleSubmit();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) {
      setLocation("/");
      return;
    }
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    if (!platform || !username || !email) return;
    connect(
      { username, email, platform },
      {
        onSuccess: (user) => {
          setLocation(`/dashboard/${user.id}`);
        },
      }
    );
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
    <div className="h-screen w-full bg-[#0a0a0a] relative overflow-hidden font-body text-white">
      <RadarBackground />
      <BackgroundFlowtrack />

      <nav className="fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => setLocation("/")} data-testid="link-home">
            <GlassText text="FLOWTRACK" fontSize={36} />
          </button>
        </div>
      </nav>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-3 mb-12 justify-center">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: i === step ? 48 : 24,
                  backgroundColor: i <= step ? "#02c950" : "rgba(255,255,255,0.1)",
                }}
                data-testid={`progress-step-${i}`}
              />
            ))}
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
                className="text-3xl md:text-5xl font-display font-black text-center mb-12 tracking-tight text-white"
                data-testid="onboard-question"
              >
                {steps[step].title}
              </h1>

              {step === 0 && (
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <button
                    onClick={() => setPlatform("instagram")}
                    className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-lg font-bold transition-all duration-300 border ${
                      platform === "instagram"
                        ? "bg-[#02c950]/15 border-[#02c950] shadow-[0_0_30px_rgba(2,201,80,0.2)] text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                    }`}
                    data-testid="button-platform-instagram"
                  >
                    <Instagram className="w-6 h-6" />
                    Instagram
                  </button>
                  <button
                    onClick={() => setPlatform("facebook")}
                    className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-lg font-bold transition-all duration-300 border ${
                      platform === "facebook"
                        ? "bg-[#02c950]/15 border-[#02c950] shadow-[0_0_30px_rgba(2,201,80,0.2)] text-white"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                    }`}
                    data-testid="button-platform-facebook"
                  >
                    <Facebook className="w-6 h-6" />
                    Facebook
                  </button>
                </div>
              )}

              {step === 1 && (
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

              {step === 2 && (
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
              disabled={!canProceed() || isPending}
              className={`flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold transition-all duration-300 ${
                canProceed()
                  ? "bg-[#02c950] text-black shadow-[0_0_30px_rgba(2,201,80,0.4)] hover:shadow-[0_0_40px_rgba(2,201,80,0.6)]"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              }`}
              data-testid="button-next"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : step === 2 ? (
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

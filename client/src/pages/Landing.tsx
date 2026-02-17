import { ConnectDialog } from "@/components/ConnectDialog";
import { RadarBackground } from "@/components/RadarBackground";
import { BackgroundFlowtrack } from "@/components/BackgroundFlowtrack";
import { GlassText } from "@/components/GlassText";
import { motion } from "framer-motion";
import { BarChart3, ShieldCheck, Zap, Eye, Search, Lock, ChevronDown, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnalyticsPreview } from "@/components/AnalyticsPreview";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function PhoneNotification() {
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const CYCLE = 10000;
    const FIRST_NOTIF = 7000;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    function injectNotification() {
      const screen = screenRef.current;
      if (!screen) return;

      const existing = screen.querySelector('.phone-notif');
      if (existing) existing.remove();

      const notif = document.createElement('div');
      notif.className = 'phone-notif';
      notif.innerHTML = `
        <div style="display:flex;align-items:center;margin-bottom:4px">
          <div style="font-size:14px;font-weight:600;color:#000;letter-spacing:-0.2px">Flowtrack</div>
        </div>
        <div style="font-size:14px;color:#000;line-height:1.3;font-weight:400">
          <strong style="font-weight:600">Thomas_95</strong> unfollow you on instagram
        </div>
      `;
      screen.appendChild(notif);
    }

    const timeout = setTimeout(() => {
      injectNotification();
      intervalId = setInterval(injectNotification, CYCLE);
    }, FIRST_NOTIF);

    return () => {
      clearTimeout(timeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="phone-screen w-full h-full bg-gradient-to-b from-[#2d9f5e] to-[#1e7a42] rounded-[32px] relative overflow-hidden" ref={screenRef}>
      <div className="phone-notch absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-b-2xl z-[2]" />
      <div className="clock absolute top-16 left-1/2 -translate-x-1/2 text-5xl font-light text-black/90">12:05</div>
    </div>
  );
}

export default function Landing() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-transparent font-body text-white relative" data-testid="scroll-container">
      <RadarBackground />
      <BackgroundFlowtrack />
      <ConnectDialog isOpen={isOpen} setIsOpen={setIsOpen} />
      <nav className="fixed w-full top-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlassText text="FLOWTRACK" fontSize={36} />
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsOpen(true)}
              className="text-sm font-bold text-white hover:text-white/80 transition-colors" 
              data-testid="button-login"
            >
              Login
            </button>
          </div>
        </div>
      </nav>
      <section className="h-screen snap-start snap-always flex items-center justify-center relative px-6" data-testid="section-hero">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl font-display font-black leading-[1] mb-8 text-white tracking-tighter">
              The ultimate tracking tool <br />
              <span className="text-gradient">for a better relationship.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Don't just track numbers. Start seeing faces, know exactly who stays and who fades
            </p>
            <div className="flex items-center justify-center">
              <div className="scale-110">
                <button 
                  onClick={() => setIsOpen(true)}
                  className="text-base px-8 py-4 rounded-full transition-all duration-300 bg-[#02c950]/20 backdrop-blur-md border border-white/20 hover:shadow-[0_0_20px_rgba(2,201,80,0.4)] hover:bg-[#02c950]/30 font-bold text-white flex items-center gap-2"
                >
                  Start Tracking Free <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="h-screen snap-start snap-always flex items-center justify-center relative px-6" data-testid="section-how-it-works">
        <div className="max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
                How it <span className="text-gradient">works</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto text-[#ffffff]">Three simple steps to start tracking your follower.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Connect",
                  desc: "Connect your Instagram or Facebook account and add your email to link them securely.",
                  icon: Eye
                },
                {
                  step: "02",
                  title: "Track",
                  desc: "Our system in real time detecting every change between your followers and your account.",
                  icon: BarChart3
                },
                {
                  step: "03",
                  title: "Analyze",
                  desc: "Access detailed analytics and insights to understand your audience behavior.",
                  icon: Zap
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6 }}
                  className="text-center"
                  data-testid={`step-${i}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <item.icon className="w-7 h-7 text-green-400" />
                  </div>
                  <div className="text-sm font-bold text-green-400 mb-2 tracking-widest">{item.step}</div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                  <p className="leading-relaxed max-w-xs mx-auto text-[#ffffff]">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      <section className="h-screen snap-start snap-always relative overflow-hidden group/features" data-testid="section-features">
        <motion.div 
          className="absolute inset-0 bg-black/40 pointer-events-none z-[5] transition-all duration-1000"
          style={{
            backdropFilter: "blur(var(--blur-amount, 0px))"
          }}
          whileInView={{ "--blur-amount": "12px" } as any}
          viewport={{ margin: "-20% 0px -20% 0px" }}
        />
        
        {/* Nested snap container */}
        <div className="h-full overflow-y-auto snap-y snap-mandatory relative z-10 scrollbar-hide">
          {[
            {
              icon: Search,
              title: "Real-time surveillance",
              desc: "Get notified when someone unfollows your account.",
              color: "text-purple-400",
              tag: "SPEED",
              animation: true
            },
            {
              icon: BarChart3,
              title: "Deep Analytics",
              desc: "Track and viewing your profile(s) with our advanced tools.",
              color: "text-green-400",
              tag: "INSIGHTS",
              preview: true
            },
            {
              icon: Lock,
              title: "Account Safety",
              desc: "We use official APIs and bank-grade encryption to keep your account 100% secure. Privacy guaranteed, no intrusion.",
              color: "text-green-400",
              tag: "SECURITY"
            }
          ].map((feature, i) => (
            <div key={i} className="h-screen snap-start snap-always flex items-center justify-center px-6">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
              >
                {feature.preview ? (
                  <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
                    <AnalyticsPreview />
                  </div>
                ) : feature.animation ? (
                  <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
                    <div className="container relative w-[600px] h-[600px] flex items-center justify-center">
                      {/* Orbites décoratives */}
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[350px] h-[350px] border border-white/5 rounded-full pointer-events-none"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[450px] h-[450px] border border-white/5 rounded-full pointer-events-none"
                      />

                      {/* Téléphone */}
                      <div className="phone relative w-[240px] h-[500px] bg-[#1a1a1a] rounded-[40px] p-2 border-[6px] border-[#2d2d2d] z-[100] shadow-2xl overflow-hidden">
                        <PhoneNotification />
                      </div>

                      {/* Profils gravitants */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Profile 1 */}
                        <motion.div 
                          animate={{ y: [0, -10, 0] }} 
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute top-[15%] right-[15%] w-[60px] h-[60px] rounded-full bg-[#4a4a4a] border-2 border-white/20 flex items-center justify-center text-[24px] text-white z-[110] shadow-xl"
                        >👤</motion.div>
                        
                        {/* Profile 2 */}
                        <motion.div 
                          animate={{ y: [0, -10, 0] }} 
                          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                          className="absolute top-[30%] left-[10%] w-[60px] h-[60px] rounded-full bg-[#4a4a4a] border-2 border-white/20 flex items-center justify-center text-[24px] text-white z-[110] shadow-xl"
                        >👩</motion.div>
                        
                        {/* Profile 3 (Disappears) */}
                        <motion.div 
                          key={`profile-disappear-${i}`}
                          initial={{ opacity: 0, scale: 0.05, filter: "blur(10px)" }}
                          whileInView={{ 
                            opacity: [0, 1, 1, 0.6, 0.3, 0], 
                            scale: [0.05, 1, 1, 0.95, 0.7, 0.05],
                            filter: ["blur(10px)", "blur(0px)", "blur(0px)", "blur(2px)", "blur(5px)", "blur(10px)"]
                          }}
                          transition={{ 
                            duration: 10,
                            times: [0, 0.05, 0.3, 0.35, 0.45, 0.55], 
                            repeat: Infinity, 
                            repeatType: "loop"
                          }}
                          className="absolute bottom-[35%] right-[10%] w-[60px] h-[60px] rounded-full bg-[#4a4a4a] border-2 border-white/20 flex items-center justify-center text-[24px] text-white z-[110] shadow-xl"
                        >🧑</motion.div>
                        
                        {/* Profile 4 */}
                        <motion.div 
                          animate={{ y: [0, -10, 0] }} 
                          transition={{ duration: 3, repeat: Infinity }}
                          className="absolute bottom-[20%] left-[15%] w-[60px] h-[60px] rounded-full bg-[#4a4a4a] border-2 border-white/20 flex items-center justify-center text-[24px] text-white z-[110] shadow-xl"
                        >👨</motion.div>

                        {/* Radar Waves from disappearing profile (Profile 3) */}
                        {[0, 1, 2].map((waveIndex) => (
                          <motion.div
                            key={`wave-${i}-${waveIndex}`}
                            initial={{ width: 0, height: 0, opacity: 0 }}
                            whileInView={{ 
                              width: [0, 0, 450],
                              height: [0, 0, 450],
                              opacity: [0, 0.8, 0] 
                            }}
                            transition={{ 
                              delay: 3 + (waveIndex * 0.4), 
                              duration: 2, 
                              ease: "easeOut", 
                              repeat: Infinity, 
                              repeatDelay: 8,
                              times: [0, 0.1, 1]
                            }}
                            className="absolute border-4 border-[#39ff14]/80 rounded-full z-[105] pointer-events-none shadow-[0_0_15px_rgba(57,255,20,0.6)]"
                            style={{ 
                              bottom: "calc(35% + 30px)", 
                              right: "calc(10% + 30px)",
                              transform: "translate(50%, 50%)",
                              transformOrigin: "center"
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : feature.tag === "SECURITY" ? (
                  <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                      whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="relative w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] flex items-center justify-center"
                    >
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-green-500/10 blur-[100px] rounded-full" />
                      <ShieldCheck className="w-full h-full text-green-400/20 absolute" strokeWidth={0.5} />
                      <div className="relative z-10 p-12 bg-white/5 backdrop-blur-xl rounded-[60px] border border-white/10 shadow-2xl">
                        <ShieldCheck className="w-32 h-32 lg:w-48 lg:h-48 text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.5)]" />
                      </div>
                      
                      {/* Floating particles */}
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [0, -20, 0],
                            opacity: [0.2, 0.5, 0.2]
                          }}
                          transition={{
                            duration: 3 + i,
                            repeat: Infinity,
                            delay: i * 0.5
                          }}
                          className="absolute w-2 h-2 bg-green-400 rounded-full"
                          style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`
                          }}
                        />
                      ))}
                    </motion.div>
                  </div>
                ) : null}

                <div className={`order-1 lg:order-2 text-center lg:text-left ${(!feature.animation && !feature.preview && feature.tag !== "SECURITY") ? 'lg:col-span-2 lg:text-center' : ''}`}>
                  <div className="flex flex-col items-center lg:items-start">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className={`w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-8 ${feature.color}`}
                    >
                      <feature.icon className="w-10 h-10" />
                    </motion.div>
                    <h2 className="text-5xl md:text-7xl font-display font-black mb-8 text-white tracking-tighter leading-tight">
                      {feature.title.split(' ')[0]} <br />
                      <span className="text-gradient">{feature.title.split(' ').slice(1).join(' ')}</span>
                    </h2>
                  </div>
                  <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      <section className="h-screen snap-start snap-always relative bg-[#0a0a0a] overflow-y-auto scrollbar-hide" data-testid="section-faq">
        <div className="max-w-4xl w-full mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-6 tracking-tighter">
              Common <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-xl text-gray-400">Everything you need to know about Flowtrack.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 p-8 md:p-12 shadow-2xl"
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "Is Flowtrack safe for my account?",
                  a: "Yes, 100%. We use official Graph APIs and follow all platform guidelines. We never ask for your password and use bank-grade encryption to protect your data."
                },
                {
                  q: "Do I need to provide my login credentials?",
                  a: "Never. Flowtrack connects via official secure authentication methods. Your privacy and security are our top priorities."
                },
                {
                  q: "How does the tracking work exactly?",
                  a: "\"Our employee\" will follow your account to monitor your follower list and compare it periodically with new data. This allows us to detect exactly who unfollowed you, who followed you, and which accounts were deactivated or deleted."
                },
                {
                  q: "Can I track multiple accounts?",
                  a: "Absolutely. Our premium plans allow you to connect and monitor multiple Instagram and Facebook profiles from a single dashboard."
                },
                {
                  q: "Is it possible to see who viewed my profile?",
                  a: "While official APIs don't provide a direct 'visitor list', our advanced analytics use engagement patterns and interaction data to give you the most accurate insights available on who's interacting with your content."
                },
                {
                  q: "How often are the stats updated?",
                  a: "We provide real-time tracking. As soon as a change is detected on your profile, your dashboard is updated and notifications are sent."
                },
                {
                  q: "Will the people I track be notified?",
                  a: "No. Flowtrack is a silent monitoring tool. Your tracking activity is completely private and invisible to the accounts you monitor."
                },
                {
                  q: "How fast will I receive a notification after a change occurs?",
                  a: "Notifications are sent as soon as our system detects a change during its regular monitoring cycles. While not always instantaneous due to high demand, we strive to keep you updated as quickly as possible."
                },
                {
                  q: "Is there a free trial available?",
                  a: "Yes! You can connect your account for free to see your current stats. Advanced historical tracking and real-time alerts require a premium subscription."
                }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-white/10 last:border-0 pb-2">
                  <AccordionTrigger className="text-xl md:text-2xl font-bold text-white hover:text-green-400 transition-colors py-6 text-left hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-lg text-gray-400 leading-relaxed pb-6">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <section className="h-screen snap-start snap-always flex items-center justify-center relative px-6" data-testid="section-cta">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-4xl md:text-7xl font-display font-black mb-8 text-white tracking-tighter">
              Ready to know <br /><span className="text-gradient">who fades?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who already use Flowtrack to understand their relationships and themselves better.
            </p>
            <div className="flex items-center justify-center mb-16">
              <div className="scale-125">
                <button 
                  onClick={() => setIsOpen(true)}
                  className="text-base px-8 py-4 rounded-full transition-all duration-300 bg-[#02c950]/20 backdrop-blur-md border border-white/20 hover:shadow-[0_0_20px_rgba(2,201,80,0.4)] hover:bg-[#02c950]/30 font-bold text-white flex items-center gap-2"
                >
                  Start Tracking Free <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              &copy; 2024 Flowtrack Analytics. All rights reserved.
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

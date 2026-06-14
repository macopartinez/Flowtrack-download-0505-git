import { RadarBackground } from "@/components/RadarBackground";
import { BackgroundWaler } from "@/components/BackgroundWaler";
import { GlassText } from "@/components/GlassText";
import { motion } from "framer-motion";
import { BarChart3, ShieldCheck, Zap, Eye, Search, Lock, ChevronDown, ArrowRight, Users, Heart, TrendingDown, Shield, Star, User, Crown, Target, TrendingUp, Network, MessageCircle, Activity, Clock, Link } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnalyticsPreview } from "@/components/AnalyticsPreview";
import { ConnectDialog } from "@/components/ConnectDialog";
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
          <div style="font-size:14px;font-weight:600;color:#000;letter-spacing:-0.2px">Waler</div>
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
  const [, navigate] = useLocation();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const words = ["personal", "networker", "mentor", "professional", "closer"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-transparent font-body text-white relative" data-testid="scroll-container">
      <RadarBackground />
      <BackgroundWaler />
      <ConnectDialog isOpen={isOpen} setIsOpen={setIsOpen} />
      <nav className="fixed w-full top-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ position: 'absolute', left: '15px', top: '15px' }}>
            <GlassText text="WALER" fontSize={36} />
          </div>
          <div className="flex items-center gap-6" style={{ position: 'absolute', right: '15px', top: '15px' }}>
            <button 
              onClick={() => navigate("/onboard")}
              className="text-base font-bold px-6 py-2.5 rounded-full transition-all duration-300 bg-[#02c950]/20 backdrop-blur-md border border-white/20 hover:shadow-[0_0_20px_rgba(2,201,80,0.4)] hover:bg-[#02c950]/30 text-white" 
              data-testid="button-start-tracking"
            >
              Begin Your Journey
            </button>
            <button 
              onClick={() => setIsOpen(true)}
              className="text-sm font-bold text-white hover:text-white/80 transition-colors" 
              data-testid="button-login"
            >
              Welcome Back
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
              The first relationship <br />
              clarity tool for{" "}
              <span className="inline-block w-[280px] md:w-[380px]">
                <motion.span
                  key={currentWordIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-gradient inline-block"
                >
                  {words[currentWordIndex]}.
                </motion.span>
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Waler detects when someone close leaves your digital circle — and guides you through what it really means about you and your relationship.
            </p>
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
              <p className="text-lg max-w-2xl mx-auto text-[#ffffff]">Three steps to turn signals into self-knowledge.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Connect",
                  desc: "Link your Instagram account. Waler quietly monitors the connections that matter to you.",
                  icon: Eye
                },
                {
                  step: "02",
                  title: "Notice",
                  desc: "When someone close leaves — unfollows, blocks, disappears — Waler catches it before you do.",
                  icon: BarChart3
                },
                {
                  step: "03",
                  title: "Reflect",
                  desc: "Not just a number. A guided introspection to understand your role in what just changed.",
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
      <section className="h-screen snap-start snap-always flex items-center justify-center relative px-6" data-testid="section-testimonials">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
                What people <span className="text-gradient">say</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto text-[#ffffff]">Real stories from people who found clarity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Sarah M.",
                  role: "Content Creator",
                  text: "Waler helped me understand patterns I couldn't see before. It's not just about numbers — it's about understanding myself better.",
                  rating: 5
                },
                {
                  name: "Alex K.",
                  role: "Small Business Owner",
                  text: "I was constantly checking who unfollowed me. Waler gave me peace of mind and real insights into my professional relationships.",
                  rating: 5
                },
                {
                  name: "Emma L.",
                  role: "Influencer",
                  text: "Finally, a tool that treats social connections with the depth they deserve. The reflection prompts changed how I see my relationships.",
                  rating: 5
                }
              ].map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  data-testid={`testimonial-${i}`}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, starIndex) => (
                      <Star key={starIndex} className="w-5 h-5 fill-green-400 text-green-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-6 text-base">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
      {/* Pro Mode Introduction */}
      <section className="h-screen snap-start snap-always flex items-center justify-center relative px-6" data-testid="section-pro-intro">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-500/30 rounded-full px-6 py-3 mb-8">
              <Crown className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-bold tracking-wider text-sm">PRO MODE</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-black mb-8 text-white tracking-tighter leading-tight">
              Turn insights into <br />
              <span className="text-gradient bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">business growth</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Go beyond personal tracking. Manage clients, analyze their circles, and build deeper professional relationships with advanced CRM features.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6">
                <div className="text-4xl font-black text-white mb-2">10+</div>
                <div className="text-gray-400 font-medium">Signal Types</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6">
                <div className="text-4xl font-black text-white mb-2">100%</div>
                <div className="text-gray-400 font-medium">Automated</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6">
                <div className="text-4xl font-black text-white mb-2">∞</div>
                <div className="text-gray-400 font-medium">Clients</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pro Feature 1: Client Management - Base du système */}
      <section className="h-screen snap-start snap-always flex items-center justify-center relative px-6" data-testid="section-pro-clients">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 shadow-2xl">
                  <div className="space-y-4">
                    {[
                      { name: "Sarah Johnson", followers: "12.5K", score: 92, status: "active" },
                      { name: "Mike Chen", followers: "8.3K", score: 85, status: "active" },
                      { name: "Emma Davis", followers: "15.2K", score: 78, status: "pending" }
                    ].map((client, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-white">{client.name}</div>
                          <div className="text-sm text-gray-400">{client.followers} followers</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-white">{client.score}</div>
                          <div className="text-xs text-gray-400">Score</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-8 mx-auto lg:mx-0">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-5xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
                Manage <span className="text-gradient bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">multiple clients</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed mb-6">
                Track unlimited clients and their Instagram circles from one unified dashboard. Monitor engagement, analyze patterns, and build stronger relationships at scale.
              </p>
              <ul className="space-y-3 text-left">
                {["Unlimited client profiles", "Real-time sync", "Automated tracking", "Custom categories"].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-gray-300"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pro Feature 2: Relationship Scoring - Analyser les clients */}
      <section className="h-screen snap-start snap-always flex items-center justify-center relative px-6" data-testid="section-pro-scoring">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="text-7xl font-black text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text mb-2">
                      92
                    </div>
                    <div className="text-gray-400 font-medium">Relationship Score</div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Engagement", value: 30, max: 30, color: "from-green-400 to-emerald-500" },
                      { label: "Likes Received", value: 18, max: 20, color: "from-green-500 to-emerald-600" },
                      { label: "Connection Streak", value: 20, max: 20, color: "from-emerald-400 to-green-500" },
                      { label: "Seniority", value: 12, max: 15, color: "from-green-300 to-emerald-400" },
                      { label: "Mutual Connections", value: 12, max: 15, color: "from-emerald-500 to-green-600" }
                    ].map((metric, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-300">{metric.label}</span>
                          <span className="text-white font-bold">{metric.value}/{metric.max}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(metric.value / metric.max) * 100}%` }}
                            transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                            className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-8 mx-auto lg:mx-0">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-5xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
                AI-powered <span className="text-gradient bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">relationship scoring</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed mb-6">
                Get intelligent scores (0-100) for every connection based on engagement patterns, likes, connection duration, and mutual networks. Know exactly who matters most.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Engagement", Icon: MessageCircle },
                  { label: "Consistency", Icon: Activity },
                  { label: "Seniority", Icon: Clock },
                  { label: "Network", Icon: Link }
                ].map((factor, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                      <factor.Icon className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-sm text-gray-300">{factor.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pro Feature 3: Mutual Connections - Découvrir le réseau */}
      <section className="h-screen snap-start snap-always flex items-center justify-center relative px-6" data-testid="section-pro-connections">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="text-center lg:text-left">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-8 mx-auto lg:mx-0">
                <Network className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-5xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
                Discover <span className="text-gradient bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">hidden connections</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed mb-6">
                Automatically detect mutual connections between your clients and their followers. Uncover relationship networks and leverage shared contacts for better engagement.
              </p>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/20 rounded-3xl p-6 text-left">
                <div className="text-sm text-green-400 font-bold mb-2">EXAMPLE</div>
                <div className="text-white font-medium mb-1">Sarah & Mike share 12 mutual followers</div>
                <div className="text-gray-400 text-sm">Including @john_doe, @emma_wilson, @alex_smith...</div>
              </div>
            </div>
            <div className="order-first lg:order-last">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative w-full h-[400px] flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full" />
                {/* Network visualization */}
                <div className="relative w-full h-full">
                  {/* Center node */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-4 border-white/20 flex items-center justify-center text-white font-bold text-2xl shadow-2xl z-20">
                    You
                  </div>
                  {/* Lignes de connexion statiques */}
                  {[
                    { angle: 0, name: "Client A" },
                    { angle: 120, name: "Client B" },
                    { angle: 240, name: "Client C" }
                  ].map((node, i) => {
                    const radius = 140;
                    const x = Math.cos((node.angle * Math.PI) / 180) * radius;
                    const y = Math.sin((node.angle * Math.PI) / 180) * radius;
                    return (
                      <div key={i}>
                        {/* Ligne de connexion */}
                        <div 
                          className="absolute top-1/2 left-1/2 w-[140px] h-[2px] bg-gradient-to-r from-green-400/40 to-transparent origin-left z-0"
                          style={{ transform: `translate(-50%, -50%) rotate(${node.angle}deg)` }}
                        />
                        {/* Nœud client */}
                        <div
                          className="absolute top-1/2 left-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white/40 flex items-center justify-center text-white font-semibold text-xs shadow-2xl z-10"
                          style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                        >
                          {node.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Pro Feature 4: Advanced Analytics */}
      <section className="h-screen snap-start snap-always flex items-center justify-center relative px-6" data-testid="section-pro-analytics">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            <div className="text-center lg:text-left">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-8 mx-auto lg:mx-0">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-5xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
                Advanced <span className="text-gradient bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">analytics</span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed mb-6">
                Track like patterns, engagement streaks, and follow/unfollow correlations with precision. Detect 10+ signal types automatically and understand behavioral patterns.
              </p>
              <div className="space-y-3">
                {[
                  { type: "Follow Then Engage", strength: 100, color: "from-green-400 to-emerald-500" },
                  { type: "Consistent Liker", strength: 85, color: "from-emerald-400 to-green-500" },
                  { type: "Stalker Pattern", strength: 78, color: "from-green-500 to-emerald-600" }
                ].map((signal, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold">{signal.type}</span>
                      <span className="text-sm text-gray-400">{signal.strength}/100</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${signal.strength}%` }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                        className={`h-full bg-gradient-to-r ${signal.color} rounded-full`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="order-first lg:order-last">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 shadow-2xl">
                  <div className="text-sm text-green-400 font-bold mb-4">ENGAGEMENT TIMELINE</div>
                  <div className="space-y-6">
                    {[
                      { day: "Day 1", event: "Followed you", icon: "👋", color: "blue" },
                      { day: "Day 2", event: "Liked 3 posts", icon: "❤️", color: "red" },
                      { day: "Day 5", event: "Liked 5 posts", icon: "🔥", color: "orange" },
                      { day: "Day 7", event: "Still engaging", icon: "⭐", color: "yellow" }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.15 }}
                        className="flex items-center gap-4"
                      >
                        <div className="text-3xl">{item.icon}</div>
                        <div className="flex-1">
                          <div className="text-white font-bold">{item.event}</div>
                          <div className="text-sm text-gray-400">{item.day}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="h-screen snap-start snap-always relative overflow-hidden group/features" data-testid="section-features">
                
        {/* Nested snap container */}
        <div className="h-full overflow-y-auto snap-y snap-mandatory relative z-10 scrollbar-hide">
          {[
            {
              icon: Search,
              title: "Notice what matters, when it matters",
              desc: "No more wondering. Waler gently catches every shift in your connections — so you can understand what changed, not just react to it.",
              color: "text-purple-400",
              tag: "AWARENESS",
              animation: true
            },
            {
              icon: BarChart3,
              title: "Relationship Insights",
              desc: "Understand patterns in your connections. See who stays, who leaves, and what it reveals about your relationships.",
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
                        ><User className="w-6 h-6 text-green-400" /></motion.div>
                        
                        {/* Profile 2 */}
                        <motion.div 
                          animate={{ y: [0, -10, 0] }} 
                          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                          className="absolute top-[30%] left-[10%] w-[60px] h-[60px] rounded-full bg-[#4a4a4a] border-2 border-white/20 flex items-center justify-center text-[24px] text-white z-[110] shadow-xl"
                        ><User className="w-6 h-6 text-green-400" /></motion.div>
                        
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
                  <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto lg:mx-0 leading-loose tracking-wide">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      <section className="h-screen snap-start snap-always relative overflow-y-auto scrollbar-hide" data-testid="section-faq">
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
            <p className="text-xl text-gray-400">Everything you need to know about Waler.</p>
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
                  q: "Is Waler safe for my account?",
                  a: "Yes, 100%. We use official Graph APIs and follow all platform guidelines. We never ask for your password and use bank-grade encryption to protect your data."
                },
                {
                  q: "Do I need to provide my login credentials?",
                  a: "Never. Waler connects via official secure authentication methods. Your privacy and security are our top priorities."
                },
                {
                  q: "How does the tracking work exactly?",
                  a: "\"Our employee\" will follow your account to monitor your follower list and compare it periodically with new data. This allows us to detect exactly who unfollowed you, who followed you, and which accounts were deactivated or deleted."
                },
                {
                  q: "Can I track multiple accounts?",
                  a: "Absolutely. Our premium plans allow you to connect and monitor multiple Instagram profiles from a single dashboard."
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
                  a: "No. Waler is a silent monitoring tool. Your tracking activity is completely private and invisible to the accounts you monitor."
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

      <section className="min-h-screen snap-start snap-always relative px-6 py-20" data-testid="section-story">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl md:text-7xl font-display font-black leading-tight mb-6 text-white tracking-tighter">
              Every follower has a <span className="text-gradient">story</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              And every story deserves to be known
            </p>
          </motion.div>

          <div className="space-y-24 mb-32">
            {[
              { icon: Users, title: "You built something real", desc: "Every follower represents a connection. A person who chose to see your content, to be part of your journey.", color: "text-green-400", transition: null },
              { icon: Heart, title: "But relationships change", desc: "Some stay. Some fade away. Some disappear without a trace. And you're left wondering... what happened?", color: "text-green-400", transition: "And then, without warning..." },
              { icon: TrendingDown, title: "The invisible shift", desc: "They unfollow in silence. They block without explanation. Your numbers drop — but behind every number, there's a relationship worth understanding.", color: "text-green-400", transition: "That silence... it means something." },
              { icon: Shield, title: "Until now", desc: "Waler turns that signal into self-knowledge. See exactly who unfollowed, who blocked you, and when it happened — then understand what it means about you.", color: "text-green-400", transition: "But what if you could know?" }
            ].map((beat, index) => (
              <div key={index}>
                {beat.transition && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center text-xl italic text-gray-400 mb-12 font-medium"
                  >
                    {beat.transition}
                  </motion.p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className={`w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-6 ${beat.color}`}
                  >
                    <beat.icon className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-3xl md:text-4xl font-display font-black mb-4 text-white tracking-tight">
                    {beat.title}
                  </h3>
                  <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
                    {beat.desc}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-6xl font-display font-black mb-8 text-white tracking-tighter">
              Ready to understand <span className="text-gradient">yourself better</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of people who chose reflection over reaction.
            </p>
            <div className="flex items-center justify-center mb-16">
              <button 
                onClick={() => navigate("/onboard")}
                className="text-lg px-10 py-5 rounded-full transition-all duration-300 bg-[#02c950]/20 backdrop-blur-md border border-white/20 hover:shadow-[0_0_30px_rgba(2,201,80,0.5)] hover:bg-[#02c950]/30 font-bold text-white inline-flex items-center gap-3"
                data-testid="button-cta-start-tracking"
              >
                Begin Your Journey <ArrowRight className="w-6 h-6" />
              </button>
            </div>
            <footer className="border-t border-white/10 pt-8 mt-16">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
                <a href="https://instagram.com/waler.web" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  @waler.web
                </a>
                <a href="mailto:walerwebsite@outlook.com" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  walerwebsite@outlook.com
                </a>
                <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Politique de confidentialité
                </a>
              </div>
              <div className="text-sm text-gray-500 text-center">
                &copy; 2024 Waler Analytics. All rights reserved.
              </div>
            </footer>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

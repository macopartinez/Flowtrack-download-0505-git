import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { RadarBackground } from "@/components/RadarBackground";
import { BackgroundWaler } from "@/components/BackgroundWaler";
import { GlassText } from "@/components/GlassText";
import { ArrowRight, Heart, Users, TrendingDown, Shield } from "lucide-react";

export default function Storytelling() {
  const [, navigate] = useLocation();

  const storyBeats = [
    {
      icon: Users,
      title: "You built something real",
      description: "Every follower represents a connection. A person who chose to see your content, to be part of your journey.",
      color: "text-green-400"
    },
    {
      icon: Heart,
      title: "But relationships change",
      description: "Some stay. Some fade away. Some disappear without a trace. And you're left wondering... what happened?",
      color: "text-green-400"
    },
    {
      icon: TrendingDown,
      title: "The invisible exodus",
      description: "They unfollow in silence. They block without explanation. Your numbers drop, but you never know who or why.",
      color: "text-green-400"
    },
    {
      icon: Shield,
      title: "Until now",
      description: "Waler reveals the truth. See exactly who unfollowed, who blocked you, and when it happened. No more guessing.",
      color: "text-green-400"
    }
  ];

  return (
    <div className="min-h-screen bg-transparent font-body text-white relative overflow-hidden">
      <RadarBackground />
      <BackgroundWaler />

      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate("/")}>
            <GlassText text="WALER" fontSize={36} />
          </button>
          <button
            onClick={() => navigate("/onboard")}
            className="text-base font-bold px-6 py-2.5 rounded-full transition-all duration-300 bg-[#02c950]/20 backdrop-blur-md border border-white/20 hover:shadow-[0_0_20px_rgba(2,201,80,0.4)] hover:bg-[#02c950]/30 text-white"
          >
            Start Tracking Free
          </button>
        </div>
      </nav>

      {/* Story Content */}
      <div className="relative z-10 min-h-screen pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-24"
          >
            <h1 className="text-5xl md:text-7xl font-display font-black leading-tight mb-6 text-white tracking-tighter">
              Every follower has a <span className="text-gradient">story</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              And every story deserves to be known
            </p>
          </motion.div>

          {/* Story Beats */}
          <div className="space-y-32">
            {storyBeats.map((beat, index) => (
              <motion.div
                key={index}
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
                  className={`w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-8 ${beat.color}`}
                >
                  <beat.icon className="w-12 h-12" />
                </motion.div>
                <h2 className="text-3xl md:text-5xl font-display font-black mb-6 text-white tracking-tight">
                  {beat.title}
                </h2>
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
                  {beat.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mt-32"
          >
            <h2 className="text-4xl md:text-6xl font-display font-black mb-8 text-white tracking-tighter">
              Ready to know the <span className="text-gradient">truth</span>?
            </h2>
            <button
              onClick={() => navigate("/onboard")}
              className="text-lg px-10 py-5 rounded-full transition-all duration-300 bg-[#02c950]/20 backdrop-blur-md border border-white/20 hover:shadow-[0_0_30px_rgba(2,201,80,0.5)] hover:bg-[#02c950]/30 font-bold text-white inline-flex items-center gap-3"
            >
              Start Your Journey <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { ConnectDialog } from "@/components/ConnectDialog";
import { RadarBackground } from "@/components/RadarBackground";
import { motion } from "framer-motion";
import { Instagram, Facebook, BarChart3, ShieldCheck, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-transparent font-body overflow-hidden text-white relative">
      <RadarBackground />
      {/* Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
              F
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">Flowtrack</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-gray-400">
            <a href="#features" className="hover:text-white transition-all">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-all">How it works</a>
            <a href="#pricing" className="hover:text-white transition-all">Pricing</a>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Login</button>
            <ConnectDialog />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-sm mb-10">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-sm font-bold text-gray-400 tracking-wide uppercase">AI-Powered Unfollower Intelligence</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display font-black leading-[1] mb-8 text-white tracking-tighter">
              The ultimate tracking tool <br />
              <span className="text-gradient">for serious creators.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Don't just track numbers. Understand the human behind the click. 
              The world's most advanced unfollower analytics platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="scale-110">
                <ConnectDialog />
              </div>
              <button className="px-10 py-4 rounded-2xl text-lg font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95">
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating Elements (Decorative) */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 left-10 md:left-40 hidden md:block"
        >
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3 w-48">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 flex items-center justify-center text-white">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">New Unfollower</div>
              <div className="text-sm font-bold">@sarah_designs</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 right-10 md:right-40 hidden md:block"
        >
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3 w-48">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <Facebook className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Growth Rate</div>
              <div className="text-sm font-bold text-green-500">+12.4% ↗</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything you need to grow</h2>
            <p className="text-muted-foreground">Powerful tools to help you understand your audience better.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Deep Analytics",
                desc: "Understand exactly when and why people unfollow you with detailed timeline charts.",
                color: "text-blue-500"
              },
              {
                icon: Zap,
                title: "Real-time Alerts",
                desc: "Get notified instantly when someone unfollows your account so you can react fast.",
                color: "text-yellow-500"
              },
              {
                icon: ShieldCheck,
                title: "Account Safety",
                desc: "We use official APIs and bank-grade encryption to keep your account 100% secure.",
                color: "text-green-500"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">F</div>
             <span className="font-bold">Flowtrack</span>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 Flowtrack Analytics. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

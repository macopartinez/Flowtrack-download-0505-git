import { ConnectDialog } from "@/components/ConnectDialog";
import { RadarBackground } from "@/components/RadarBackground";
import { BackgroundFlowtrack } from "@/components/BackgroundFlowtrack";
import { GlassText } from "@/components/GlassText";
import { motion } from "framer-motion";
import { BarChart3, ShieldCheck, Zap, Eye } from "lucide-react";

export default function Landing() {
  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-transparent font-body text-white relative" data-testid="scroll-container">
      <RadarBackground />
      <BackgroundFlowtrack />
      <nav className="fixed w-full top-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlassText text="FLOWTRACK" fontSize={36} />
          </div>
          <div className="flex items-center gap-6">
            <ConnectDialog />
            <button className="text-sm font-bold text-white hover:text-white/80 transition-colors" data-testid="button-login">Login</button>
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
                <ConnectDialog />
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
              icon: BarChart3,
              title: "Deep Analytics",
              desc: "Understand exactly when and why people unfollow you with detailed timeline charts.",
              color: "text-blue-400",
              tag: "INSIGHTS"
            },
            {
              icon: Zap,
              title: "Real-time Alerts",
              desc: "Get notified instantly when someone unfollows your account so you can react fast.",
              color: "text-yellow-400",
              tag: "SPEED"
            },
            {
              icon: ShieldCheck,
              title: "Account Safety",
              desc: "We use official APIs and bank-grade encryption to keep your account 100% secure.",
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
                className="max-w-4xl w-full"
              >
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mx-auto mb-8 ${feature.color}`}
                  >
                    <feature.icon className="w-10 h-10" />
                  </motion.div>
                  <span className={`text-sm font-bold tracking-[0.3em] mb-4 block ${feature.color}`}>{feature.tag}</span>
                  <h2 className="text-5xl md:text-7xl font-display font-black mb-8 text-white tracking-tighter leading-tight">
                    {feature.title.split(' ')[0]} <br />
                    <span className="text-gradient">{feature.title.split(' ').slice(1).join(' ')}</span>
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            </div>
          ))}
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
              Ready to see <br /><span className="text-gradient">who's watching?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of creators who already use Flowtrack to understand their audience and grow smarter.
            </p>
            <div className="flex items-center justify-center mb-16">
              <div className="scale-125">
                <ConnectDialog />
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

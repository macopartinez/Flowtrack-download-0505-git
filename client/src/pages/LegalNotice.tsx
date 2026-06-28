import { motion } from "framer-motion";
import { Building2, Server, Mail, Globe, Shield } from "lucide-react";

export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-16">
            <div className="w-20 h-20 rounded-3xl bg-green-500/10 backdrop-blur-md border border-green-500/20 flex items-center justify-center mx-auto mb-8">
              <Building2 className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
              Legal <span className="text-gradient">Notice</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Who runs Waler and how to reach us.
            </p>
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Publisher</h2>
                  <p className="text-gray-300 leading-relaxed">
                    This website is published by <strong className="text-white">Waler Analytics</strong>. Waler is an independent service for tracking and analyzing Instagram relationships. For any legal or business inquiry, please use the contact details below.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Contact</h2>
                  <p className="text-gray-300 leading-relaxed">
                    Email:{' '}
                    <a href="mailto:walerwebsite@outlook.com" className="text-green-400 hover:text-green-300 transition-colors">
                      walerwebsite@outlook.com
                    </a>
                    <br />
                    Instagram:{' '}
                    <a href="https://instagram.com/waler.web" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors">
                      @waler.web
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Server className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Hosting & Data Storage</h2>
                  <p className="text-gray-300 leading-relaxed">
                    User data is stored on our own <strong className="text-green-400">private, secure servers</strong>. It is never shared with or sold to third parties. Payment processing is handled by Stripe, and infrastructure is operated using industry-standard secure providers. See our{' '}
                    <a href="/privacy" className="text-green-400 hover:text-green-300 transition-colors">Privacy Policy</a> for full details.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Intellectual Property</h2>
                  <p className="text-gray-300 leading-relaxed">
                    All content on this site — branding, design, text and code — is the property of Waler Analytics unless otherwise stated, and may not be reproduced without permission. Instagram is a trademark of Meta Platforms, Inc.; Waler is an independent product and is not affiliated with or endorsed by Meta.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl rounded-3xl border border-green-500/20 p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Our Commitment</h2>
                  <p className="text-gray-300 leading-relaxed">
                    <strong className="text-green-400">Your data stays private.</strong> It is never shared, traded or sold, and is kept on private servers used solely to operate Waler.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center text-sm text-gray-500 pt-8"
            >
              Last updated: June 2026
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

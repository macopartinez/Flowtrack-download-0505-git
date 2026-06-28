import { motion } from "framer-motion";
import { Cookie, Settings, Shield, CheckCircle, XCircle } from "lucide-react";

export default function Cookies() {
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
              <Cookie className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
              Cookie <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We keep cookies to the strict minimum needed to run the service.
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
                  <Cookie className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">What Are Cookies?</h2>
                  <p className="text-gray-300 leading-relaxed">
                    Cookies are small files stored in your browser. Waler uses them only to make the service work — to keep you logged in and remember essential preferences. We do not use them to build advertising profiles.
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
                  <Settings className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Cookies We Use</h2>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span><strong className="text-white">Essential cookies</strong> — keep your session active and secure</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span><strong className="text-white">Preference cookies</strong> — remember basic settings like your plan view</span>
                    </li>
                  </ul>
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
                  <XCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">What We Don't Do</h2>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      No advertising or tracking cookies
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      No selling or sharing of your data with third parties
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      No cross-site profiling
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl rounded-3xl border border-green-500/20 p-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Managing Cookies</h2>
                  <p className="text-gray-300 leading-relaxed">
                    You can clear or block cookies anytime in your browser settings. Note that disabling essential cookies may prevent you from staying logged in. Your data always stays on our{' '}
                    <strong className="text-green-400">private secure servers</strong> and is never shared.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
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

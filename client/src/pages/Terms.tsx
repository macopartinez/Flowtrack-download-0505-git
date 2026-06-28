import { motion } from "framer-motion";
import { FileText, CreditCard, RefreshCw, Lock, AlertTriangle, CheckCircle } from "lucide-react";

export default function Terms() {
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
              <FileText className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
              Terms of <span className="text-gradient">Service</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The terms that govern your use of Waler and your subscription.
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
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">1. Acceptance of Terms</h2>
                  <p className="text-gray-300 leading-relaxed">
                    By creating an account or using Waler, you agree to these Terms of Service. Waler is a relationship-tracking and analytics tool for Instagram. If you do not agree with these terms, please do not use the service.
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
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">2. The Service</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Waler lets you track changes in your Instagram relationships (followers, following, unfollowers) and provides analytics, statistics and notifications. The service is provided "as is" and may evolve over time. We are an independent product and are not affiliated with, endorsed by, or sponsored by Instagram or Meta Platforms, Inc.
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
                  <CreditCard className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">3. Subscriptions & Billing</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Waler offers free and paid plans (Base and Pro), billed monthly or yearly. Paid subscriptions are processed securely through Stripe. By subscribing, you authorize us to charge the applicable fee on a recurring basis until you cancel.
                  </p>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Subscriptions renew automatically at the end of each period
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Prices are shown clearly before you confirm payment
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      We never store your full card details — Stripe handles all payment data
                    </li>
                  </ul>
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
                  <RefreshCw className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">4. Cancellation & Refunds</h2>
                  <p className="text-gray-300 leading-relaxed">
                    You can cancel your subscription at any time from your account settings. Cancellation stops future renewals; you keep access until the end of your current billing period. Where required by law, you may have a right of withdrawal within 14 days of your first purchase. To request a refund, contact us at{' '}
                    <a href="mailto:walerwebsite@outlook.com" className="text-green-400 hover:text-green-300 transition-colors">
                      walerwebsite@outlook.com
                    </a>.
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
                  <Lock className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">5. Your Data</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    <strong className="text-green-400">Your data is never shared or sold. It is stored on our own private, secure servers and never disclosed to third parties.</strong>
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    We process your information solely to operate the service. For full details on how we collect, store and protect your data, see our{' '}
                    <a href="/privacy" className="text-green-400 hover:text-green-300 transition-colors">Privacy Policy</a>.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">6. Acceptable Use & Liability</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    You agree to use Waler lawfully and not to abuse, reverse-engineer, or disrupt the service. You are responsible for keeping your account credentials secure. Waler is provided without warranty of uninterrupted availability, and we are not liable for indirect damages arising from use of the service, to the extent permitted by law.
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <h2 className="text-2xl font-bold mb-4 text-white">Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                Questions about these terms? Reach us at{' '}
                <a href="mailto:walerwebsite@outlook.com" className="text-green-400 hover:text-green-300 transition-colors">
                  walerwebsite@outlook.com
                </a>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
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

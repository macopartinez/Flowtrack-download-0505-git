import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, CheckCircle } from "lucide-react";

export default function Privacy() {
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
              <Shield className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black mb-6 text-white tracking-tighter">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Your privacy is our top priority. Here's how we protect your data.
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
                  <Database className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Data Collection</h2>
                  <p className="text-gray-300 leading-relaxed">
                    Waler only collects the data needed to provide our relationship-tracking service. We use Instagram's official APIs to access your public profile information (followers, following, statistics). We do not collect any private or sensitive data beyond what's necessary to run the service.
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
                  <Lock className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Data Security</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    The content of your direct messages is encrypted at rest with bank-grade standards (AES-256-GCM). Data in transit is protected by TLS, and we follow industry best practices to safeguard your information.
                  </p>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      AES-256 encryption of message content at rest
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Encrypted connections (TLS) for all data in transit
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Passwords stored as salted bcrypt hashes
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
                  <Eye className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Data Usage</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Your data is used exclusively to provide you with the Waler service:
                  </p>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Detect changes in your following
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Generate analytics and statistics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Send tracking notifications
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
                  <h2 className="text-2xl font-bold mb-3 text-white">No-Commercialization Commitment</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    <strong className="text-green-400">Your data will never be used for commercial purposes or sold to third parties.</strong>
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    We never sell, trade, or rent your personal information to any external company. Your data stays strictly confidential and is used solely to operate our service. We only share your data with your explicit consent or when required by law.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Your Rights</h2>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    In accordance with GDPR and data protection laws, you have the following rights:
                  </p>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Access your personal data
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Request correction of your data
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Request deletion of your data
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Export your data
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      Revoke your consent
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8"
            >
              <h2 className="text-2xl font-bold mb-4 text-white">Contact</h2>
              <p className="text-gray-300 leading-relaxed">
                For any question about our privacy policy or how we use your data, feel free to reach out at:{' '}
                <a href="mailto:walerwebsite@outlook.com" className="text-green-400 hover:text-green-300 transition-colors">
                  walerwebsite@outlook.com
                </a>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
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

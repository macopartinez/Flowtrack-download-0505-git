import { Shield, UserPlus, Eye, TrendingUp, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-6"
          >
            How Does Waler Work?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-blue-100"
          >
            Discover our detection system and how we protect your privacy
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Le Concept */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">The Concept</h2>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <p className="text-lg text-gray-700 mb-4">
              Waler is a <strong>relationship clarity tool</strong>, not a surveillance tool.
            </p>
            <p className="text-gray-600">
              We help you understand who disconnects from you on Instagram and why,
              so you can better know yourself and grow in your relationships.
            </p>
          </div>
        </section>

        {/* Le Processus */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">The Process</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "You subscribe",
                description: "Choose your plan and complete secure payment via Stripe",
                icon: "",
              },
              {
                step: 2,
                title: "Agents follow you",
                description: "Our 2 Instagram agents automatically send a follow request to your account",
                icon: "",
              },
              {
                step: 3,
                title: "You accept (if private account)",
                description: "If your account is private, accept the 2 requests in your Instagram notifications",
                icon: "",
                highlight: true,
              },
              {
                step: 4,
                title: "Daily analysis",
                description: "Agents analyze your followers every day to detect changes",
                icon: "",
              },
              {
                step: 5,
                title: "You receive insights",
                description: "Check your dashboard to see who unfollowed, blocked you, or who follows you",
                icon: "",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.step * 0.1 }}
                className={`flex gap-4 p-6 rounded-xl border-2 ${
                  item.highlight
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    item.highlight ? 'bg-orange-200' : 'bg-gray-100'
                  }`}>
                    {item.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-bold ${
                      item.highlight ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      STEP {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Compte Privé */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-8 h-8 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">Private Account?</h2>
          </div>

          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <AlertCircle className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-orange-900 mb-2">
                  Action required for private accounts
                </h3>
                <p className="text-orange-800">
                  If your Instagram account is private, you must manually accept
                  the follow requests from our 2 agents to activate Waler.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-orange-200">
              <h4 className="font-bold text-gray-900 mb-4">How to do it:</h4>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-orange-600 flex-shrink-0">1.</span>
                  <span>After your payment, open Instagram on your phone</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-orange-600 flex-shrink-0">2.</span>
                  <span>Go to your notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-orange-600 flex-shrink-0">3.</span>
                  <span>You will see 2 follow requests from Waler accounts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-orange-600 flex-shrink-0">4.</span>
                  <span>Accept the 2 requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-orange-600 flex-shrink-0">5.</span>
                  <span>Come back to Waler and click "Verify" in the tutorial</span>
                </li>
              </ol>
            </div>

            <div className="mt-6 p-4 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-900">
                <strong>Note:</strong> The agents will never post content,
                never like your photos, and never interact with your account.
                They are only there to observe changes in your follower list.
              </p>
            </div>
          </div>
        </section>

        {/* Manual Blocker Marking */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl font-bold text-gray-900">Blockers: You Decide</h2>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-8">
            <div className="space-y-4">
              <p className="text-gray-700">
                <strong className="text-red-900">Important:</strong> Waler <strong>cannot automatically detect</strong> if someone blocked you. 
                Instagram doesn't provide this information to third-party apps.
              </p>
              
              <div className="bg-white rounded-lg p-6 border border-red-200">
                <h4 className="font-bold text-gray-900 mb-3">How it works:</h4>
                <ol className="space-y-3 text-gray-700 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-red-600 flex-shrink-0">1.</span>
                    <span>You see someone in your "Unfollowers" list</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-red-600 flex-shrink-0">2.</span>
                    <span>Click on them to open details</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-red-600 flex-shrink-0">3.</span>
                    <span>Click "View on Instagram" to check their profile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-red-600 flex-shrink-0">4.</span>
                    <span>Come back and select:</span>
                  </li>
                  <li className="ml-6 space-y-2">
                    <div className="flex items-center gap-2 text-xs bg-green-50 px-3 py-2 rounded border border-green-200">
                      <span className="text-green-600">OK</span>
                      <span><strong>They just unfollowed</strong> - Profile is visible</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs bg-red-50 px-3 py-2 rounded border border-red-200">
                      <span className="text-red-600">X</span>
                      <span><strong>They blocked me</strong> - Profile not found or restricted</span>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="bg-orange-100 rounded-lg p-4 border border-orange-300">
                <p className="text-sm text-orange-900">
                  <strong>Emotional support:</strong> If you mark someone as a blocker, 
                  Waler will show you a supportive message to help you process the situation positively.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-bold text-gray-900 mb-2">Ghosts (Auto-detected)</h5>
                  <p className="text-sm text-gray-600">
                    Accounts that have been deleted or deactivated. Detected automatically by our agents.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-bold text-gray-900 mb-2">Blockers (You mark)</h5>
                  <p className="text-sm text-gray-600">
                    People you've identified as having blocked you. You decide based on what you see on Instagram.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sécurité & Confidentialité */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">Security & Privacy</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-bold text-green-900 mb-3">Your data is protected</h3>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Secure SSL/TLS connection</li>
                <li>• Passwords hashed with bcrypt</li>
                <li>• Secure Supabase database</li>
                <li>• No access to your Instagram password</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 mb-3">Respect for your privacy</h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Agents never interact with your content</li>
                <li>• No data is shared with third parties</li>
                <li>• You can delete your account at any time</li>
                <li>• GDPR compliant</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

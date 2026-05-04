import { motion, AnimatePresence } from "framer-motion";
import { X, User, Bell, Lock, Trash2, LogOut, Settings, Monitor } from "lucide-react";
import { useState, useEffect } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: {
    username?: string;
    email?: string;
  };
}

export function SettingsModal({ isOpen, onClose, onLogout, user }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'display'>('account');
  const [disableAnimation, setDisableAnimation] = useState(() => {
    return localStorage.getItem('disableBackgroundAnimation') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('disableBackgroundAnimation', disableAnimation.toString());
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('animationPreferenceChanged', { detail: { disabled: disableAnimation } }));
  }, [disableAnimation]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl max-h-[80vh] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-4 border-b border-white/10">
              {[
                { id: 'account', label: 'Account', icon: User },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'privacy', label: 'Privacy', icon: Lock },
                { id: 'display', label: 'Display', icon: Monitor },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-xl transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white border-b-2 border-green-500'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
                    <div className="space-y-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <label className="text-sm text-gray-400 block mb-1">Username</label>
                        <p className="text-white font-medium">@{user.username || 'Not set'}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <label className="text-sm text-gray-400 block mb-1">Email</label>
                        <p className="text-white font-medium">{user.email || 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Danger Zone</h3>
                    <div className="space-y-3">
                      <button className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium transition-colors flex items-center justify-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                      <button
                        onClick={onLogout}
                        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'New unfollowers', description: 'Get notified when someone unfollows you' },
                      { label: 'New blockers', description: 'Get notified when someone blocks you' },
                      { label: 'Weekly summary', description: 'Receive a weekly summary of your activity' },
                      { label: 'Product updates', description: 'Stay informed about new features' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white mb-4">Privacy Settings</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Make profile private', description: 'Only approved followers can see your activity' },
                      { label: 'Hide online status', description: "Don't show when you're active" },
                      { label: 'Data collection', description: 'Allow anonymous usage data collection' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'display' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white mb-4">Display Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                      <div>
                        <p className="text-white font-medium">Disable background animation</p>
                        <p className="text-sm text-gray-400">Turn off animated background for better performance</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={disableAnimation}
                          onChange={(e) => setDisableAnimation(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

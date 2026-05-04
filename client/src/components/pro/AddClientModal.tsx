import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Instagram, Tag } from "lucide-react";
import { useState } from "react";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (client: NewClientData) => void;
}

export interface NewClientData {
  instagramUsername: string;
  displayName: string;
  tags: string[];
  initialGoal?: string;
}

export function AddClientModal({ isOpen, onClose, onAdd }: AddClientModalProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!username.trim() || !displayName.trim()) return;
    
    setIsLoading(true);
    try {
      await onAdd({
        instagramUsername: username.trim(),
        displayName: displayName.trim(),
        tags,
        initialGoal: goal.trim() || undefined
      });
      
      // Reset form
      setUsername("");
      setDisplayName("");
      setTags([]);
      setGoal("");
      onClose();
    } catch (error) {
      console.error("Failed to add client:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-black border border-white/10 rounded-3xl max-w-lg w-full pointer-events-auto shadow-2xl">
              {/* Header */}
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black text-white">Add New Client</h2>
                    <p className="text-xs text-gray-400">Start tracking their Instagram growth</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-4 space-y-4">
                {/* Instagram Username */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Instagram Username *
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full pl-12 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How you want to identify this client"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Tags (optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="e.g., growth, mindset, product launch"
                        className="w-full pl-12 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                      />
                    </div>
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Initial Goal */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Initial Goal (optional)
                  </label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Reach 10K followers in 3 months"
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none text-sm"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 p-4 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!username.trim() || !displayName.trim() || isLoading}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    "Add Client"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Users, UserMinus, MoreVertical, Tag as TagIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export interface Client {
  id: string;
  instagramUsername: string;
  displayName: string;
  tags: string[];
  currentFollowers: number;
  currentFollowing: number;
  followersChange: number; // Change since last week
  followingChange: number;
  lastUpdated: Date;
  createdAt: Date;
  globalDeadline?: Date | null;
  timezone?: string; // Client timezone for recurring milestones (e.g., "Europe/Paris")
}

interface ClientCardProps {
  client: Client;
  onClick: () => void;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

export function ClientCard({ client, onClick, onEdit, onDelete }: ClientCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${formatNumber(change)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="relative bg-black/80 backdrop-blur-sm bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-white/20 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{client.displayName}</h3>
          <a
            href={`https://instagram.com/${client.instagramUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
          >
            @{client.instagramUsername}
          </a>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Tags */}
      {client.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {client.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-xs"
            >
              <TagIcon className="w-3 h-3" />
              {tag}
            </span>
          ))}
          {client.tags.length > 3 && (
            <span className="px-2 py-1 rounded-full bg-white/5 text-gray-400 text-xs">
              +{client.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Followers */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Followers</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {formatNumber(client.currentFollowers)}
            </span>
            {client.followersChange !== 0 && (
              <span className={`flex items-center gap-1 text-xs font-medium ${
                client.followersChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {client.followersChange > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatChange(client.followersChange)}
              </span>
            )}
          </div>
        </div>

        {/* Following */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <UserMinus className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Following</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {formatNumber(client.currentFollowing)}
            </span>
            {client.followingChange !== 0 && (
              <span className={`flex items-center gap-1 text-xs font-medium ${
                client.followingChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {client.followingChange > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatChange(client.followingChange)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <span className="text-xs text-gray-500">
          Updated {new Date(client.lastUpdated).toLocaleDateString()}
        </span>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 right-6 bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10 min-w-[160px]"
        >
          <button 
            onClick={() => {
              setShowMenu(false);
              onClick();
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
          >
            View Details
          </button>
          <button 
            onClick={() => {
              setShowMenu(false);
              onEdit?.(client);
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
          >
            Edit Client
          </button>
          <button 
            onClick={() => {
              setShowMenu(false);
              onDelete?.(client);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Remove Client
          </button>
        </div>
      )}
    </motion.div>
  );
}

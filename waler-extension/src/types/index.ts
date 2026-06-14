// Types globaux pour l'extension

export interface TrackedData {
  type: 'follower' | 'unfollower' | 'potential_blocker' | 'engagement';
  username: string;
  timestamp: number;
  data?: any;
}

export interface Suggestion {
  id: number;
  contactUsername: string;
  currentCategory: string;
  suggestedCategory: string;
  confidence: number;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface StorageData {
  apiToken?: string;
  userId?: number;
  lastSync?: number;
  syncQueue?: TrackedData[];
  pendingSuggestions?: Suggestion[];
  followersCache?: string[];
  [key: string]: any;
}



export type PersonTag = 'prospect' | 'vip' | 'keep' | 'watch' | 'client' | 'converted';

export type ProspectStatus = 'cold' | 'warm' | 'hot' | 'converted' | 'lost';

export type Circle = 'vip' | 'keep' | 'watch';

export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export type Signal = {
  type: 'follow' | 'unfollow' | 'refollow' | 'like' | 'comment' | 'story_view' | 'dm' | 'dm_open' | 'inactive_active' | 'active_inactive';
  timestamp: Date;
  description: string;
};

export interface Person {
  id: string;
  instagramUsername: string;
  displayName: string;
  followsYou: boolean;
  youFollow: boolean;
  addedAt: Date;
  notes: string;
  signals: Signal[];
  sector?: string;
  tags: PersonTag[];
  prospectStatus?: ProspectStatus;
  circle?: Circle;
  score?: number;
  healthScore?: number;
  followDuration?: number;
  lastActivity?: Date;
  converted?: boolean;
  convertedAt?: Date;
  mutualConnections?: number;
  analysisStatus?: AnalysisStatus;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  bio?: string;
  isPrivate?: boolean;
  lastAnalyzedAt?: Date;
}

export function hasTag(person: Person, tag: PersonTag): boolean {
  return person.tags.includes(tag);
}

export function isProspect(person: Person): boolean {
  return hasTag(person, 'prospect');
}

export function isInCircle(person: Person): boolean {
  return hasTag(person, 'vip') || hasTag(person, 'keep') || hasTag(person, 'watch');
}

export function getProspectBadge(person: Person): { label: string; color: string; icon: string } | null {
  if (!isProspect(person) || !person.prospectStatus) return null;
  
  switch (person.prospectStatus) {
    case 'hot':
      return { label: 'Chaud', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: 'Flame' };
    case 'warm':
      return { label: 'Tiède', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: 'Thermometer' };
    case 'cold':
      return { label: 'Froid', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: 'Snowflake' };
    case 'converted':
      return { label: 'Converti', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: 'CheckCircle' };
    case 'lost':
      return { label: 'Perdu', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: 'AlertCircle' };
  }
}

export function getCircleBadge(person: Person): { label: string; color: string; icon: string } | null {
  if (!person.circle) return null;
  
  switch (person.circle) {
    case 'vip':
      return { label: 'VIP', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: 'Crown' };
    case 'keep':
      return { label: 'À garder', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: 'Star' };
    case 'watch':
      return { label: 'À surveiller', color: 'text-green-400 bg-green-500/20 border-green-500/30', icon: 'Eye' };
  }
}

export function getDisplayBadges(person: Person): Array<{ label: string; color: string; icon: string }> {
  const badges = [];
  
  const prospectBadge = getProspectBadge(person);
  if (prospectBadge) badges.push(prospectBadge);
  
  const circleBadge = getCircleBadge(person);
  if (circleBadge) badges.push(circleBadge);
  
  return badges;
}

export function calculateInitialScore(person: Partial<Person>): number {
  let score = 30;
  if (person.followsYou) score += 30;
  if (person.youFollow) score += 10;
  if (person.prospectStatus === 'hot') score += 20;
  if (person.prospectStatus === 'warm') score += 10;
  return Math.min(score, 100);
}

export function calculateHealthScore(person: Partial<Person>): number {
  let score = 50;
  if (person.followsYou && person.youFollow) score += 30;
  else if (person.followsYou) score += 15;
  else if (person.youFollow) score += 10;
  
  if (person.circle === 'vip') score += 10;
  if (person.mutualConnections && person.mutualConnections > 0) {
    score += Math.min(10, person.mutualConnections * 2);
  }
  
  return Math.min(score, 100);
}

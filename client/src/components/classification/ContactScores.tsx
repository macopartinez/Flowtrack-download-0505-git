import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, MessageSquare, Heart, Activity, Clock, Users } from 'lucide-react';

interface ContactScore {
  contact_username: string;
  current_category: string;
  total_score: number;
  dm_score: number;
  engagement_score: number;
  activity_score: number;
  seniority_score: number;
  reciprocity_score: number;
  last_calculated_at: string;
}

export function ContactScores() {
  const [scores, setScores] = useState<ContactScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'recent'>('score');

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    try {
      const response = await fetch('/api/classification/contact-scores', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setScores(data.scores || []);
      }
    } catch (error) {
      console.error('Error loading scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      lead: 'bg-gray-500',
      prospect: 'bg-blue-500',
      client: 'bg-green-500',
      network: 'bg-orange-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      lead: '🆕',
      prospect: '📊',
      client: '🎉',
      network: '🤝'
    };
    return emojis[category] || '📋';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const sortedScores = [...scores].sort((a, b) => {
    if (sortBy === 'score') {
      return b.total_score - a.total_score;
    }
    return new Date(b.last_calculated_at).getTime() - new Date(a.last_calculated_at).getTime();
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scores.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-2">
            <div className="text-6xl">📊</div>
            <h3 className="text-lg font-semibold">No scores</h3>
            <p className="text-muted-foreground">
              Contact scores will appear here after analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('score')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sortBy === 'score'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          By score
        </button>
        <button
          onClick={() => setSortBy('recent')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sortBy === 'recent'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Most recent
        </button>
      </div>

      {/* Scores List */}
      <div className="grid gap-4 md:grid-cols-2">
        {sortedScores.map((score) => (
          <Card key={score.contact_username} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {score.contact_username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {getCategoryEmoji(score.current_category)}
                      @{score.contact_username}
                    </CardTitle>
                    <Badge className={`${getCategoryColor(score.current_category)} mt-1`}>
                      {score.current_category}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(score.total_score)}`}>
                    {score.total_score}
                  </div>
                  <div className="text-xs text-muted-foreground">/100</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Score Breakdown */}
              <div className="space-y-2">
                {/* DMs */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span>DMs</span>
                    </div>
                    <span className="font-medium">{score.dm_score}/30</span>
                  </div>
                  <Progress value={(score.dm_score / 30) * 100} className="h-1" />
                </div>

                {/* Engagement */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-muted-foreground" />
                      <span>Engagement</span>
                    </div>
                    <span className="font-medium">{score.engagement_score}/25</span>
                  </div>
                  <Progress value={(score.engagement_score / 25) * 100} className="h-1" />
                </div>

                {/* Activity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span>Activity</span>
                    </div>
                    <span className="font-medium">{score.activity_score}/20</span>
                  </div>
                  <Progress value={(score.activity_score / 20) * 100} className="h-1" />
                </div>

                {/* Seniority */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>Seniority</span>
                    </div>
                    <span className="font-medium">{score.seniority_score}/10</span>
                  </div>
                  <Progress value={(score.seniority_score / 10) * 100} className="h-1" />
                </div>

                {/* Reciprocity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>Reciprocity</span>
                    </div>
                    <span className="font-medium">{score.reciprocity_score}/15</span>
                  </div>
                  <Progress value={(score.reciprocity_score / 15) * 100} className="h-1" />
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Updated {new Date(score.last_calculated_at).toLocaleDateString('en-US')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare, TrendingUp, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SuggestionsList } from './SuggestionsList';
import { DMConversations } from './DMConversations';
import { ContactScores } from './ContactScores';
import { ClassificationStats } from './ClassificationStats';

interface DashboardStats {
  pendingSuggestions: number;
  acceptedToday: number;
  totalContacts: number;
  avgScore: number;
  dmConversations: number;
  messagesAnalyzed: number;
}

export function ClassificationDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingSuggestions: 0,
    acceptedToday: 0,
    totalContacts: 0,
    avgScore: 0,
    dmConversations: 0,
    messagesAnalyzed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/classification/dashboard-stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            Smart Classification
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze and classify your contacts automatically
          </p>
        </div>
        <Button onClick={loadDashboardStats} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending suggestions
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSuggestions}</div>
            <p className="text-xs text-muted-foreground">
              To review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accepted today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptedToday}</div>
            <p className="text-xs text-muted-foreground">
              Validated classifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contacts analyzed
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Average score: {stats.avgScore}/100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversations DMs
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dmConversations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.messagesAnalyzed} messages analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Suggestions
            {stats.pendingSuggestions > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.pendingSuggestions}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="scores" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Scores
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <SuggestionsList onUpdate={loadDashboardStats} />
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <DMConversations />
        </TabsContent>

        <TabsContent value="scores" className="space-y-4">
          <ContactScores />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <ClassificationStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}

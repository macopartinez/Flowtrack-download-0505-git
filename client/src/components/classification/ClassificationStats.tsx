import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react';

interface ClassificationStatsData {
  categoryDistribution: Array<{ category: string; count: number }>;
  transitionHistory: Array<{ date: string; count: number }>;
  acceptanceRate: number;
  totalTransitions: number;
  avgScoreByCategory: Array<{ category: string; avgScore: number }>;
}

export function ClassificationStats() {
  const [stats, setStats] = useState<ClassificationStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/classification/stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    lead: '#6B7280',
    prospect: '#3B82F6',
    client: '#10B981',
    network: '#F59E0B'
  };

  const categoryLabels: Record<string, string> = {
    lead: 'Leads',
    prospect: 'Prospects',
    client: 'Clients',
    network: 'Network'
  };

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

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-2">
            <div className="text-6xl">📊</div>
            <h3 className="text-lg font-semibold">No statistics</h3>
            <p className="text-muted-foreground">
              Statistics will appear after the first classifications
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total transitions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransitions}</div>
            <p className="text-xs text-muted-foreground">
              Classifications made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Acceptance rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.acceptanceRate)}%</div>
            <p className="text-xs text-muted-foreground">
              Suggestions accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Classified contacts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.categoryDistribution.reduce((sum, cat) => sum + cat.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All statuses combined
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution by category</CardTitle>
            <CardDescription>
              Breakdown of your contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count }) => `${categoryLabels[category]}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.category as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Score by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Average score by category</CardTitle>
            <CardDescription>
              Classification performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.avgScoreByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  tickFormatter={(value) => categoryLabels[value] || value}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}/100`, 'Average score']}
                  labelFormatter={(label) => categoryLabels[label] || label}
                />
                <Bar dataKey="avgScore" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transition History */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transition history</CardTitle>
            <CardDescription>
              Classifications over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.transitionHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="Transitions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>
            Analysis of your classifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.acceptanceRate >= 80 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Excellent acceptance rate!</p>
                <p className="text-sm text-green-700">
                  You accept {Math.round(stats.acceptanceRate)}% of suggestions. The system is learning your preferences well.
                </p>
              </div>
            </div>
          )}

          {stats.acceptanceRate < 50 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
              <XCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900">Low acceptance rate</p>
                <p className="text-sm text-orange-700">
                  You reject {Math.round(100 - stats.acceptanceRate)}% of suggestions. The system will improve with more data.
                </p>
              </div>
            </div>
          )}

          {(stats.categoryDistribution.find(c => c.category === 'client')?.count ?? 0) > 10 && (
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-purple-900">Great growth!</p>
                <p className="text-sm text-purple-700">
                  You have {stats.categoryDistribution.find(c => c.category === 'client')?.count} classified clients. Keep it up!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

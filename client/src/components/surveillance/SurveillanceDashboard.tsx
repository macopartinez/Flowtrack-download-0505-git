import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Clock, TrendingUp, Bell, Users, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface SurveillanceConfig {
  contact_username: string;
  category: string;
  check_interval: number;
  priority: number;
  last_check_at?: string;
  next_check_at?: string;
}

interface SurveillanceAlert {
  id: number;
  contact_username: string;
  category: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
}

interface SurveillanceStats {
  byCategory: Array<{
    category: string;
    total_contacts: number;
    active_contacts: number;
    avg_interval: number;
  }>;
  trends: Array<{
    contact_username: string;
    total_checks: number;
    total_changes: number;
    successful_checks: number;
  }>;
  unreadAlerts: number;
}

export function SurveillanceDashboard() {
  const [configs, setConfigs] = useState<SurveillanceConfig[]>([]);
  const [alerts, setAlerts] = useState<SurveillanceAlert[]>([]);
  const [stats, setStats] = useState<SurveillanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [configsRes, alertsRes, statsRes] = await Promise.all([
        fetch('/api/surveillance/config', { credentials: 'include' }),
        fetch('/api/surveillance/alerts', { credentials: 'include' }),
        fetch('/api/surveillance/stats', { credentials: 'include' }),
      ]);

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigs(data.configs);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading surveillance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithClassification = async () => {
    try {
      const response = await fetch('/api/surveillance/sync-with-classification', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}`);
        loadData();
      }
    } catch (error) {
      console.error('Error syncing surveillance:', error);
    }
  };

  const markAlertAsRead = async (alertId: number) => {
    try {
      await fetch(`/api/surveillance/alerts/${alertId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      loadData();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      client: 'bg-green-500',
      prospect: 'bg-blue-500',
      network: 'bg-orange-500',
      lead: 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      client: '🎉 Client VIP',
      prospect: '📊 Prospect',
      network: '🤝 Réseau',
      lead: '🆕 Lead',
    };
    return labels[category] || category;
  };

  const getIntervalLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}j`;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    };
    return colors[severity] || 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Eye className="h-8 w-8 text-purple-500" />
            Surveillance Intelligente
          </h1>
          <p className="text-muted-foreground mt-1">
            Surveillance différenciée par catégorie de contact
          </p>
        </div>
        <Button onClick={syncWithClassification}>
          <Activity className="h-4 w-4 mr-2" />
          Synchroniser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts surveillés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.length}</div>
            <p className="text-xs text-muted-foreground">
              {configs.filter(c => c.priority === 1).length} VIP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.unreadAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">Non lues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients VIP</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byCategory.find(c => c.category === 'client')?.active_contacts || 0}
            </div>
            <p className="text-xs text-muted-foreground">Vérifiés toutes les 15min</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.trends.reduce((sum, t) => sum + t.total_changes, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Changements cette semaine</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            Alertes {stats?.unreadAlerts ? `(${stats.unreadAlerts})` : ''}
          </TabsTrigger>
          <TabsTrigger value="contacts">Contacts surveillés</TabsTrigger>
          <TabsTrigger value="categories">Par catégorie</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Aucune alerte</h3>
                <p className="text-muted-foreground">Tout est sous contrôle !</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Alert key={alert.id} variant={getSeverityColor(alert.severity) as any}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">@{alert.contact_username}</span>
                        <Badge variant="outline">{getCategoryLabel(alert.category)}</Badge>
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p>{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAlertAsRead(alert.id)}
                    >
                      Marquer comme lu
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {configs.map((config) => (
              <Card key={config.contact_username}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">@{config.contact_username}</CardTitle>
                    <Badge className={getCategoryColor(config.category)}>
                      {getCategoryLabel(config.category)}
                    </Badge>
                  </div>
                  <CardDescription>
                    Priorité {config.priority} • Vérification toutes les {getIntervalLabel(config.check_interval)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {config.last_check_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Dernière vérif: {new Date(config.last_check_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {config.next_check_at && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Prochaine: {new Date(config.next_check_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {stats?.byCategory.map((cat) => (
              <Card key={cat.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryLabel(cat.category)}
                  </CardTitle>
                  <CardDescription>
                    Fréquence moyenne: {getIntervalLabel(cat.avg_interval)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-semibold">{cat.total_contacts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Actifs</span>
                      <span className="font-semibold text-green-500">{cat.active_contacts}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 - Activité récente</CardTitle>
              <CardDescription>Contacts avec le plus de changements cette semaine</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.trends.map((trend, index) => (
                  <div key={trend.contact_username} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-purple-500">#{index + 1}</div>
                      <div>
                        <div className="font-semibold">@{trend.contact_username}</div>
                        <div className="text-sm text-muted-foreground">
                          {trend.total_checks} vérifications • {trend.successful_checks} réussies
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-lg">
                      {trend.total_changes} changements
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

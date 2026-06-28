import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Download, Trash2, Lock, Eye, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PrivacyData {
  dmCount: number;
  conversationCount: number;
  scoreCount: number;
  totalSize: string;
  encryptionEnabled: boolean;
  lastExport?: string;
}

export function PrivacySettings() {
  const [data, setData] = useState<PrivacyData>({
    dmCount: 0,
    conversationCount: 0,
    scoreCount: 0,
    totalSize: '0 KB',
    encryptionEnabled: true,
  });
  
  const [settings, setSettings] = useState({
    dmCollection: true,
    scoreCalculation: true,
    dataStorage: true,
    analytics: false,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrivacyData();
    loadSettings();
  }, []);

  const loadPrivacyData = async () => {
    try {
      const response = await fetch('/api/classification/privacy-data', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error loading privacy data:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/classification/privacy-settings', {
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setSettings(result);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    try {
      await fetch('/api/classification/privacy-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [key]: value })
      });
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/classification/export-data', {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `waler-data-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);

        setData(prev => ({ ...prev, lastExport: new Date().toISOString() }));
        setExportDialogOpen(false);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/classification/delete-data', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setData({
          dmCount: 0,
          conversationCount: 0,
          scoreCount: 0,
          totalSize: '0 KB',
          encryptionEnabled: true,
        });
        setDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-green-500" />
          Privacy & Security
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your data and privacy settings
        </p>
      </div>

      {/* Encryption Status */}
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-900">
          <strong>Encryption enabled</strong> - Your messages are protected with AES-256
        </AlertDescription>
      </Alert>

      {/* Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Your data
          </CardTitle>
          <CardDescription>
            Overview of collected data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-500">{data.dmCount}</div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{data.conversationCount}</div>
              <div className="text-xs text-muted-foreground">Conversations</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-500">{data.scoreCount}</div>
              <div className="text-xs text-muted-foreground">Scores</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">{data.totalSize}</div>
              <div className="text-xs text-muted-foreground">Storage</div>
            </div>
          </div>

          {data.lastExport && (
            <p className="text-sm text-muted-foreground">
              Last export: {new Date(data.lastExport).toLocaleDateString('en-US')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Collection settings
          </CardTitle>
          <CardDescription>
            Control which data is collected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Message collection</div>
              <div className="text-sm text-muted-foreground">
                Intercept and analyze your Instagram DMs
              </div>
            </div>
            <Switch
              checked={settings.dmCollection}
              onCheckedChange={(checked) => updateSetting('dmCollection', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Score calculation</div>
              <div className="text-sm text-muted-foreground">
                Analyze interactions to calculate scores
              </div>
            </div>
            <Switch
              checked={settings.scoreCalculation}
              onCheckedChange={(checked) => updateSetting('scoreCalculation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Data storage</div>
              <div className="text-sm text-muted-foreground">
                Keep data for history
              </div>
            </div>
            <Switch
              checked={settings.dataStorage}
              onCheckedChange={(checked) => updateSetting('dataStorage', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Anonymous analytics</div>
              <div className="text-sm text-muted-foreground">
                Help improve the service (anonymized data)
              </div>
            </div>
            <Switch
              checked={settings.analytics}
              onCheckedChange={(checked) => updateSetting('analytics', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Data management
          </CardTitle>
          <CardDescription>
            Export or delete your data (GDPR)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => setExportDialogOpen(true)}
            variant="outline"
            className="w-full justify-start"
          >
            <Download className="h-4 w-4 mr-2" />
            Export my data
          </Button>

          <Button
            onClick={() => setDeleteDialogOpen(true)}
            variant="outline"
            className="w-full justify-start text-red-500 border-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete all my data
          </Button>
        </CardContent>
      </Card>

      {/* RGPD Info */}
      <Card className="border-blue-500">
        <CardHeader>
          <CardTitle className="text-sm">GDPR Compliance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>✅ Right of access: View your data anytime</p>
          <p>✅ Right to portability: Export your data as JSON</p>
          <p>✅ Right to erasure: Delete your data permanently</p>
          <p>✅ Right to object: Disable collection anytime</p>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export your data</DialogTitle>
            <DialogDescription>
              Download all your data in JSON format
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>The file will contain:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{data.dmCount} messages (encrypted)</li>
              <li>{data.conversationCount} conversations</li>
              <li>{data.scoreCount} contact scores</li>
              <li>Classification history</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportData} disabled={loading}>
              {loading ? 'Exporting...' : 'Download'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Delete all your data
            </DialogTitle>
            <DialogDescription>
              This action is irreversible!
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              All your data will be permanently deleted:
              messages, conversations, scores and history.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteData}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

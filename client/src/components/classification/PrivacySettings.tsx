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
          Confidentialité & Sécurité
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos données et paramètres de confidentialité
        </p>
      </div>

      {/* Encryption Status */}
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-900">
          <strong>Chiffrement activé</strong> - Vos messages sont protégés par AES-256
        </AlertDescription>
      </Alert>

      {/* Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Vos données
          </CardTitle>
          <CardDescription>
            Vue d'ensemble des données collectées
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
              <div className="text-xs text-muted-foreground">Stockage</div>
            </div>
          </div>

          {data.lastExport && (
            <p className="text-sm text-muted-foreground">
              Dernier export : {new Date(data.lastExport).toLocaleDateString('fr-FR')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Paramètres de collecte
          </CardTitle>
          <CardDescription>
            Contrôlez quelles données sont collectées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Collecte des messages</div>
              <div className="text-sm text-muted-foreground">
                Intercepter et analyser vos DMs Instagram
              </div>
            </div>
            <Switch
              checked={settings.dmCollection}
              onCheckedChange={(checked) => updateSetting('dmCollection', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Calcul des scores</div>
              <div className="text-sm text-muted-foreground">
                Analyser les interactions pour calculer les scores
              </div>
            </div>
            <Switch
              checked={settings.scoreCalculation}
              onCheckedChange={(checked) => updateSetting('scoreCalculation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Stockage des données</div>
              <div className="text-sm text-muted-foreground">
                Conserver les données pour l'historique
              </div>
            </div>
            <Switch
              checked={settings.dataStorage}
              onCheckedChange={(checked) => updateSetting('dataStorage', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Analytics anonymes</div>
              <div className="text-sm text-muted-foreground">
                Aider à améliorer le service (données anonymisées)
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
            Gestion des données
          </CardTitle>
          <CardDescription>
            Exportez ou supprimez vos données (RGPD)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => setExportDialogOpen(true)}
            variant="outline"
            className="w-full justify-start"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter mes données
          </Button>

          <Button
            onClick={() => setDeleteDialogOpen(true)}
            variant="outline"
            className="w-full justify-start text-red-500 border-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer toutes mes données
          </Button>
        </CardContent>
      </Card>

      {/* RGPD Info */}
      <Card className="border-blue-500">
        <CardHeader>
          <CardTitle className="text-sm">Conformité RGPD</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>✅ Droit d'accès : Consultez vos données à tout moment</p>
          <p>✅ Droit à la portabilité : Exportez vos données en JSON</p>
          <p>✅ Droit à l'effacement : Supprimez vos données définitivement</p>
          <p>✅ Droit d'opposition : Désactivez la collecte à tout moment</p>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter vos données</DialogTitle>
            <DialogDescription>
              Téléchargez toutes vos données au format JSON
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Le fichier contiendra :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>{data.dmCount} messages (chiffrés)</li>
              <li>{data.conversationCount} conversations</li>
              <li>{data.scoreCount} scores de contacts</li>
              <li>Historique des classifications</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleExportData} disabled={loading}>
              {loading ? 'Export en cours...' : 'Télécharger'}
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
              Supprimer toutes vos données
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible !
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Toutes vos données seront définitivement supprimées :
              messages, conversations, scores et historique.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteData}
              disabled={loading}
            >
              {loading ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, TrendingUp, MessageSquare, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Suggestion {
  id: number;
  contact_username: string;
  from_category: string;
  to_category: string;
  score: number;
  confidence: number;
  reason: string;
  evidence: string;
  created_at: string;
  current_score?: number;
}

interface SuggestionsListProps {
  onUpdate?: () => void;
}

export function SuggestionsList({ onUpdate }: SuggestionsListProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/classification/suggestions', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (suggestionId: number) => {
    try {
      const response = await fetch('/api/classification/validate-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          suggestionId,
          action: 'accept'
        })
      });

      if (response.ok) {
        // Remove from list
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    }
  };

  const handleRejectClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedSuggestion) return;

    try {
      const response = await fetch('/api/classification/validate-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          suggestionId: selectedSuggestion.id,
          action: 'reject',
          reason: rejectReason
        })
      });

      if (response.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
        setRejectDialogOpen(false);
        setRejectReason('');
        setSelectedSuggestion(null);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
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

  const parseEvidence = (evidence: string): string[] => {
    try {
      return JSON.parse(evidence);
    } catch {
      return [];
    }
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

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-2">
            <div className="text-6xl">✨</div>
            <h3 className="text-lg font-semibold">Aucune suggestion</h3>
            <p className="text-muted-foreground">
              Toutes les suggestions ont été traitées !
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {suggestions.map((suggestion) => {
          const evidence = parseEvidence(suggestion.evidence);
          
          return (
            <Card key={suggestion.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryEmoji(suggestion.to_category)}
                      @{suggestion.contact_username}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getCategoryColor(suggestion.from_category)}>
                          {suggestion.from_category}
                        </Badge>
                        <span>→</span>
                        <Badge className={getCategoryColor(suggestion.to_category)}>
                          {suggestion.to_category}
                        </Badge>
                      </div>
                    </CardDescription>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-2xl font-bold text-purple-500">
                      {suggestion.score}/100
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Confiance: {Math.round(suggestion.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reason */}
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Raison</p>
                    <p className="text-sm text-muted-foreground italic">
                      {suggestion.reason}
                    </p>
                  </div>
                </div>

                {/* Evidence */}
                {evidence.length > 0 && (
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Preuves</p>
                      <ul className="space-y-1">
                        {evidence.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="text-purple-500">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(suggestion.created_at).toLocaleString('fr-FR')}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleAccept(suggestion.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accepter
                  </Button>
                  <Button
                    onClick={() => handleRejectClick(suggestion)}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la suggestion</DialogTitle>
            <DialogDescription>
              Pourquoi rejetez-vous cette suggestion pour @{selectedSuggestion?.contact_username} ?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet (optionnel)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRejectConfirm} variant="destructive">
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

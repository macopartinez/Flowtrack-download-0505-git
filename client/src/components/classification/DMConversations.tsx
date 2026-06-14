import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, TrendingUp, Send, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DMConversation {
  conversation_with: string;
  full_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  total_messages: number;
  unread_count: number;
  last_message_at: string;
  last_message_text?: string;
  last_message_is_sent?: boolean;
  avg_response_time_received_minutes?: number;
}

interface DMMessage {
  message_text: string;
  is_sent: boolean;
  sent_at: string;
}

export function DMConversations() {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/classification/dm-conversations', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (username: string) => {
    try {
      const response = await fetch(`/api/classification/dm-stats/${username}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleConversationClick = async (conversation: DMConversation) => {
    setSelectedConversation(conversation);
    setDialogOpen(true);
    await loadMessages(conversation.conversation_with);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days}j`;
    if (hours > 0) return `Il y a ${hours}h`;
    return "À l'instant";
  };

  const formatResponseTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
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

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center space-y-2">
            <div className="text-6xl">💬</div>
            <h3 className="text-lg font-semibold">Aucune conversation</h3>
            <p className="text-muted-foreground">
              Les conversations DMs apparaîtront ici une fois collectées
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {conversations.map((conv) => (
          <Card
            key={conv.conversation_with}
            className="hover:shadow-lg transition-all cursor-pointer"
            onClick={() => handleConversationClick(conv)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={conv.avatar_url} />
                  <AvatarFallback>
                    {conv.conversation_with.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base flex items-center gap-1">
                    @{conv.conversation_with}
                    {conv.is_verified && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </CardTitle>
                  {conv.full_name && (
                    <CardDescription className="text-xs">
                      {conv.full_name}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Last Message */}
              {conv.last_message_text && (
                <div className="flex items-start gap-2">
                  {conv.last_message_is_sent ? (
                    <Send className="h-3 w-3 mt-1 text-purple-500" />
                  ) : (
                    <MessageSquare className="h-3 w-3 mt-1 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {conv.last_message_text}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {conv.total_messages} messages
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(conv.last_message_at)}
                </div>
              </div>

              {/* Response Time */}
              {conv.avg_response_time_received_minutes !== undefined && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Répond en {formatResponseTime(conv.avg_response_time_received_minutes)}
                  </span>
                </div>
              )}

              {/* Unread Badge */}
              {conv.unread_count > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {conv.unread_count} non lu{conv.unread_count > 1 ? 's' : ''}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Messages Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedConversation?.avatar_url} />
                <AvatarFallback>
                  {selectedConversation?.conversation_with.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              @{selectedConversation?.conversation_with}
              {selectedConversation?.is_verified && (
                <span className="text-blue-500">✓</span>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedConversation?.total_messages} messages
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement des messages...
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.is_sent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.is_sent
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.is_sent ? 'text-purple-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(msg.sent_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

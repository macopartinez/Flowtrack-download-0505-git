import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Users, TrendingUp, Award, Search, Target, Network, Settings } from "lucide-react";
import { SettingsModal } from "../SettingsModal";
import { useAuth } from "@/hooks/use-auth";
import { ClientCard, Client } from "./ClientCard";
import { AddClientModal, NewClientData } from "./AddClientModal";
import { ClientDetailView } from "./ClientDetailView";
import { ProspectCard, Prospect } from "./ProspectCard";
import { AddProspectModal, NewProspectData } from "./AddProspectModal";
import { ProspectDetailView } from "./ProspectDetailView";
import { ConnectionCard, Connection } from "./ConnectionCard";
import { AddConnectionModal, NewConnectionData } from "./AddConnectionModal";
import { ConnectionDetailView } from "./ConnectionDetailView";

export function ProDashboard() {
  const { user, logout } = useAuth();
  const [viewMode, setViewMode] = useState<'clients' | 'prospects' | 'connections'>('clients');
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddProspect, setShowAddProspect] = useState(false);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('pro-clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        return parsed.map((c: any) => ({
          ...c,
          lastUpdated: new Date(c.lastUpdated),
          createdAt: new Date(c.createdAt),
          globalDeadline: c.globalDeadline ? new Date(c.globalDeadline) : null
        }));
      } catch (e) {
        console.error('Error loading clients:', e);
      }
    }
    
    // Default mock data if nothing saved
    return [
      {
        id: "1",
        instagramUsername: "johndoe",
        displayName: "John Doe",
        tags: ["growth", "mindset"],
        currentFollowers: 12500,
        currentFollowing: 890,
        followersChange: 450,
        followingChange: -20,
        lastUpdated: new Date(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        globalDeadline: null
      },
      {
        id: "2",
        instagramUsername: "janesmth",
        displayName: "Jane Smith",
        tags: ["product launch", "ecommerce"],
        currentFollowers: 8200,
        currentFollowing: 1200,
        followersChange: -120,
        followingChange: 50,
        lastUpdated: new Date(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        globalDeadline: null
      }
    ];
  });

  // Save clients to localStorage when they change
  useEffect(() => {
    localStorage.setItem('pro-clients', JSON.stringify(clients));
  }, [clients]);

  // Prospects state with localStorage
  const [prospects, setProspects] = useState<Prospect[]>(() => {
    const saved = localStorage.getItem('pro-prospects');
    console.log('🔍 [Prospects] Loading from localStorage:', saved ? `${JSON.parse(saved).length} prospects found` : 'No data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loaded = parsed.map((p: any) => ({
          ...p,
          addedAt: new Date(p.addedAt),
          convertedAt: p.convertedAt ? new Date(p.convertedAt) : undefined,
          lastSignal: p.lastSignal ? { ...p.lastSignal, timestamp: new Date(p.lastSignal.timestamp) } : undefined,
          signals: p.signals.map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) }))
        }));
        console.log('✅ [Prospects] Loaded successfully:', loaded.length, 'prospects');
        return loaded;
      } catch (e) {
        console.error('❌ [Prospects] Error loading:', e);
      }
    }
    console.log('⚠️ [Prospects] No saved data, starting with empty array');
    return [];
  });

  useEffect(() => {
    console.log('💾 [Prospects] Saving to localStorage:', prospects.length, 'prospects');
    localStorage.setItem('pro-prospects', JSON.stringify(prospects));
  }, [prospects]);

  const handleAddProspect = (newProspect: NewProspectData) => {
    const prospect: Prospect = {
      id: Date.now().toString(),
      ...newProspect,
      addedAt: new Date(),
      score: calculateInitialScore(newProspect),
      signals: [],
      converted: false,
      notes: ''
    };
    console.log('➕ [Prospects] Adding new prospect:', prospect);
    setProspects([...prospects, prospect]);
    setShowAddProspect(false);
  };

  const calculateInitialScore = (prospect: NewProspectData): number => {
    let score = 30; // Base score
    if (prospect.followsYou) score += 30;
    if (prospect.youFollow) score += 10;
    if (prospect.status === 'hot') score += 20;
    if (prospect.status === 'warm') score += 10;
    return Math.min(score, 100);
  };

  const handleUpdateProspect = (updated: Prospect) => {
    setProspects(prospects.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteProspect = (id: string) => {
    setProspects(prospects.filter(p => p.id !== id));
    setSelectedProspect(null);
  };

  const filteredProspects = prospects.filter(prospect =>
    prospect.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prospect.instagramUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (prospect.sector && prospect.sector.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Prospect stats
  const totalProspects = prospects.length;
  const prospectsFollowingBack = prospects.filter(p => p.followsYou).length;
  const convertedProspects = prospects.filter(p => p.converted).length;
  const conversionRate = totalProspects > 0 ? Math.round((convertedProspects / totalProspects) * 100) : 0;

  // Connections state with localStorage
  const [connections, setConnections] = useState<Connection[]>(() => {
    const saved = localStorage.getItem('pro-connections');
    console.log('🔍 [Connections] Loading from localStorage:', saved ? `${JSON.parse(saved).length} connections found` : 'No data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loaded = parsed.map((c: any) => ({
          ...c,
          addedAt: new Date(c.addedAt),
          lastActivity: c.lastActivity ? new Date(c.lastActivity) : undefined,
          signals: c.signals.map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) }))
        }));
        console.log('✅ [Connections] Loaded successfully:', loaded.length, 'connections');
        return loaded;
      } catch (e) {
        console.error('❌ [Connections] Error loading:', e);
      }
    }
    console.log('⚠️ [Connections] No saved data, starting with empty array');
    return [];
  });

  useEffect(() => {
    console.log('💾 [Connections] Saving to localStorage:', connections.length, 'connections');
    localStorage.setItem('pro-connections', JSON.stringify(connections));
  }, [connections]);

  const handleAddConnection = (newConnection: NewConnectionData) => {
    const connection: Connection = {
      id: Date.now().toString(),
      ...newConnection,
      addedAt: new Date(),
      healthScore: calculateHealthScore(newConnection),
      followDuration: 0,
      signals: [],
      notes: ''
    };
    console.log('➕ [Connections] Adding new connection:', connection);
    setConnections([...connections, connection]);
    setShowAddConnection(false);
  };

  const calculateHealthScore = (connection: NewConnectionData | Connection): number => {
    let score = 50; // Base score
    if ('followsYou' in connection && connection.followsYou && connection.youFollow) score += 30; // Mutual
    else if ('followsYou' in connection && connection.followsYou) score += 15;
    else if ('youFollow' in connection && connection.youFollow) score += 10;
    
    if ('followDuration' in connection) {
      if (connection.followDuration > 365) score += 20; // Long connection
      else if (connection.followDuration > 180) score += 10;
    }
    
    return Math.min(score, 100);
  };

  const handleUpdateConnection = (updated: Connection) => {
    setConnections(connections.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(connections.filter(c => c.id !== id));
    setSelectedConnection(null);
  };

  const filteredConnections = connections.filter(connection =>
    connection.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.instagramUsername.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Connection stats
  const totalConnections = connections.length;
  const vipConnections = connections.filter(c => c.circle === 'vip').length;
  const mutualConnections = connections.filter(c => c.followsYou && c.youFollow).length;
  const avgHealthScore = totalConnections > 0 
    ? Math.round(connections.reduce((sum, c) => sum + c.healthScore, 0) / totalConnections)
    : 0;

  const handleAddClient = (newClient: NewClientData) => {
    const client: Client = {
      id: Date.now().toString(),
      ...newClient,
      currentFollowers: 0,
      currentFollowing: 0,
      followersChange: 0,
      followingChange: 0,
      lastUpdated: new Date(),
      createdAt: new Date(),
      globalDeadline: null
    };
    setClients([...clients, client]);
    setShowAddClient(false);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowAddClient(true);
  };

  const handleDeleteClientFromCard = (client: Client) => {
    setClients(clients.filter(c => c.id !== client.id));
  };

  const filteredClients = clients.filter(client =>
    client.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.instagramUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate stats
  const totalClients = clients.length;
  const totalFollowersGained = clients.reduce((sum, c) => sum + Math.max(0, c.followersChange), 0);
  const avgFollowersPerClient = totalClients > 0 
    ? Math.round(clients.reduce((sum, c) => sum + c.currentFollowers, 0) / totalClients)
    : 0;

  console.log("ProDashboard Stats:", { totalClients, totalFollowersGained, avgFollowersPerClient });

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
    setSelectedClient(null);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(clients.filter(c => c.id !== clientId));
    setSelectedClient(null);
  };

  // Show detail view if client is selected
  if (selectedClient) {
    return (
      <ClientDetailView
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onUpdate={handleUpdateClient}
        onDelete={() => handleDeleteClient(selectedClient.id)}
      />
    );
  }

  // Show detail view if prospect is selected
  if (selectedProspect) {
    return (
      <ProspectDetailView
        prospect={selectedProspect}
        onBack={() => setSelectedProspect(null)}
        onUpdate={handleUpdateProspect}
        onDelete={() => handleDeleteProspect(selectedProspect.id)}
      />
    );
  }

  // Show detail view if connection is selected
  if (selectedConnection) {
    return (
      <ConnectionDetailView
        connection={selectedConnection}
        onBack={() => setSelectedConnection(null)}
        onUpdate={handleUpdateConnection}
        onDelete={() => handleDeleteConnection(selectedConnection.id)}
      />
    );
  }

  return (
    <div className="min-h-screen text-white relative z-10">
      {/* Floating Vertical Sidebar */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-xl border border-white/20 rounded-3xl flex flex-col items-center py-6 gap-3 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <button
          onClick={() => setViewMode('clients')}
          className={`w-14 h-14 rounded-2xl transition-all flex flex-col items-center justify-center gap-0.5 ${
            viewMode === 'clients'
              ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:scale-105'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Clients</span>
        </button>
        
        <button
          onClick={() => setViewMode('prospects')}
          className={`w-14 h-14 rounded-2xl transition-all flex flex-col items-center justify-center gap-0.5 ${
            viewMode === 'prospects'
              ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:scale-105'
          }`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Prospects</span>
        </button>
        
        <button
          onClick={() => setViewMode('connections')}
          className={`w-14 h-14 rounded-2xl transition-all flex flex-col items-center justify-center gap-0.5 ${
            viewMode === 'connections'
              ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:scale-105'
          }`}
        >
          <Network className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Network</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6 ml-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-4xl font-display font-black mb-2">
                {viewMode === 'clients' ? 'Client Management' : 
                 viewMode === 'prospects' ? 'Pipeline Prospects' : 
                 'Circle Manager'}
              </h1>
              <p className="text-gray-400">
                {viewMode === 'clients' 
                  ? 'Track and manage your coaching clients' 
                  : viewMode === 'prospects'
                  ? 'Manage your prospect pipeline and detect signals'
                  : 'Manage your important connections by priority circles'}
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {viewMode === 'clients' ? (
              <>
                {/* Total Clients */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-2 border-purple-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Total Clients</span>
                  </div>
                  <p className="text-4xl font-black text-white">{totalClients}</p>
                </div>

                {/* Followers Gained */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-green-500/20 to-green-500/10 border-2 border-green-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Followers Gained</span>
                  </div>
                  <p className="text-4xl font-black text-white">+{totalFollowersGained.toLocaleString()}</p>
                  <span className="text-xs text-gray-400">This week</span>
                </div>

                {/* Avg per Client */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center">
                      <Award className="w-5 h-5 text-blue-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Avg per Client</span>
                  </div>
                  <p className="text-4xl font-black text-white">{avgFollowersPerClient.toLocaleString()}</p>
                  <span className="text-xs text-gray-400">Followers</span>
                </div>

                {/* Success Rate */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/30 flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Success Rate</span>
                  </div>
                  <p className="text-4xl font-black text-white">87%</p>
                  <span className="text-xs text-gray-400">Clients growing</span>
                </div>
              </>
            ) : viewMode === 'prospects' ? (
              <>
                {/* Total Prospects */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-2 border-purple-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Prospects Added</span>
                  </div>
                  <p className="text-4xl font-black text-white">{totalProspects}</p>
                  <span className="text-xs text-gray-400">This month</span>
                </div>

                {/* Following Back */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-green-500/20 to-green-500/10 border-2 border-green-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Following Back</span>
                  </div>
                  <p className="text-4xl font-black text-white">{prospectsFollowingBack}</p>
                  <span className="text-xs text-gray-400">
                    {totalProspects > 0 ? `${Math.round((prospectsFollowingBack / totalProspects) * 100)}%` : '0%'}
                  </span>
                </div>

                {/* Converted */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Converted to Clients</span>
                  </div>
                  <p className="text-4xl font-black text-white">{convertedProspects}</p>
                  <span className="text-xs text-gray-400">{conversionRate}% conversion</span>
                </div>

                {/* Conversion Rate */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/30 flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Conversion Rate</span>
                  </div>
                  <p className="text-4xl font-black text-white">{conversionRate}%</p>
                  <span className="text-xs text-gray-400">Network</span>
                </div>
              </>
            ) : viewMode === 'connections' ? (
              <>
                {/* Total Connections */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-2 border-purple-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                      <Network className="w-5 h-5 text-purple-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Total Connections</span>
                  </div>
                  <p className="text-4xl font-black text-white">{totalConnections}</p>
                </div>

                {/* VIP Connections */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/30 flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">VIP Circle</span>
                  </div>
                  <p className="text-4xl font-black text-white">{vipConnections}</p>
                  <span className="text-xs text-gray-400">Max 10</span>
                </div>

                {/* Mutual Connections */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-green-500/20 to-green-500/10 border-2 border-green-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Mutual Connections</span>
                  </div>
                  <p className="text-4xl font-black text-white">{mutualConnections}</p>
                  <span className="text-xs text-gray-400">
                    {totalConnections > 0 ? `${Math.round((mutualConnections / totalConnections) * 100)}%` : '0%'}
                  </span>
                </div>

                {/* Avg Health Score */}
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Average Score</span>
                  </div>
                  <p className="text-4xl font-black text-white">{avgHealthScore}/100</p>
                  <span className="text-xs text-gray-400">Network Health</span>
                </div>
              </>
            ) : null}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={viewMode === 'clients' 
                ? "Search clients by name, username, or tags..." 
                : viewMode === 'prospects'
                ? "Search prospects by name, username, or sector..."
                : "Search connections by name or username..."}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/80 backdrop-blur-sm border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8">
        {viewMode === 'clients' ? (
          filteredClients.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {searchQuery ? "No clients found" : "No clients yet"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Add your first client to start tracking their growth"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddClient(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Your First Client
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => setSelectedClient(client)}
                  onEdit={handleEditClient}
                  onDelete={handleDeleteClientFromCard}
                />
              ))}
            </div>
          )
        ) : viewMode === 'prospects' ? (
          filteredProspects.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {searchQuery ? "No prospects found" : "No prospects yet"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Add your first prospect to start closing"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddProspect(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Your First Prospect
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onClick={() => setSelectedProspect(prospect)}
                  onDelete={(p) => handleDeleteProspect(p.id)}
                />
              ))}
            </div>
          )
        ) : viewMode === 'connections' ? (
          filteredConnections.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Network className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {searchQuery ? "No connections found" : "No connections yet"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Add your first connection to start networking"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddConnection(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  Add Your First Connection
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConnections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onClick={() => setSelectedConnection(connection)}
                  onDelete={(c) => handleDeleteConnection(c.id)}
                />
              ))}
            </div>
          )
        ) : null}
        </div>
      </div>

      {/* Floating Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-8 left-8 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        aria-label="Settings"
      >
        <Settings className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Floating Add Button */}
      <button
        onClick={() => 
          viewMode === 'clients' ? setShowAddClient(true) : 
          viewMode === 'prospects' ? setShowAddProspect(true) : 
          setShowAddConnection(true)
        }
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-[0_0_40px_rgba(34,197,94,0.6)] hover:shadow-[0_0_60px_rgba(34,197,94,0.8)] transition-all hover:scale-110 flex items-center justify-center z-50"
        title={viewMode === 'clients' ? 'Add Client' : viewMode === 'prospects' ? 'Add Prospect' : 'Add Connection'}
      >
        <UserPlus className="w-7 h-7" />
      </button>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddClient}
        onClose={() => setShowAddClient(false)}
        onAdd={handleAddClient}
      />

      {/* Add Prospect Modal */}
      <AddProspectModal
        isOpen={showAddProspect}
        onClose={() => setShowAddProspect(false)}
        onAdd={handleAddProspect}
      />

      {/* Add Connection Modal */}
      <AddConnectionModal
        isOpen={showAddConnection}
        onClose={() => setShowAddConnection(false)}
        onAdd={handleAddConnection}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={logout}
        user={{
          username: user?.username,
          email: user?.email
        }}
      />
    </div>
  );
}

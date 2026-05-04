import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Users, TrendingUp, Award, Search, Target, Network, Settings, CheckCircle, Crown, Star, Eye } from "lucide-react";
import { ClientCard, Client } from "./ClientCard";
import { AddClientModal, NewClientData } from "./AddClientModal";
import { ClientDetailView } from "./ClientDetailView";
import { PersonCard } from "./PersonCard";
import { AddPersonModal, NewPersonData } from "./AddPersonModal";
import { PersonDetailView } from "./PersonDetailView";
import { AddFollowerChoiceModal } from "./AddFollowerChoiceModal";
import { ProSettingsModal } from "./ProSettingsModal";
import { AnalyzingOverlay } from "./AnalyzingOverlay";
import { ProTutorial } from "./ProTutorial";
import { Person, PersonTag, ProspectStatus, Circle } from "./types";

export function ProDashboard() {
  const [viewMode, setViewMode] = useState<'clients' | 'people'>('clients');
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showFollowerChoice, setShowFollowerChoice] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingFollowerUsername, setPendingFollowerUsername] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | PersonTag>('all');
  const [analyzingPerson, setAnalyzingPerson] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('pro-tutorial-completed');
  });

  // Clients state (unchanged)
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('pro-clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
    return [];
  });

  useEffect(() => {
    localStorage.setItem('pro-clients', JSON.stringify(clients));
  }, [clients]);

  // People state with migration from old localStorage
  const [people, setPeople] = useState<Person[]>(() => {
    // Check if we already have migrated data
    const savedPeople = localStorage.getItem('pro-people');
    if (savedPeople) {
      try {
        const parsed = JSON.parse(savedPeople);
        const loaded = parsed.map((p: any) => ({
          ...p,
          addedAt: new Date(p.addedAt),
          convertedAt: p.convertedAt ? new Date(p.convertedAt) : undefined,
          lastActivity: p.lastActivity ? new Date(p.lastActivity) : undefined,
          signals: p.signals.map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) }))
        }));
        console.log('✅ [People] Loaded from localStorage:', loaded.length, 'people');
        return loaded;
      } catch (e) {
        console.error('❌ [People] Error loading:', e);
      }
    }

    // Migration: merge old prospects and connections
    console.log('🔄 [People] Migrating from old localStorage...');
    const migratedPeople: Person[] = [];
    const usernameMap = new Map<string, Person>();

    // Migrate prospects
    const oldProspects = localStorage.getItem('pro-prospects');
    if (oldProspects) {
      try {
        const prospects = JSON.parse(oldProspects);
        console.log(`📥 Migrating ${prospects.length} prospects...`);
        prospects.forEach((p: any) => {
          const person: Person = {
            id: p.id,
            instagramUsername: p.instagramUsername,
            displayName: p.displayName,
            followsYou: p.followsYou,
            youFollow: p.youFollow,
            addedAt: new Date(p.addedAt),
            notes: p.notes || '',
            signals: p.signals.map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) })),
            sector: p.sector,
            tags: ['prospect'],
            prospectStatus: p.status,
            score: p.score,
            converted: p.converted,
            convertedAt: p.convertedAt ? new Date(p.convertedAt) : undefined
          };
          usernameMap.set(p.instagramUsername.toLowerCase(), person);
        });
      } catch (e) {
        console.error('Error migrating prospects:', e);
      }
    }

    // Migrate connections
    const oldConnections = localStorage.getItem('pro-connections');
    if (oldConnections) {
      try {
        const connections = JSON.parse(oldConnections);
        console.log(`📥 Migrating ${connections.length} connections...`);
        connections.forEach((c: any) => {
          const username = c.instagramUsername.toLowerCase();
          const existing = usernameMap.get(username);
          
          if (existing) {
            // Merge: add circle tag
            existing.tags.push(c.circle);
            existing.circle = c.circle;
            existing.healthScore = c.healthScore;
            existing.followDuration = c.followDuration;
            existing.lastActivity = c.lastActivity ? new Date(c.lastActivity) : undefined;
            existing.mutualConnections = c.mutualConnections;
          } else {
            // New person
            const person: Person = {
              id: c.id,
              instagramUsername: c.instagramUsername,
              displayName: c.displayName,
              followsYou: c.followsYou,
              youFollow: c.youFollow,
              addedAt: new Date(c.addedAt),
              notes: c.notes || '',
              signals: c.signals.map((s: any) => ({ ...s, timestamp: new Date(s.timestamp) })),
              tags: [c.circle],
              circle: c.circle,
              healthScore: c.healthScore,
              followDuration: c.followDuration,
              lastActivity: c.lastActivity ? new Date(c.lastActivity) : undefined,
              mutualConnections: c.mutualConnections
            };
            usernameMap.set(username, person);
          }
        });
      } catch (e) {
        console.error('Error migrating connections:', e);
      }
    }

    const migrated = Array.from(usernameMap.values());
    console.log(`✅ [People] Migration complete: ${migrated.length} people`);
    
    // Save migrated data
    if (migrated.length > 0) {
      localStorage.setItem('pro-people', JSON.stringify(migrated));
    }
    
    return migrated;
  });

  useEffect(() => {
    console.log('💾 [People] Saving to localStorage:', people.length, 'people');
    localStorage.setItem('pro-people', JSON.stringify(people));
  }, [people]);

  const handleAddPerson = async (newPerson: NewPersonData) => {
    const tags: PersonTag[] = [];
    if (newPerson.isProspect) tags.push('prospect');
    if (newPerson.isInCircle && newPerson.circle) tags.push(newPerson.circle);

    const person: Person = {
      id: Date.now().toString(),
      instagramUsername: newPerson.instagramUsername,
      displayName: newPerson.displayName,
      followsYou: newPerson.followsYou,
      youFollow: newPerson.youFollow,
      addedAt: new Date(),
      notes: '',
      signals: [],
      sector: newPerson.sector,
      tags,
      prospectStatus: newPerson.prospectStatus,
      circle: newPerson.circle,
      score: newPerson.isProspect ? calculateInitialScore(newPerson) : undefined,
      healthScore: newPerson.isInCircle ? calculateInitialHealthScore(newPerson) : undefined,
      followDuration: 0,
      analysisStatus: 'analyzing'
    };

    console.log('➕ [People] Adding new person:', person);
    setPeople([...people, person]);
    setShowAddPerson(false);
    
    // Trigger agent automatically
    setTimeout(async () => {
      try {
        console.log('Triggering agent for prospect:', newPerson.instagramUsername);
        const response = await fetch(`/api/pro/trigger-agent-prospect/${person.id}`, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Agent started:', data.message);
        }
      } catch (error) {
        console.log('Agent trigger skipped (backend may be unavailable)');
      }
    }, 100);
    
    setAnalyzingPerson(newPerson.instagramUsername);
    
    try {
      const response = await fetch('/api/pro/analyze-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instagramUsername: newPerson.instagramUsername })
      });
      
      if (response.ok) {
        console.log('🔍 Analysis started for', newPerson.instagramUsername);
        startPollingAnalysis(person.id, newPerson.instagramUsername);
      }
    } catch (error) {
      console.error('Failed to start analysis:', error);
      setAnalyzingPerson(null);
      setPeople(people.map(p => 
        p.id === person.id ? { ...p, analysisStatus: 'failed' } : p
      ));
    }
  };

  const calculateInitialScore = (data: NewPersonData): number => {
    let score = 30;
    if (data.followsYou) score += 30;
    if (data.youFollow) score += 10;
    if (data.prospectStatus === 'hot') score += 20;
    if (data.prospectStatus === 'warm') score += 10;
    return Math.min(score, 100);
  };

  const calculateInitialHealthScore = (data: NewPersonData): number => {
    let score = 50;
    if (data.followsYou && data.youFollow) score += 30;
    else if (data.followsYou) score += 15;
    else if (data.youFollow) score += 10;
    return Math.min(score, 100);
  };

  const handleUpdatePerson = (updated: Person) => {
    console.log('📝 handleUpdatePerson called:', updated.displayName, updated.prospectStatus, updated.circle, updated.converted);
    setPeople(people.map(p => p.id === updated.id ? updated : p));
    // Also update selectedPerson to reflect changes
    setSelectedPerson(updated);
  };

  const startPollingAnalysis = (personId: string, username: string) => {
    // L'agent Pro Circle gère l'analyse directement
    console.log('Analysis will be handled by Agent Pro Circle for:', username);
  };

  const handleDeletePerson = (id: string) => {
    setPeople(people.filter(p => p.id !== id));
    setSelectedPerson(null);
  };

  // Filter people by active filter
  const filteredPeople = people.filter(person => {
    // Apply tag filter
    if (activeFilter !== 'all' && !person.tags.includes(activeFilter)) {
      return false;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        person.displayName.toLowerCase().includes(query) ||
        person.instagramUsername.toLowerCase().includes(query) ||
        (person.sector && person.sector.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // People stats (dynamic based on filter)
  const getFilteredStats = () => {
    const filtered = activeFilter === 'all' ? people : people.filter(p => p.tags.includes(activeFilter));
    
    const totalPeople = filtered.length;
    const prospects = filtered.filter(p => p.tags.includes('prospect'));
    const vipPeople = filtered.filter(p => p.tags.includes('vip'));
    const mutualPeople = filtered.filter(p => p.followsYou && p.youFollow);
    const convertedPeople = filtered.filter(p => p.converted);
    
    const avgScore = prospects.length > 0
      ? Math.round(prospects.reduce((sum, p) => sum + (p.score || 0), 0) / prospects.length)
      : 0;
    
    const avgHealthScore = filtered.filter(p => p.healthScore !== undefined).length > 0
      ? Math.round(filtered.reduce((sum, p) => sum + (p.healthScore || 0), 0) / filtered.filter(p => p.healthScore !== undefined).length)
      : 0;

    return {
      totalPeople,
      prospects: prospects.length,
      vipPeople: vipPeople.length,
      mutualPeople: mutualPeople.length,
      convertedPeople: convertedPeople.length,
      conversionRate: prospects.length > 0 ? Math.round((convertedPeople.length / prospects.length) * 100) : 0,
      avgScore,
      avgHealthScore
    };
  };

  const stats = getFilteredStats();

  // Client handlers
  const handleAddClient = async (newClient: NewClientData) => {
    try {
      // 1. Sauvegarder dans la BDD
      console.log('Saving client to database:', newClient.instagramUsername);
      const createResponse = await fetch('/api/pro/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          instagramUsername: newClient.instagramUsername,
          displayName: newClient.displayName,
          tags: newClient.tags || [],
          notes: '',
          initialGoal: newClient.initialGoal || ''
        })
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create client in database');
      }
      
      const { clientId } = await createResponse.json();
      console.log('Client saved with ID:', clientId);
      
      // 2. Ajouter au state local
      const client: Client = {
        id: clientId.toString(),
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
      
      // 3. Déclencher l'agent automatiquement
      setTimeout(async () => {
        try {
          console.log('Triggering agent for client:', newClient.instagramUsername);
          const response = await fetch(`/api/pro/trigger-agent-client/${clientId}`, {
            method: 'POST',
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Agent started:', data.message);
          }
        } catch (error) {
          console.log('Agent trigger skipped');
        }
      }, 100);
    } catch (error) {
      console.error('Error adding client:', error);
    }
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

  const totalClients = clients.length;
  const totalFollowersGained = clients.reduce((sum, c) => sum + Math.max(0, c.followersChange), 0);
  const avgFollowersPerClient = totalClients > 0 
    ? Math.round(clients.reduce((sum, c) => sum + c.currentFollowers, 0) / totalClients)
    : 0;

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
    setSelectedClient(null);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(clients.filter(c => c.id !== clientId));
    setSelectedClient(null);
  };

  // Show detail views
  if (selectedClient) {
    console.log('📋 Rendering ClientDetailView for:', selectedClient.displayName);
    return (
      <ClientDetailView
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onUpdate={handleUpdateClient}
        onDelete={() => handleDeleteClient(selectedClient.id)}
      />
    );
  }

  console.log('🔍 ProDashboard render - selectedPerson:', selectedPerson ? selectedPerson.displayName : 'null');

  if (selectedPerson) {
    console.log('👤 EARLY RETURN - Rendering PersonDetailView for:', selectedPerson.displayName, selectedPerson);
    return (
      <div className="w-full h-full">
        <PersonDetailView
          person={selectedPerson}
          onBack={() => {
            console.log('🔙 PersonDetailView onBack called');
            setSelectedPerson(null);
          }}
          onUpdate={handleUpdatePerson}
          onDelete={() => handleDeletePerson(selectedPerson.id)}
        />
      </div>
    );
  }

  console.log('📊 Rendering main dashboard');

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
          onClick={() => {
            setViewMode('people');
            setActiveFilter('all');
          }}
          className={`w-14 h-14 rounded-2xl transition-all flex flex-col items-center justify-center gap-0.5 ${
            viewMode === 'people'
              ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:scale-105'
          }`}
        >
          <Network className="w-5 h-5" />
          <span className="text-[10px] font-semibold">People</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6 ml-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-4xl font-display font-black mb-2">
                {viewMode === 'clients' ? 'Client Management' : 'People Network'}
              </h1>
              <p className="text-gray-400">
                {viewMode === 'clients' 
                  ? 'Track and manage your coaching clients' 
                  : 'Manage your prospects and connections in one place'}
              </p>
            </div>
          </div>

          {/* Filter Chips (People view only) */}
          {viewMode === 'people' && (
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-purple-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Target className="w-4 h-4 text-green-400" /> Tous ({people.length})
              </button>
              <button
                onClick={() => setActiveFilter('prospect')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeFilter === 'prospect'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Target className="w-4 h-4 text-green-400" /> Prospects ({people.filter(p => p.tags.includes('prospect')).length})
              </button>
              <button
                onClick={() => setActiveFilter('vip')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeFilter === 'vip'
                    ? 'bg-yellow-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Crown className="w-4 h-4 text-green-400" /> VIP ({people.filter(p => p.tags.includes('vip')).length})
              </button>
              <button
                onClick={() => setActiveFilter('keep')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeFilter === 'keep'
                    ? 'bg-blue-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Star className="w-4 h-4 text-green-400" /> À garder ({people.filter(p => p.tags.includes('keep')).length})
              </button>
              <button
                onClick={() => setActiveFilter('watch')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeFilter === 'watch'
                    ? 'bg-gray-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Eye className="w-4 h-4 text-green-400" /> À surveiller ({people.filter(p => p.tags.includes('watch')).length})
              </button>
              <button
                onClick={() => setActiveFilter('converted')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeFilter === 'converted'
                    ? 'bg-emerald-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-green-400" /> Convertis ({people.filter(p => p.converted).length})
              </button>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {viewMode === 'clients' ? (
              <>
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-2 border-purple-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Total Clients</span>
                  </div>
                  <p className="text-4xl font-black text-white">{totalClients}</p>
                </div>

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
            ) : (
              <>
                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-2 border-purple-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center">
                      <Network className="w-5 h-5 text-purple-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">
                      {activeFilter === 'all' ? 'Total People' : 'Filtered'}
                    </span>
                  </div>
                  <p className="text-4xl font-black text-white">{stats.totalPeople}</p>
                </div>

                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-green-500/20 to-green-500/10 border-2 border-green-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center">
                      <Target className="w-5 h-5 text-green-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Prospects</span>
                  </div>
                  <p className="text-4xl font-black text-white">{stats.prospects}</p>
                  <span className="text-xs text-gray-400">
                    {stats.convertedPeople} convertis ({stats.conversionRate}%)
                  </span>
                </div>

                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/30 flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">VIP Circle</span>
                  </div>
                  <p className="text-4xl font-black text-white">{stats.vipPeople}</p>
                  <span className="text-xs text-gray-400">Max 10</span>
                </div>

                <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-300" />
                    </div>
                    <span className="text-sm text-gray-300 font-semibold">Avg Health</span>
                  </div>
                  <p className="text-4xl font-black text-white">{stats.avgHealthScore}/100</p>
                  <span className="text-xs text-gray-400">Network quality</span>
                </div>
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={viewMode === 'clients' 
                ? "Search clients by name, username, or tags..." 
                : "Search people by name, username, or sector..."}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/80 backdrop-blur-sm border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Add Button */}
          <div className="mb-6">
            <button
              onClick={() => viewMode === 'clients' ? setShowAddClient(true) : setShowAddPerson(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
            >
              <UserPlus className="w-5 h-5" />
              {viewMode === 'clients' ? 'Add Client' : 'Add Person'}
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-8 max-w-7xl mx-auto">
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
                    ? "Try adjusting your search query"
                    : "Add your first client to start tracking their growth"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddClient(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all"
                  >
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
          ) : (
            filteredPeople.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Network className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {searchQuery || activeFilter !== 'all' ? "No people found" : "No people yet"}
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery || activeFilter !== 'all'
                    ? "Try adjusting your filters or search query"
                    : "Add your first person to start building your network"}
                </p>
                {!searchQuery && activeFilter === 'all' && (
                  <button
                    onClick={() => setShowAddPerson(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all"
                  >
                    Add Your First Person
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPeople.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onClick={() => {
                      console.log('🖱️ PersonCard clicked:', person.displayName, person);
                      setSelectedPerson(person);
                    }}
                    onEdit={(p) => {
                      console.log('✏️ PersonCard edit clicked:', p.displayName);
                      setSelectedPerson(p);
                    }}
                    onDelete={(p) => handleDeletePerson(p.id)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
        <button
          onClick={() => setShowTutorial(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
          aria-label="Tutorial"
          title="Ouvrir le guide du Mode Pro"
        >
          <span className="text-2xl">?</span>
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Modals */}
      <AddClientModal
        isOpen={showAddClient}
        onClose={() => {
          setShowAddClient(false);
          setEditingClient(null);
        }}
        onAdd={handleAddClient}
      />

      <AddPersonModal
        isOpen={showAddPerson}
        onClose={() => setShowAddPerson(false)}
        onAdd={handleAddPerson}
      />

      <AddFollowerChoiceModal
        isOpen={showFollowerChoice}
        onClose={() => {
          setShowFollowerChoice(false);
          setPendingFollowerUsername('');
        }}
        onChooseClient={() => {
          setShowAddClient(true);
          // TODO: Pre-fill with follower data
        }}
        onChoosePerson={() => {
          setShowAddPerson(true);
          // TODO: Pre-fill with follower data
        }}
        followerUsername={pendingFollowerUsername}
      />

      <ProSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onClearData={() => {
          setClients([]);
          setPeople([]);
        }}
      />

      {/* Analyzing Overlay */}
      <AnimatePresence>
        {analyzingPerson && (
          <AnalyzingOverlay username={analyzingPerson} />
        )}
      </AnimatePresence>

      {/* Tutorial */}
      <ProTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}

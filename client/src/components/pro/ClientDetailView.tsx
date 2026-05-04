import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Tag, Edit, Trash, Save, X, Lock, Unlock, Link2, Highlighter, Download } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceDot } from "recharts";
import { Client } from "./ClientCard";
import { exportToPDF } from "../../utils/pdfExport";

interface ClientDetailViewProps {
  client: Client;
  onBack: () => void;
  onUpdate: (client: Client) => void;
  onDelete: () => void;
}

// Mock historical data
const generateMockHistory = (days: number = 30) => {
  const data = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to midnight
  // Generate data for the last 'days' days (including today)
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0); // Ensure all dates are at midnight
    data.push({
      date: date.getTime(), // Use timestamp for proportional spacing
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date,
      followers: 10000 + Math.floor(Math.random() * 3000) + (days - i) * 100,
      following: 800 + Math.floor(Math.random() * 200) - (days - i) * 2
    });
  }
  return data;
};

type GoalType = 'followers' | 'views' | 'posts_daily' | 'posts_weekly' | 'posts_monthly' | 'custom';

type Milestone = {
  id: string;
  title: string;
  completed: boolean;
  status: 'success' | 'failed' | null;
  date: Date | null;
  deadline: Date | null; // Countdown deadline
  deadlineSetAt: Date | null; // When the deadline was set
  createdAt: Date; // When the milestone was created
  goalType?: GoalType;
  goalTarget?: number; // Target value for the goal
  goalCurrent?: number; // Current value (auto-updated by agents)
  isRecurring?: boolean; // True if this milestone auto-duplicates
  recurringGroupId?: string; // ID to group recurring instances together
  recurringPeriod?: 'daily' | 'weekly' | 'monthly'; // Period for recurrence
  instanceDate?: Date; // Specific date for this instance (for recurring milestones)
};

type NoteAnnotation = {
  id: string;
  start: number;
  end: number;
  type: 'link' | 'highlight' | 'milestone';
  value: string; // URL for link, color for highlight, milestone ID for milestone
  text: string;
};

export function ClientDetailView({ client, onBack, onUpdate, onDelete }: ClientDetailViewProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem(`client-${client.id}-notes`);
    return saved || "Initial notes about this client...";
  });
  const [tempNotes, setTempNotes] = useState(notes);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneGoalType, setNewMilestoneGoalType] = useState<GoalType | ''>('');
  const [newMilestoneGoalTarget, setNewMilestoneGoalTarget] = useState<number | ''>('');
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [showFollowers, setShowFollowers] = useState(true);
  const [showFollowing, setShowFollowing] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [groupedMilestonesAtDate, setGroupedMilestonesAtDate] = useState<{date: number, milestones: Milestone[]} | null>(null);
  const [lockedMilestones, setLockedMilestones] = useState<Set<string>>(new Set());
  const [, setCountdownTick] = useState(0); // Force re-render for countdown
  const [annotations, setAnnotations] = useState<NoteAnnotation[]>(() => {
    const saved = localStorage.getItem(`client-${client.id}-annotations`);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedText, setSelectedText] = useState<{start: number, end: number, text: string} | null>(null);
  const textareaRef = useState<HTMLTextAreaElement | null>(null)[0];
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem(`client-${client.id}-milestones`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          date: m.date ? new Date(m.date) : null,
          deadline: m.deadline ? new Date(m.deadline) : null,
          deadlineSetAt: m.deadlineSetAt ? new Date(m.deadlineSetAt) : null,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(), // Fallback for old milestones
          instanceDate: m.instanceDate ? new Date(m.instanceDate) : undefined
        }));
      } catch (e) {
        console.error('Error loading milestones:', e);
        return [];
      }
    }
    // Default milestones if nothing saved
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);
    
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);
    
    return [
      { id: '1', title: 'Reached 10K followers', completed: true, status: 'success' as 'success' | 'failed' | null, date: fiveDaysAgo, deadline: null, deadlineSetAt: null, createdAt: fiveDaysAgo },
      { id: '2', title: 'First viral post', completed: true, status: 'success' as 'success' | 'failed' | null, date: threeDaysAgo, deadline: null, deadlineSetAt: null, createdAt: threeDaysAgo },
      { id: '3', title: 'Reach 15K followers', completed: false, status: null, date: null, deadline: threeDaysFromNow, deadlineSetAt: today, createdAt: today }
    ];
  });

  // Save notes to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`client-${client.id}-notes`, notes);
  }, [notes, client.id]);

  // Save annotations to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`client-${client.id}-annotations`, JSON.stringify(annotations));
  }, [annotations, client.id]);

  // Save milestones to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`client-${client.id}-milestones`, JSON.stringify(milestones));
  }, [milestones, client.id]);

  // Check for expired deadlines and auto-mark as failed + update countdown display
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setMilestones(prev => prev.map(m => {
        if (m.deadline && !m.completed && now >= m.deadline) {
          // Auto-mark as failed when deadline expires
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return { ...m, completed: true, status: 'failed' as 'success' | 'failed', date: today };
        }
        return m;
      }));
      // Force re-render to update countdown display
      setCountdownTick(prev => prev + 1);
    }, 1000); // Check every second for smooth updates
    
    return () => clearInterval(interval);
  }, []);

  // Auto-create recurring milestones at client's midnight
  useEffect(() => {
    const checkRecurringMilestones = () => {
      const clientTimezone = client.timezone || 'UTC';
      const now = new Date();
      
      // Get client's current date at midnight
      const clientMidnight = new Date(now.toLocaleString('en-US', { timeZone: clientTimezone }));
      clientMidnight.setHours(0, 0, 0, 0);
      
      setMilestones(prev => {
        const newMilestones: Milestone[] = [];
        
        // Find all recurring milestone templates
        const recurringTemplates = prev.filter(m => m.isRecurring && !m.instanceDate);
        
        recurringTemplates.forEach(template => {
          if (!template.recurringPeriod || !template.recurringGroupId) return;
          
          // Find existing instances for this group
          const existingInstances = prev.filter(m => 
            m.recurringGroupId === template.recurringGroupId && m.instanceDate
          );
          
          // Determine what instances we need
          const instancesToCreate: Date[] = [];
          
          if (template.recurringPeriod === 'daily') {
            // Check if we have an instance for today
            const hasToday = existingInstances.some(m => {
              const instanceDate = new Date(m.instanceDate!);
              instanceDate.setHours(0, 0, 0, 0);
              return instanceDate.getTime() === clientMidnight.getTime();
            });
            if (!hasToday) {
              instancesToCreate.push(new Date(clientMidnight));
            }
          } else if (template.recurringPeriod === 'weekly') {
            // Check if we have an instance for this week
            const weekStart = new Date(clientMidnight);
            weekStart.setDate(clientMidnight.getDate() - clientMidnight.getDay());
            const hasThisWeek = existingInstances.some(m => {
              const instanceDate = new Date(m.instanceDate!);
              const instanceWeekStart = new Date(instanceDate);
              instanceWeekStart.setDate(instanceDate.getDate() - instanceDate.getDay());
              instanceWeekStart.setHours(0, 0, 0, 0);
              return instanceWeekStart.getTime() === weekStart.getTime();
            });
            if (!hasThisWeek) {
              instancesToCreate.push(new Date(weekStart));
            }
          } else if (template.recurringPeriod === 'monthly') {
            // Check if we have an instance for this month
            const monthStart = new Date(clientMidnight.getFullYear(), clientMidnight.getMonth(), 1);
            const hasThisMonth = existingInstances.some(m => {
              const instanceDate = new Date(m.instanceDate!);
              const instanceMonthStart = new Date(instanceDate.getFullYear(), instanceDate.getMonth(), 1);
              return instanceMonthStart.getTime() === monthStart.getTime();
            });
            if (!hasThisMonth) {
              instancesToCreate.push(new Date(monthStart));
            }
          }
          
          // Create new instances
          instancesToCreate.forEach(instanceDate => {
            newMilestones.push({
              ...template,
              id: `${template.recurringGroupId}-${instanceDate.getTime()}`,
              instanceDate,
              completed: false,
              status: null,
              date: null,
              goalCurrent: 0,
              createdAt: new Date()
            });
          });
        });
        
        return newMilestones.length > 0 ? [...prev, ...newMilestones] : prev;
      });
    };
    
    // Check immediately
    checkRecurringMilestones();
    
    // Check every hour
    const interval = setInterval(checkRecurringMilestones, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [client.timezone, client.id]);

  // Memoize history data to prevent regeneration on every render
  const historyData = useMemo(() => 
    generateMockHistory(chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : 90),
    [chartPeriod]
  );

  // Generate evenly spaced ticks for X-axis
  const xAxisTicks = useMemo(() => {
    if (historyData.length === 0) return [];
    const tickCount = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 10 : 12;
    const step = Math.floor((historyData.length - 1) / (tickCount - 1));
    const ticks = [];
    for (let i = 0; i < tickCount; i++) {
      const index = Math.min(i * step, historyData.length - 1);
      ticks.push(historyData[index].date);
    }
    return ticks;
  }, [historyData, chartPeriod]);

  // Generate milestone points for the chart, grouped by date
  const milestonePoints = useMemo(() => {
    const completedMilestones = milestones.filter(m => m.completed && m.date && m.status);
    const grouped = new Map<number, {date: number, followers: number, milestones: Milestone[]}>();
    
    completedMilestones.forEach(m => {
      const timestamp = m.date!.getTime();
      const dataPoint = historyData.find(d => Math.abs(d.date - timestamp) < 24 * 60 * 60 * 1000);
      const dateKey = dataPoint ? dataPoint.date : timestamp;
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          followers: dataPoint ? dataPoint.followers : 0,
          milestones: []
        });
      }
      grouped.get(dateKey)!.milestones.push(m);
    });
    
    return Array.from(grouped.values());
  }, [milestones, historyData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTimeRemaining = (deadline: Date | null) => {
    if (!deadline) return null;
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true, text: 'Expired' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (days > 0) return { expired: false, text: `${days}d ${hours}h` };
    if (hours > 0) return { expired: false, text: `${hours}h ${minutes}m` };
    if (minutes > 0) return { expired: false, text: `${minutes}m ${seconds}s` };
    return { expired: false, text: `${seconds}s` };
  };

  const getDeadlineProgress = (milestone: Milestone) => {
    if (!milestone.deadline || milestone.completed) return null;
    
    const now = new Date();
    const deadline = milestone.deadline;
    // Use createdAt as the start time (when milestone was created), not when deadline was set
    const startTime = milestone.createdAt;
    
    // Calculate total duration and elapsed time
    const totalDuration = deadline.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    
    // Percentage: 0% when just set, 100% when deadline reached
    const percentage = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    
    // Color based on percentage
    let color = '#22c55e'; // Green (0-50%)
    if (percentage > 50 && percentage <= 75) color = '#eab308'; // Yellow (50-75%)
    if (percentage > 75 && percentage < 100) color = '#f97316'; // Orange (75-100%)
    if (percentage >= 100) color = '#ef4444'; // Red (expired)
    
    return { percentage, color };
  };

  const handleSaveNotes = () => {
    // Recalculate annotation positions based on their text content
    const adjustedAnnotations: NoteAnnotation[] = [];
    const processedPositions = new Set<string>();
    
    annotations.forEach(ann => {
      // Find the text in tempNotes, starting from near the old position
      const searchRadius = 100;
      const searchStart = Math.max(0, ann.start - searchRadius);
      const searchEnd = Math.min(tempNotes.length, ann.end + searchRadius);
      const searchArea = tempNotes.substring(searchStart, searchEnd);
      
      const relativeIndex = searchArea.indexOf(ann.text);
      
      if (relativeIndex !== -1) {
        const newStart = searchStart + relativeIndex;
        const newEnd = newStart + ann.text.length;
        const posKey = `${newStart}-${newEnd}`;
        
        // Only add if this position hasn't been processed (avoid duplicates)
        if (!processedPositions.has(posKey)) {
          processedPositions.add(posKey);
          adjustedAnnotations.push({
            ...ann,
            start: newStart,
            end: newEnd
          });
        }
      }
    });
    
    setAnnotations(adjustedAnnotations);
    setNotes(tempNotes);
    setIsEditingNotes(false);
  };

  const handleTextSelection = () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = tempNotes.substring(start, end);
    
    if (text.length > 0) {
      setSelectedText({ start, end, text });
    } else {
      setSelectedText(null);
    }
  };

  const addLink = () => {
    if (!selectedText) return;
    setShowUrlModal(true);
  };

  const confirmAddLink = () => {
    if (!selectedText || !urlInput.trim()) return;
    
    const annotation: NoteAnnotation = {
      id: `link-${Date.now()}`,
      start: selectedText.start,
      end: selectedText.end,
      type: 'link',
      value: urlInput.trim(),
      text: selectedText.text
    };
    setAnnotations([...annotations, annotation]);
    setSelectedText(null);
    setShowUrlModal(false);
    setUrlInput('');
  };

  const addHighlight = (color: string) => {
    if (!selectedText) return;
    
    const annotation: NoteAnnotation = {
      id: `highlight-${Date.now()}`,
      start: selectedText.start,
      end: selectedText.end,
      type: 'highlight',
      value: color,
      text: selectedText.text
    };
    setAnnotations([...annotations, annotation]);
    setSelectedText(null);
  };

  const linkToMilestone = (milestoneId: string) => {
    if (!selectedText) return;
    
    const annotation: NoteAnnotation = {
      id: `milestone-${Date.now()}`,
      start: selectedText.start,
      end: selectedText.end,
      type: 'milestone',
      value: milestoneId,
      text: selectedText.text
    };
    setAnnotations([...annotations, annotation]);
    setSelectedText(null);
  };

  const renderAnnotatedNotes = () => {
    if (annotations.length === 0) {
      return <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{notes}</p>;
    }

    // Sort annotations by start position
    const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);
    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    sortedAnnotations.forEach((annotation, idx) => {
      // Add text before annotation
      if (annotation.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{notes.substring(lastIndex, annotation.start)}</span>
        );
      }

      // Add annotated text
      const milestone = milestones.find(m => m.id === annotation.value);
      
      if (annotation.type === 'link') {
        parts.push(
          <a
            key={`ann-${idx}`}
            href={annotation.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            {annotation.text}
          </a>
        );
      } else if (annotation.type === 'highlight') {
        parts.push(
          <span
            key={`ann-${idx}`}
            style={{ 
              backgroundColor: annotation.value, 
              color: '#000',
              padding: '2px 4px', 
              borderRadius: '3px',
              fontWeight: '500'
            }}
          >
            {annotation.text}
          </span>
        );
      } else if (annotation.type === 'milestone' && milestone) {
        parts.push(
          <span
            key={`ann-${idx}`}
            onClick={() => setSelectedMilestone(milestone)}
            className="px-2 py-1 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 cursor-pointer hover:bg-purple-500/30"
            title={`Linked to: ${milestone.title}`}
          >
            {annotation.text}
          </span>
        );
      }

      lastIndex = annotation.end;
    });

    // Add remaining text
    if (lastIndex < notes.length) {
      parts.push(
        <span key="text-end">{notes.substring(lastIndex)}</span>
      );
    }

    return <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{parts}</p>;
  };

  const toggleLock = (id: string) => {
    setLockedMilestones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleMilestone = (id: string, newStatus?: 'success' | 'failed') => {
    // Check if milestone is locked
    if (lockedMilestones.has(id)) {
      return; // Don't allow toggling if locked
    }
    
    setMilestones(milestones.map(m => {
      if (m.id === id) {
        // Si on clique sur le même statut, on décoche
        if (m.status === newStatus) {
          return { ...m, completed: false, status: null as 'success' | 'failed' | null, date: null };
        }
        // Sinon on coche avec le nouveau statut et la date actuelle
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight for consistent date matching
        return { ...m, completed: true, status: (newStatus || 'success') as 'success' | 'failed', date: today };
      }
      return m;
    }));
  };

  const addMilestone = () => {
    setShowAddMilestone(true);
    setNewMilestoneTitle("");
    setNewMilestoneGoalType('');
    setNewMilestoneGoalTarget('');
  };

  const handleAddMilestone = () => {
    if (newMilestoneTitle.trim()) {
      const isRecurring = newMilestoneGoalType === 'posts_daily' || 
                         newMilestoneGoalType === 'posts_weekly' || 
                         newMilestoneGoalType === 'posts_monthly';
      
      const recurringGroupId = isRecurring ? `recurring-${Date.now()}` : undefined;
      const recurringPeriod = newMilestoneGoalType === 'posts_daily' ? 'daily' :
                             newMilestoneGoalType === 'posts_weekly' ? 'weekly' :
                             newMilestoneGoalType === 'posts_monthly' ? 'monthly' : undefined;
      
      const newMilestone: Milestone = {
        id: Date.now().toString(),
        title: newMilestoneTitle.trim(),
        completed: false,
        status: null,
        date: null,
        deadline: null,
        deadlineSetAt: null,
        createdAt: new Date(),
        ...(newMilestoneGoalType && {
          goalType: newMilestoneGoalType as GoalType,
          goalTarget: typeof newMilestoneGoalTarget === 'number' ? newMilestoneGoalTarget : undefined,
          goalCurrent: 0
        }),
        ...(isRecurring && {
          isRecurring: true,
          recurringGroupId,
          recurringPeriod,
          instanceDate: undefined // Template milestone, not an instance
        })
      };
      setMilestones([...milestones, newMilestone]);
      setShowAddMilestone(false);
      setNewMilestoneTitle("");
      setNewMilestoneGoalType('');
      setNewMilestoneGoalTarget('');
    }
  };

  const deleteMilestone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMilestones(milestones.filter(m => m.id !== id));
  };

  // Group recurring milestones by their recurringGroupId
  const groupedMilestones = useMemo(() => {
    const groups: { [key: string]: { template: Milestone, instances: Milestone[] } } = {};
    const standalone: Milestone[] = [];
    
    milestones.forEach(m => {
      if (m.isRecurring && m.recurringGroupId) {
        if (!m.instanceDate) {
          // This is the template
          if (!groups[m.recurringGroupId]) {
            groups[m.recurringGroupId] = { template: m, instances: [] };
          } else {
            groups[m.recurringGroupId].template = m;
          }
        } else {
          // This is an instance
          if (!groups[m.recurringGroupId]) {
            groups[m.recurringGroupId] = { template: m, instances: [m] };
          } else {
            groups[m.recurringGroupId].instances.push(m);
          }
        }
      } else {
        standalone.push(m);
      }
    });
    
    // Sort instances by date (newest first)
    Object.values(groups).forEach(group => {
      group.instances.sort((a, b) => {
        const dateA = a.instanceDate?.getTime() || 0;
        const dateB = b.instanceDate?.getTime() || 0;
        return dateB - dateA;
      });
    });
    
    return { groups, standalone };
  }, [milestones]);

  return (
    <div className="min-h-screen text-white p-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-sm border border-green-500/30 text-green-300 hover:text-white hover:bg-black/90 hover:border-green-500/50 transition-all mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Clients
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-display font-black mb-2">{client.displayName}</h1>
              <a
                href={`https://instagram.com/${client.instagramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg text-gray-400 hover:text-purple-400 transition-colors"
              >
                @{client.instagramUsername}
              </a>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {client.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Client Info: Created Date & Global Deadline */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {new Date(client.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {client.globalDeadline ? (
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                        new Date() > new Date(client.globalDeadline)
                          ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                          : 'bg-blue-500/20 border border-blue-500/30 text-blue-300'
                      }`}>
                        <Calendar className="w-4 h-4" />
                        <span>Global Deadline: {new Date(client.globalDeadline).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = { ...client, globalDeadline: null };
                          onUpdate(updated);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                        title="Remove deadline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeadlineCalendar(!showDeadlineCalendar)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-blue-500/50 transition-colors text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Set global deadline</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  exportToPDF({
                    title: client.displayName,
                    subtitle: `@${client.instagramUsername}`,
                    content: notes,
                    metadata: {
                      author: 'FlowTrack Pro',
                      date: new Date(),
                      tags: client.tags
                    },
                    milestones: milestones.filter(m => m.completed).map(m => ({
                      title: m.title,
                      completed: m.completed,
                      status: m.status,
                      date: m.date
                    }))
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all"
              >
                <Download className="w-5 h-5" />
                Export PDF
              </button>
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash className="w-4 h-4" />
                Remove Client
              </button>
            </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Current Followers</span>
              {client.followersChange !== 0 && (
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  client.followersChange > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {client.followersChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(client.followersChange)}
                </span>
              )}
            </div>
            <p className="text-4xl font-black text-white">{formatNumber(client.currentFollowers)}</p>
            <span className="text-xs text-gray-500">This week: {client.followersChange > 0 ? '+' : ''}{client.followersChange}</span>
          </div>

          <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Current Following</span>
              {client.followingChange !== 0 && (
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  client.followingChange > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {client.followingChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(client.followingChange)}
                </span>
              )}
            </div>
            <p className="text-4xl font-black text-white">{formatNumber(client.currentFollowing)}</p>
            <span className="text-xs text-gray-500">This week: {client.followingChange > 0 ? '+' : ''}{client.followingChange}</span>
          </div>

          <div className="bg-black/80 backdrop-blur-sm bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-6">
            <span className="text-sm text-gray-400 mb-4 block">Follower/Following Ratio</span>
            <p className="text-4xl font-black text-white">
              {(client.currentFollowers / client.currentFollowing).toFixed(1)}x
            </p>
            <span className="text-xs text-gray-500">
              {client.currentFollowers / client.currentFollowing > 1 ? 'Healthy ratio' : 'Consider unfollowing'}
            </span>
          </div>
        </div>

        {/* Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Growth Trend</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartPeriod('7d')}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  chartPeriod === '7d' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setChartPeriod('30d')}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  chartPeriod === '30d' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setChartPeriod('90d')}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  chartPeriod === '90d' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-400 hover:text-white'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFollowers}
                onChange={() => setShowFollowers(!showFollowers)}
                className="w-4 h-4 rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-300">Followers</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFollowing}
                onChange={() => setShowFollowing(!showFollowing)}
                className="w-4 h-4 rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Following</span>
            </label>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorFollowing" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis 
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                stroke="#666"
                tick={{ fontSize: 11 }}
                tickMargin={8}
                ticks={xAxisTicks}
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                labelFormatter={(timestamp) => {
                  const date = new Date(timestamp as number);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  });
                }}
              />
              {showFollowers && <Area type="monotone" dataKey="followers" stroke="#a855f7" fillOpacity={1} fill="url(#colorFollowers)" />}
              {showFollowing && <Area type="monotone" dataKey="following" stroke="#3b82f6" fillOpacity={1} fill="url(#colorFollowing)" />}
              {milestonePoints.map((point, index) => {
                const hasMultiple = point.milestones.length > 1;
                const firstMilestone = point.milestones[0];
                const color = firstMilestone.status === 'success' ? '#22c55e' : '#ef4444';
                
                return (
                  <ReferenceDot
                    key={index}
                    x={point.date}
                    y={point.followers}
                    r={hasMultiple ? 12 : 8}
                    fill={color}
                    stroke={color}
                    strokeWidth={2}
                    isFront
                    onClick={() => {
                      if (hasMultiple) {
                        setGroupedMilestonesAtDate({ date: point.date, milestones: point.milestones });
                      } else {
                        setSelectedMilestone(firstMilestone);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    label={hasMultiple ? { 
                      value: point.milestones.length, 
                      position: 'center',
                      fill: '#fff',
                      fontSize: 10,
                      fontWeight: 'bold'
                    } : undefined}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-400">Followers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-400">Following</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-400">Milestone Success</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-400">Milestone Failed</span>
            </div>
          </div>

          {/* Selected Milestone Detail */}
          {selectedMilestone && (
            <div className={`mt-4 p-4 rounded-xl border-2 ${
              selectedMilestone.status === 'success'
                ? 'bg-green-500/10 border-green-500/30'
                : selectedMilestone.status === 'failed'
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white mb-1">{selectedMilestone.title}</h4>
                  <p className="text-sm text-gray-400">
                    {selectedMilestone.status === 'success' 
                      ? `Success - ${selectedMilestone.date?.toLocaleDateString()}` 
                      : selectedMilestone.status === 'failed'
                      ? `Failed - ${selectedMilestone.date?.toLocaleDateString()}`
                      : selectedMilestone.deadline
                      ? `In Progress - Deadline: ${selectedMilestone.deadline.toLocaleDateString()}`
                      : 'In Progress'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* Grouped Milestones Modal */}
          {groupedMilestonesAtDate && (
            <div className="mt-4 p-4 rounded-xl border-2 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-white">
                  {groupedMilestonesAtDate.milestones.length} Milestones - {new Date(groupedMilestonesAtDate.date).toLocaleDateString()}
                </h4>
                <button
                  onClick={() => setGroupedMilestonesAtDate(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="space-y-2">
                {groupedMilestonesAtDate.milestones.map((milestone, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      milestone.status === 'success'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{milestone.title}</span>
                      <span className="text-sm text-gray-400">
                        {milestone.status === 'success' ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Session Notes</h2>
              {!isEditingNotes ? (
                <button
                  onClick={() => {
                    setTempNotes(notes);
                    setIsEditingNotes(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {isEditingNotes ? (
              <>
                {/* Toolbar */}
                {selectedText && (
                  <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400 mr-2">Selected: "{selectedText.text.substring(0, 20)}..."</span>
                    
                    <button
                      onClick={addLink}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs transition-colors"
                      title="Add link"
                    >
                      <Link2 className="w-3 h-3" />
                      Link
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <Highlighter className="w-3 h-3 text-gray-400" />
                      <button
                        onClick={() => addHighlight('#fef08a')}
                        className="w-6 h-6 rounded bg-yellow-200 hover:ring-2 ring-white"
                        title="Yellow highlight"
                      />
                      <button
                        onClick={() => addHighlight('#86efac')}
                        className="w-6 h-6 rounded bg-green-200 hover:ring-2 ring-white"
                        title="Green highlight"
                      />
                      <button
                        onClick={() => addHighlight('#fca5a5')}
                        className="w-6 h-6 rounded bg-red-200 hover:ring-2 ring-white"
                        title="Red highlight"
                      />
                      <button
                        onClick={() => addHighlight('#bfdbfe')}
                        className="w-6 h-6 rounded bg-blue-200 hover:ring-2 ring-white"
                        title="Blue highlight"
                      />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Link to Milestone:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            linkToMilestone(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-1.5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-200 text-xs border border-green-500/40 focus:outline-none focus:border-green-500"
                        style={{
                          backgroundImage: 'none'
                        }}
                      >
                        <option value="" className="bg-gray-900 text-gray-300">Select milestone...</option>
                        {milestones.map(m => (
                          <option key={m.id} value={m.id} className="bg-gray-900 text-white">
                            {m.completed ? '[Done] ' : ''}{m.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Rich Text Editor with Live Preview */}
                <div className="relative">
                  {/* Rendered overlay with annotations */}
                  <div 
                    className="absolute inset-0 px-4 py-3 rounded-xl pointer-events-none overflow-auto whitespace-pre-wrap break-words text-white"
                    style={{ 
                      lineHeight: '1.5rem',
                      zIndex: 1
                    }}
                  >
                    {(() => {
                      if (annotations.length === 0) return tempNotes;
                      
                      const sortedAnnotations = [...annotations].sort((a, b) => a.start - b.start);
                      const parts: (string | JSX.Element)[] = [];
                      let lastIndex = 0;

                      sortedAnnotations.forEach((annotation, idx) => {
                        // Add text before annotation
                        if (annotation.start > lastIndex) {
                          parts.push(tempNotes.substring(lastIndex, annotation.start));
                        }

                        const milestone = milestones.find(m => m.id === annotation.value);
                        
                        if (annotation.type === 'link') {
                          parts.push(
                            <span
                              key={`ann-${idx}`}
                              className="text-blue-400 underline"
                              style={{ color: '#60a5fa' }}
                            >
                              {annotation.text}
                            </span>
                          );
                        } else if (annotation.type === 'highlight') {
                          parts.push(
                            <span
                              key={`ann-${idx}`}
                              style={{ 
                                backgroundColor: annotation.value,
                                color: '#000',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                fontWeight: '500'
                              }}
                            >
                              {annotation.text}
                            </span>
                          );
                        } else if (annotation.type === 'milestone' && milestone) {
                          parts.push(
                            <span
                              key={`ann-${idx}`}
                              className="bg-green-500/30 border border-green-500/50 text-green-300"
                              style={{ 
                                padding: '2px 6px',
                                borderRadius: '4px',
                                color: '#d8b4fe'
                              }}
                            >
                              {annotation.text}
                            </span>
                          );
                        }

                        lastIndex = annotation.end;
                      });

                      // Add remaining text
                      if (lastIndex < tempNotes.length) {
                        parts.push(tempNotes.substring(lastIndex));
                      }

                      return parts;
                    })()}
                  </div>
                  
                  {/* Actual textarea (transparent text) */}
                  <textarea
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    onSelect={handleTextSelection}
                    onMouseUp={handleTextSelection}
                    className="relative w-full min-h-[200px] px-4 py-3 rounded-xl bg-transparent border border-white/10 placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
                    style={{
                      color: 'transparent',
                      caretColor: 'white',
                      lineHeight: '1.5rem',
                      WebkitTextFillColor: 'transparent'
                    }}
                    placeholder="Add your session notes here..."
                  />
                </div>
              </>
            ) : (
              renderAnnotatedNotes()
            )}
          </motion.div>

          {/* URL Modal */}
          {showUrlModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUrlModal(false)}>
              <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">Add Link</h3>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmAddLink();
                    if (e.key === 'Escape') setShowUrlModal(false);
                  }}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors mb-4"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowUrlModal(false);
                      setUrlInput('');
                    }}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAddLink}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Global Deadline Calendar Modal */}
          {showDeadlineCalendar && (() => {
            const today = new Date();
            const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
            const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
            
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'];
            
            const handleDateSelect = (day: number) => {
              const deadline = new Date(calendarYear, calendarMonth, day);
              const updated = { ...client, globalDeadline: deadline };
              onUpdate(updated);
              setShowDeadlineCalendar(false);
            };
            
            const prevMonth = () => {
              if (calendarMonth === 0) {
                setCalendarMonth(11);
                setCalendarYear(calendarYear - 1);
              } else {
                setCalendarMonth(calendarMonth - 1);
              }
            };
            
            const nextMonth = () => {
              if (calendarMonth === 11) {
                setCalendarMonth(0);
                setCalendarYear(calendarYear + 1);
              } else {
                setCalendarMonth(calendarMonth + 1);
              }
            };
            
            return (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeadlineCalendar(false)}>
                <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-xl font-bold text-white mb-4">Set Global Deadline</h3>
                  
                  {/* Month/Year Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={prevMonth}
                      className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                    >
                      ←
                    </button>
                    <span className="text-white font-semibold">
                      {monthNames[calendarMonth]} {calendarYear}
                    </span>
                    <button
                      onClick={nextMonth}
                      className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
                    >
                      →
                    </button>
                  </div>
                  
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-center text-xs text-gray-500 font-semibold py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    
                    {/* Actual days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const date = new Date(calendarYear, calendarMonth, day);
                      const isToday = date.toDateString() === today.toDateString();
                      const isPast = date < today && !isToday;
                      
                      return (
                        <button
                          key={day}
                          onClick={() => !isPast && handleDateSelect(day)}
                          disabled={isPast}
                          className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-colors ${
                            isToday
                              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300 font-bold'
                              : isPast
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-white hover:bg-white/10'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setShowDeadlineCalendar(false)}
                    className="w-full mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Milestones</h2>
            <div className="space-y-3">
              {/* Standalone milestones */}
              {groupedMilestones.standalone.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
                    milestone.status === 'success'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : milestone.status === 'failed'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-white/5 border border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex gap-2 flex-shrink-0 items-center">
                    <button
                      onClick={() => toggleLock(milestone.id)}
                      className={`p-1 rounded transition-all ${
                        lockedMilestones.has(milestone.id)
                          ? 'text-yellow-500 hover:text-yellow-400'
                          : 'text-gray-500 hover:text-gray-400'
                      }`}
                      title={lockedMilestones.has(milestone.id) ? 'Unlock to edit' : 'Lock to prevent accidental changes'}
                    >
                      {lockedMilestones.has(milestone.id) ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleMilestone(milestone.id, 'success')}
                      disabled={lockedMilestones.has(milestone.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        lockedMilestones.has(milestone.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : milestone.status === 'success'
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-500 hover:border-green-500'
                      }`}
                    >
                      {milestone.status === 'success' && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => toggleMilestone(milestone.id, 'failed')}
                      disabled={lockedMilestones.has(milestone.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        lockedMilestones.has(milestone.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : milestone.status === 'failed'
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-500 hover:border-red-500'
                      }`}
                    >
                      {milestone.status === 'failed' && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      milestone.status === 'success' ? 'text-green-300 line-through' : 
                      milestone.status === 'failed' ? 'text-red-300 line-through' : 
                      'text-white'
                    }`}>
                      {milestone.title}
                    </p>
                    {milestone.completed && milestone.date && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {milestone.status === 'success' ? 'Completed' : 'Failed'} {milestone.date.toLocaleDateString()}
                      </p>
                    )}
                    {!milestone.completed && milestone.deadline && (() => {
                      const timeRemaining = getTimeRemaining(milestone.deadline);
                      const progress = getDeadlineProgress(milestone);
                      return (
                        <>
                          {timeRemaining && (
                            <p className={`text-xs mt-1 flex items-center gap-1 font-bold ${
                              timeRemaining.expired ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {timeRemaining.text}
                            </p>
                          )}
                          {progress && (
                            <div className="mt-2 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="h-full transition-all duration-500 rounded-full"
                                style={{ 
                                  width: `${progress.percentage}%`,
                                  backgroundColor: progress.color
                                }}
                              />
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {!milestone.completed && !milestone.deadline && (
                      <input
                        type="datetime-local"
                        onChange={(e) => {
                          if (e.target.value) {
                            const deadline = new Date(e.target.value);
                            const deadlineSetAt = new Date(); // Record when deadline was set
                            setMilestones(prev => prev.map(m => 
                              m.id === milestone.id ? { ...m, deadline, deadlineSetAt } : m
                            ));
                          }
                        }}
                        className="mt-1 text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-300"
                        placeholder="Set deadline"
                      />
                    )}
                  </div>
                  <button
                    onClick={(e) => deleteMilestone(milestone.id, e)}
                    className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Recurring milestone groups */}
              {Object.entries(groupedMilestones.groups).map(([groupId, group]) => {
                const isExpanded = expandedGroups.has(groupId);
                const completedCount = group.instances.filter(m => m.completed).length;
                const totalCount = group.instances.length;
                const latestInstance = group.instances[0];
                
                return (
                  <div key={groupId} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    {/* Group Header */}
                    <div
                      onClick={() => {
                        const newExpanded = new Set(expandedGroups);
                        if (isExpanded) {
                          newExpanded.delete(groupId);
                        } else {
                          newExpanded.add(groupId);
                        }
                        setExpandedGroups(newExpanded);
                      }}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-400"
                        >
                          ▶
                        </motion.div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{group.template.title}</p>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300">
                            {group.template.recurringPeriod === 'daily' ? 'Quotidien' :
                             group.template.recurringPeriod === 'weekly' ? 'Hebdo' :
                             'Mensuel'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {completedCount}/{totalCount} complétés
                          {latestInstance && latestInstance.instanceDate && (
                            <> • Dernier: {new Date(latestInstance.instanceDate).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                            style={{ width: `${(completedCount / totalCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Instances */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-white/10"
                        >
                          <div className="p-4 space-y-2 bg-black/20">
                            {group.instances.map((instance) => (
                              <div
                                key={instance.id}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                                  instance.status === 'success'
                                    ? 'bg-green-500/10 border border-green-500/20'
                                    : instance.status === 'failed'
                                    ? 'bg-red-500/10 border border-red-500/20'
                                    : 'bg-white/5 border border-white/10'
                                }`}
                              >
                                <div className="flex-shrink-0 pt-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!lockedMilestones.has(instance.id)) {
                                        toggleMilestone(instance.id, instance.status ?? undefined);
                                      }
                                    }}
                                    disabled={lockedMilestones.has(instance.id)}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      instance.completed
                                        ? instance.status === 'success'
                                          ? 'bg-green-500 border-green-500'
                                          : 'bg-red-500 border-red-500'
                                        : 'border-gray-500 hover:border-green-400'
                                    } ${lockedMilestones.has(instance.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    {instance.status === 'success' && (
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                    {instance.status === 'failed' && (
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium ${
                                      instance.status === 'success' ? 'text-green-300 line-through' : 
                                      instance.status === 'failed' ? 'text-red-300 line-through' : 
                                      'text-white'
                                    }`}>
                                      {instance.instanceDate ? new Date(instance.instanceDate).toLocaleDateString() : ''}
                                    </p>
                                    {instance.goalTarget && (
                                      <span className="text-xs text-gray-400">
                                        ({instance.goalCurrent || 0}/{instance.goalTarget})
                                      </span>
                                    )}
                                  </div>
                                  {instance.completed && instance.date && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {instance.status === 'success' ? '✓ Complété' : '✗ Échoué'} le {new Date(instance.date).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => deleteMilestone(instance.id, e)}
                                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              <button 
                onClick={addMilestone}
                className="w-full py-3 rounded-xl border-2 border-dashed border-white/20 text-gray-400 hover:border-white/40 hover:text-white transition-colors cursor-pointer"
              >
                + Add Milestone
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bottom Return Button */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-sm border border-green-500/30 text-green-300 hover:text-white hover:bg-black/90 hover:border-green-500/50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Client List
          </button>
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-black border border-green-500/30 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Ajouter un Milestone</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-green-300 mb-2">Titre du milestone</label>
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="Ex: Atteindre 20K followers"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-green-500/30 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-green-300 mb-2">Type d'objectif (optionnel)</label>
              <select
                value={newMilestoneGoalType}
                onChange={(e) => setNewMilestoneGoalType(e.target.value as GoalType | '')}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-green-500/30 text-white focus:outline-none focus:border-green-500 transition-colors [&>option]:bg-black [&>option]:text-white"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="bg-black text-white">Aucun objectif automatique</option>
                <option value="followers" className="bg-black text-white">Nombre de followers</option>
                <option value="views" className="bg-black text-white">Nombre de vues</option>
                <option value="posts_daily" className="bg-black text-white">Publications quotidiennes</option>
                <option value="posts_weekly" className="bg-black text-white">Publications hebdomadaires</option>
                <option value="posts_monthly" className="bg-black text-white">Publications mensuelles</option>
                <option value="custom" className="bg-black text-white">Objectif personnalisé</option>
              </select>
            </div>

            {newMilestoneGoalType && (
              <div className="mb-4">
                <label className="block text-sm text-green-300 mb-2">
                  Objectif cible
                  {newMilestoneGoalType === 'followers' && ' (nombre de followers)'}
                  {newMilestoneGoalType === 'views' && ' (nombre de vues)'}
                  {newMilestoneGoalType === 'posts_daily' && ' (posts par jour)'}
                  {newMilestoneGoalType === 'posts_weekly' && ' (posts par semaine)'}
                  {newMilestoneGoalType === 'posts_monthly' && ' (posts par mois)'}
                </label>
                <input
                  type="number"
                  value={newMilestoneGoalTarget}
                  onChange={(e) => setNewMilestoneGoalTarget(e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="Ex: 20000"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-green-500/30 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Les agents Pro cocheront automatiquement ce milestone quand l'objectif sera atteint
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAddMilestone(false)}
                className="px-4 py-2 rounded-xl border border-green-500/30 text-green-300 hover:text-white hover:border-green-500/50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMilestone}
                disabled={!newMilestoneTitle.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

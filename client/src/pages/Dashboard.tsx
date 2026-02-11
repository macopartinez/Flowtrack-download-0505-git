import { useEffect } from "react";
import { useRoute } from "wouter";
import { useUser, useStats } from "@/hooks/use-flowtrack";
import { StatsCard } from "@/components/StatsCard";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { 
  Users, 
  UserMinus, 
  TrendingUp, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Instagram,
  Facebook,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { RadarBackground } from "@/components/RadarBackground";

// Mock data for the chart since schema doesn't support history yet
const chartData = [
  { name: 'Mon', followers: 4000, unfollowers: 24 },
  { name: 'Tue', followers: 4020, unfollowers: 18 },
  { name: 'Wed', followers: 4080, unfollowers: 32 },
  { name: 'Thu', followers: 4100, unfollowers: 12 },
  { name: 'Fri', followers: 4150, unfollowers: 45 },
  { name: 'Sat', followers: 4200, unfollowers: 20 },
  { name: 'Sun', followers: 4250, unfollowers: 15 },
];

export default function Dashboard() {
  const [, params] = useRoute("/dashboard/:userId");
  const userId = params ? parseInt(params.userId) : null;
  
  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: stats, isLoading: statsLoading } = useStats(userId);

  if (userLoading || statsLoading) {
    return <DashboardLoading />;
  }

  if (!user || !stats) {
    return <div>Error loading dashboard</div>;
  }

  return (
    <div className="min-h-screen bg-transparent flex font-body text-white relative">
      <RadarBackground />
      {/* Sidebar */}
      <aside className="w-72 bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col fixed h-full z-10 shadow-2xl">
        <div className="p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/30">
              F
            </div>
            <span className="font-display font-black text-2xl tracking-tighter text-white">Flowtrack</span>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-3">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={Users} label="Audience" />
          <NavItem icon={TrendingUp} label="Analytics" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 p-5 rounded-3xl mb-6 flex items-center gap-4 border border-white/5">
            <div className="w-12 h-12 rounded-full bg-white/10 p-1 border border-white/10 overflow-hidden shadow-sm">
              <img 
                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate text-sm text-white">{user.username}</div>
              <div className="text-xs text-gray-400 capitalize flex items-center gap-1.5 font-medium">
                {user.platform === 'instagram' ? <Instagram className="w-3.5 h-3.5 text-pink-500" /> : <Facebook className="w-3.5 h-3.5 text-blue-600" />}
                {user.platform}
              </div>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl h-12 font-bold">
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-12 lg:p-16">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16">
          <div>
            <h1 className="text-4xl font-display font-black text-white tracking-tight">Overview</h1>
            <p className="text-gray-400 mt-2 font-medium">Monitoring your social growth and audience health.</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-white/10 hover:border-white/20 bg-white/5 text-white w-full sm:w-auto">
              Download CSV
            </Button>
            <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/25 w-full sm:w-auto">
              Refresh Data
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatsCard 
            title="Total Unfollowers" 
            value={stats.totalUnfollowers} 
            icon={UserMinus} 
            colorClass="text-red-500"
            delay={0.1}
          />
          <StatsCard 
            title="Recent Unfollowers (7d)" 
            value={stats.recentUnfollowers.length} 
            icon={Users} 
            colorClass="text-blue-500"
            trend="+12%"
            trendUp={false}
            delay={0.2}
          />
          <StatsCard 
            title="Growth Rate" 
            value={`${stats.growthRate}%`} 
            icon={TrendingUp} 
            colorClass="text-green-500"
            trend="+2.4%"
            trendUp={true}
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 glass-card p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Activity Overview</h3>
              <SelectTimeRange />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUnfollowers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="unfollowers" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUnfollowers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Unfollowers List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Recent Unfollowers</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            
            <div className="space-y-6">
              {stats.recentUnfollowers.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  No recent unfollowers! 🎉
                </div>
              ) : (
                stats.recentUnfollowers.map((unfollower) => (
                  <div key={unfollower.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                        {unfollower.username.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{unfollower.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(unfollower.detectedAt || new Date()), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? "bg-primary text-white shadow-lg shadow-primary/25 font-medium" 
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    }`}>
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function SelectTimeRange() {
  return (
    <select className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1 font-medium text-gray-600 focus:ring-0 cursor-pointer">
      <option>Last 7 Days</option>
      <option>Last 30 Days</option>
    </select>
  );
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col gap-8">
      <div className="flex gap-4">
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-[400px] lg:col-span-2 rounded-3xl" />
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    </div>
  );
}

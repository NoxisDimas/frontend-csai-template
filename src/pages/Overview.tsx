import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Activity, Database, Zap, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';

interface Metrics {
  total_tokens: number | string;
  total_conversations: number | string;
  total_tickets: number | string;
  csat_average: number | string;
  estimated_cost_usd: number | string;
  peak_hours: { time: string; count: number }[];
}

interface Conversation {
  id: string;
  status: string;
  created_at: string;
}

export function Overview() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Run both requests in parallel
      const [metricsRes, chatsRes] = await Promise.all([
        api.get('/analytics/metrics').catch(() => null),
        api.get('/conversations?limit=10').catch(() => null)
      ]);

      if (metricsRes?.data?.data) {
        setMetrics(metricsRes.data.data);
      }
      
      if (chatsRes?.data?.data) {
        setRecentChats(chatsRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fallback data if API doesn't provide peak_hours
  const chartData = metrics?.peak_hours || [
    { time: '00:00', count: 0 },
    { time: '04:00', count: 0 },
    { time: '08:00', count: 0 },
    { time: '12:00', count: 0 },
    { time: '16:00', count: 0 },
    { time: '20:00', count: 0 },
    { time: '24:00', count: 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-text-secondary mt-1">Monitor real-time AI performance and system health.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="gap-2" onClick={fetchDashboardData}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
          </Button>
          <Button className="gap-2" onClick={() => navigate('/chat-simulator')}>
            <Plus className="w-4 h-4" /> New Conversation
          </Button>
        </div>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card-base to-card-elevated group hover:border-brand-500/50 transition-colors">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-1">API Status</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">Online</span>
                <Badge variant="success">99.9% Uptime</Badge>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card-base to-card-elevated group hover:border-brand-500/50 transition-colors">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-1">Database Status</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">Healthy</span>
                <Badge variant="success">12ms Latency</Badge>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center">
              <Database className="w-6 h-6 text-brand-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card-base to-card-elevated group hover:border-brand-500/50 transition-colors">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary mb-1">WebSocket</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">Connected</span>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-400/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-brand-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tokens', value: metrics?.total_tokens || '0' },
          { label: 'Conversations', value: metrics?.total_conversations || '0' },
          { label: 'Estimated Cost', value: `$${metrics?.estimated_cost_usd || '0.00'}` },
          { label: 'Avg CSAT Score', value: `${metrics?.csat_average || '0.0'}/5.0` },
        ].map((metric, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-text-secondary mb-2">{metric.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-white">{metric.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversation Activity (Peak Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-brand-500)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card-elevated)', borderColor: 'var(--color-border-subtle)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [value, 'Conversations']}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--color-brand-500)" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Recent Conversations</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/inbox')}>View All</Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
            <div className="space-y-4">
              {recentChats.length === 0 && !isLoading ? (
                <p className="text-text-secondary text-sm text-center py-4">No recent conversations.</p>
              ) : recentChats.map((chat) => (
                <div key={chat.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-card-elevated transition-colors border border-transparent hover:border-border-subtle cursor-pointer" onClick={() => navigate('/inbox')}>
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-white truncate">{chat.id}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={
                          chat.status === 'active_ai' ? 'default' : 
                          chat.status === 'human_handling' ? 'warning' : 'success'
                        }
                      >
                        {chat.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-text-secondary">
                        {new Date(chat.created_at || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

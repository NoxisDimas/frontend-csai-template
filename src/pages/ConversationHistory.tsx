import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Search, Bot, User, Eye, X, Loader2 } from 'lucide-react';
import { cn } from '../components/ui/utils';
import { api } from '../lib/api';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '../components/ui/date-range-picker';

interface Conversation {
  id: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface Message {
  id?: string;
  content: string;
  sender: 'user' | 'customer' | 'ai' | 'staff' | 'system';
  created_at: string;
}

export function ConversationHistory() {
  const [history, setHistory] = useState<Conversation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 100;
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      let url = '/conversations';
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (dateRange?.from) {
        params.append('start_date', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        params.append('end_date', toDate.toISOString());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const res = await api.get(url);
      const data = res.data.data || [];
      setHistory(data);
      setTotalCount(res.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch history', error);
      toast.error('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [dateRange, page]);

  const openTranscript = async (id: string) => {
    setSelectedChatId(id);
    try {
      setIsTranscriptLoading(true);
      const res = await api.get(`/conversations/${id}/messages`);
      setTranscript(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch transcript', error);
      toast.error('Failed to load chat transcript');
    } finally {
      setIsTranscriptLoading(false);
    }
  };

  const formatStatus = (status: string) => {
    return status?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Conversation History</h1>
          <p className="text-text-secondary mt-1">Review past AI and human interactions with customers.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="flex flex-col sm:flex-row w-full flex-1 items-stretch sm:items-center gap-4 max-w-2xl">
            <div className="flex-1">
              <Input 
                icon={<Search className="w-4 h-4" />} 
                placeholder="Search by conversation ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto w-full">
          <Table className="w-full whitespace-nowrap">
            <TableHeader>
              <TableRow>
                <TableHead>Conversation ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-text-secondary">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading history...
                  </TableCell>
                </TableRow>
              ) : history.filter(chat => chat.id.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-text-secondary">
                    No matching conversation history found.
                  </TableCell>
                </TableRow>
              ) : history
                  .filter(chat => chat.id.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((chat) => (
                <TableRow key={chat.id}>
                  <TableCell className="font-medium text-white">
                    {chat.id}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        chat.status === 'resolved' ? 'success' : 
                        chat.status === 'active_ai' ? 'default' : 'warning'
                      }
                    >
                      {formatStatus(chat.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {new Date(chat.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openTranscript(chat.id)} className="gap-2">
                      <Eye className="w-4 h-4" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-border-subtle flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= totalCount}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Transcript Modal */}
      {selectedChatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background-base/80 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-3xl max-h-full flex flex-col shadow-2xl border-border-subtle bg-card-base">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-card-elevated/30">
              <div>
                <CardTitle className="text-lg">Chat Transcript</CardTitle>
                <CardDescription>ID: {selectedChatId}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedChatId(null)}>
                <X className="w-5 h-5 text-text-secondary" />
              </Button>
            </div>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-card-base/50">
              {isTranscriptLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
                </div>
              ) : transcript.length === 0 ? (
                <div className="text-center p-12 text-text-secondary">
                  No messages found for this conversation.
                </div>
              ) : (
                transcript.map((msg, idx) => {
                  const isCustomer = msg.sender === 'user' || msg.sender === 'customer';
                  return (
                    <div key={msg.id || idx} className={cn("flex gap-4 max-w-[80%]", isCustomer ? "ml-auto flex-row-reverse" : "")}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
                        isCustomer ? "bg-card-elevated text-text-secondary" : 
                        msg.sender === 'staff' ? "bg-amber-500/20 text-amber-500" : "bg-brand-500/20 text-brand-400"
                      )}>
                        {isCustomer ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                      </div>
                      <div className={cn("flex flex-col gap-1", isCustomer ? "items-end" : "items-start")}>
                        <div className={cn("px-5 py-3 rounded-2xl text-sm leading-relaxed",
                          isCustomer ? "bg-brand-500 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(37,99,235,0.2)]" : 
                          msg.sender === 'staff' ? "bg-amber-500 text-white rounded-tl-sm" :
                          "bg-card-elevated text-white rounded-tl-sm border border-border-subtle"
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-text-secondary px-1">
                          {msg.sender === 'staff' ? 'Staff • ' : ''}{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

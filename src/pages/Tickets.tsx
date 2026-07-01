import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Filter, AlertCircle, Clock, CheckCircle2, MessageSquare, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../components/ui/utils';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';
import { NotificationToast, NotificationBanner } from '../components/Notifications';

interface Ticket {
  id: string;
  status: 'open' | 'in_progress' | 'resolved';
  notes: string;
  created_at: string;
  customer_name?: string;
  issue_summary?: string;
  conversation_id?: string;
}

export function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [notesInput, setNotesInput] = useState('');

  const fetchTickets = async (status?: string) => {
    try {
      setIsLoading(true);
      const url = status && status !== 'all' ? `/tickets?status=${status}` : '/tickets';
      const res = await api.get(url);
      setTickets(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
      NotificationToast.error('Load Failed', 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(filterStatus);
  }, [filterStatus]);

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await api.put(`/tickets/${ticketId}/status`, { status: newStatus });
      NotificationToast.success('Status Updated', 'Ticket status updated');
      fetchTickets(filterStatus);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any });
      }
    } catch (error) {
      console.error('Failed to update status', error);
      NotificationToast.error('Update Failed', 'Failed to update ticket status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    try {
      await api.put(`/tickets/${selectedTicket.id}/notes`, { notes: notesInput });
      NotificationToast.success('Notes Saved', 'Notes saved successfully');
      fetchTickets(filterStatus);
      setSelectedTicket({ ...selectedTicket, notes: notesInput });
    } catch (error) {
      console.error('Failed to save notes', error);
      NotificationToast.error('Save Failed', 'Failed to save notes');
    }
  };

  const openTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setNotesInput(ticket.notes || '');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="danger" className="gap-1 py-0.5"><AlertCircle className="w-3 h-3" /> Open</Badge>;
      case 'in_progress':
        return <Badge variant="warning" className="gap-1 py-0.5"><Clock className="w-3 h-3" /> In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success" className="gap-1 py-0.5"><CheckCircle2 className="w-3 h-3" /> Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Escalation Tickets</h1>
          <p className="text-text-secondary mt-1">Manage conversations escalated by AI.</p>
        </div>
      </div>
      {openTicketsCount > 0 && (
        <div className="shrink-0">
          <NotificationBanner 
            type="warning" 
            title="Action Required" 
            description={`There are ${openTicketsCount} tickets currently marked as OPEN that need your attention.`}
            dismissible
          />
        </div>
      )}
      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Tickets List */}
        <Card className={cn(
          "flex-1 flex-col h-full overflow-hidden",
          selectedTicket ? "hidden lg:flex" : "flex"
        )}>
        <CardHeader className="border-b border-border-subtle pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tickets</CardTitle>
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-card-elevated border border-border-subtle rounded-md text-sm text-white px-3 py-1.5 outline-none focus:border-brand-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center p-12">
              <MessageSquare className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white">No tickets found</h3>
              <p className="text-text-secondary mt-1">There are no escalated tickets matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className={`p-4 cursor-pointer hover:bg-card-elevated/50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-brand-500/5 border-l-2 border-l-brand-500' : 'border-l-2 border-l-transparent'}`}
                  onClick={() => openTicketDetails(ticket)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-white truncate pr-4">{ticket.customer_name || `Ticket #${ticket.id.substring(0, 8)}`}</span>
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2">{ticket.issue_summary || 'No summary provided.'}</p>
                  <div className="flex items-center mt-3 text-xs text-text-secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(ticket.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Panel */}
      {selectedTicket && (
        <Card className={cn(
          "w-full lg:w-[400px] shrink-0 flex-col h-full overflow-hidden bg-card-base border-border-subtle shadow-xl",
          selectedTicket ? "flex" : "hidden lg:flex"
        )}>
          <CardHeader className="border-b border-border-subtle pb-4 bg-card-elevated/30 shrink-0">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="lg:hidden p-1 -ml-1 text-text-secondary hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <CardTitle className="text-lg">Ticket Details</CardTitle>
              </div>
              {getStatusBadge(selectedTicket.status)}
            </div>
            <p className="text-sm text-text-secondary">ID: {selectedTicket.id}</p>
          </CardHeader>
          <CardContent className="p-5 flex-1 overflow-y-auto space-y-6">
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">Status Management</h4>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={selectedTicket.status === 'open' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                  className={selectedTicket.status === 'open' ? 'bg-red-500 hover:bg-red-600 text-white border-transparent' : ''}
                >
                  Open
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedTicket.status === 'in_progress' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                  className={selectedTicket.status === 'in_progress' ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' : ''}
                >
                  In Progress
                </Button>
                <Button 
                  size="sm" 
                  variant={selectedTicket.status === 'resolved' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                  className={selectedTicket.status === 'resolved' ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent' : ''}
                >
                  Resolved
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-2 uppercase tracking-wider">Internal Notes</h4>
              <textarea 
                className="w-full h-32 bg-input-background border border-border-subtle rounded-md p-3 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                placeholder="Add internal notes about this ticket resolution..."
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
              <Button onClick={handleSaveNotes} className="w-full mt-2" size="sm">
                Save Notes
              </Button>
            </div>
            
            {selectedTicket.conversation_id && (
              <div className="pt-4 border-t border-border-subtle">
                <Button 
                  onClick={() => navigate('/inbox', { state: { chatId: selectedTicket.conversation_id } })} 
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  View Chat in Live Inbox
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

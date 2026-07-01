import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Bot, User, PhoneCall, FastForward, Send, Paperclip, Loader2, ArrowLeft, Eye, X } from 'lucide-react';
import { cn } from '../components/ui/utils';
import { api, getWsUrl } from '../lib/api';
import { NotificationToast, NotificationBanner } from '../components/Notifications';
import { useAuth } from '../contexts/AuthContext';

interface Conversation {
  id: string;
  status: 'active_ai' | 'waiting_human' | 'human_handling' | 'resolved';
  created_at: string;
  unread?: boolean;
  assigned_user?: { id: string; name: string };
}

interface Message {
  id?: string;
  content: string;
  sender?: 'user' | 'customer' | 'ai' | 'staff' | 'system';
  sender_type?: 'user' | 'customer' | 'ai' | 'staff' | 'system';
  sender_user?: { id: string; name: string };
  sender_name?: string; // used for WS payloads
  created_at: string;
}

export function LiveInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const { user } = useAuth();
  
  const location = useLocation();
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      setIsLoadingChats(true);
      const res = await api.get(`/conversations?page=${page}&limit=${limit}`);
      const data = res.data.data || [];
      setConversations(data);
      setTotalCount(res.data.total || 0);
      
      // Select chat if navigated from Tickets
      if (location.state?.chatId) {
        const chat = data.find((c: Conversation) => c.id === location.state.chatId);
        if (chat && !selectedChat) {
          setSelectedChat(chat);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Poll for new conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [page]);

  // Fetch messages and connect WS when a chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/conversations/${selectedChat.id}/messages`);
        setMessages(res.data.data || []);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch messages', error);
      }
    };

    fetchMessages();

    // Setup WebSocket
    const wsUrl = getWsUrl(`/chat/ws/${selectedChat.id}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') {
          setIsTyping(data.status);
        } else if (data.type === 'message' || data.type === 'escalation' || data.type === 'new_message') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              content: data.text || data.message || data.messages,
              sender: data.sender || 'system',
              sender_name: data.sender_name,
              created_at: new Date().toISOString()
            }
          ]);
          setIsTyping(false);
          scrollToBottom();
        } else if (data.type === 'status_update') {
          setConversations(prev => prev.map(c => 
            c.id === data.conversation_id ? { 
              ...c, 
              status: data.status, 
              assigned_user: data.assigned_user 
            } : c
          ));
          if (selectedChat?.id === data.conversation_id) {
            setSelectedChat(prev => prev ? { 
              ...prev, 
              status: data.status, 
              assigned_user: data.assigned_user 
            } : null);
          }
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [selectedChat?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleTakeover = async () => {
    if (!selectedChat) return;
    try {
      const res = await api.post(`/conversations/${selectedChat.id}/takeover`);
      NotificationToast.success('Taken Over', 'Conversation taken over successfully');
      const assignedUser = res.data.assigned_user;
      const updatedChat = { ...selectedChat, status: 'human_handling' as const, assigned_user: assignedUser };
      setSelectedChat(updatedChat);
      setConversations(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
    } catch (error) {
      console.error('Failed to takeover', error);
      NotificationToast.error('Action Failed', 'Failed to take over conversation');
    }
  };

  const handleRelease = async () => {
    if (!selectedChat) return;
    try {
      await api.post(`/conversations/${selectedChat.id}/release`);
      NotificationToast.success('Released', 'Conversation released to AI');
      const updatedChat = { ...selectedChat, status: 'active_ai' as const, assigned_user: undefined };
      setSelectedChat(updatedChat);
      setConversations(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
    } catch (error) {
      console.error('Failed to release', error);
      NotificationToast.error('Action Failed', 'Failed to release conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;
    
    // We can use the REST endpoint to send a staff message
    try {
      const msg = inputText;
      setInputText('');
      
      // Optioanlly optimistically add message
      // setMessages(prev => [...prev, { content: msg, sender: 'staff', created_at: new Date().toISOString() }]);
      // scrollToBottom();

      await api.post(`/conversations/${selectedChat.id}/messages`, {
        content: msg
      });
      // The message will be broadcasted via WS, so we'll receive it and render it.
    } catch (error) {
      console.error('Failed to send message', error);
      NotificationToast.error('Send Failed', 'Failed to send message');
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const humanHandlingCount = conversations.filter(c => c.status === 'waiting_human').length;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Live Inbox</h1>
          <p className="text-text-secondary mt-1">Manage real-time customer conversations.</p>
        </div>
      </div>
      {humanHandlingCount > 0 && (
        <div className="shrink-0">
          <NotificationBanner 
            type="warning" 
            title="Customers Waiting" 
            description={`There are ${humanHandlingCount} conversations waiting for human assistance.`}
            dismissible
          />
        </div>
      )}
      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Left Panel - Conversation List */}
        <Card className={cn(
          "w-full lg:w-[350px] flex-col h-full shrink-0 border-border-subtle bg-card-base",
          selectedChat ? "hidden lg:flex" : "flex"
        )}>
        <div className="p-4 border-b border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Live Inbox</h2>
            <Badge variant="warning">{conversations.filter(c => c.status === 'waiting_human').length} Waiting</Badge>
          </div>
          <Input 
            icon={<Search className="w-4 h-4" />} 
            placeholder="Search conversations..." 
            className="bg-card-elevated"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8 text-text-secondary">
              No active conversations.
            </div>
          ) : conversations.filter(c => c.id.toLowerCase().includes(searchQuery.toLowerCase()) || formatStatus(c.status).toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <div className="text-center p-8 text-text-secondary">
              No matching conversations.
            </div>
          ) : conversations
              .filter(c => c.id.toLowerCase().includes(searchQuery.toLowerCase()) || formatStatus(c.status).toLowerCase().includes(searchQuery.toLowerCase()))
              .map((chat) => (
            <div 
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "p-4 border-b border-border-subtle cursor-pointer transition-colors hover:bg-card-elevated/50",
                selectedChat?.id === chat.id ? "bg-card-elevated border-l-2 border-l-brand-500" : "border-l-2 border-l-transparent"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-white truncate max-w-[150px]">{chat.id}</span>
                  {chat.unread && <span className="w-2 h-2 rounded-full bg-brand-500"></span>}
                </div>
                <span className="text-xs text-text-secondary">{new Date(chat.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <Badge 
                variant={
                  chat.status === 'active_ai' ? 'default' : 
                  chat.status === 'human_handling' ? 'warning' : 'success'
                }
              >
                {formatStatus(chat.status)}
              </Badge>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border-subtle flex flex-col gap-2">
          <p className="text-xs text-text-secondary text-center">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="flex-1 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= totalCount}
              onClick={() => setPage(p => p + 1)}
              className="flex-1 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Right Panel - Conversation Detail */}
      {selectedChat ? (
        <Card className={cn(
          "flex-1 min-w-0 flex-col h-full border-border-subtle bg-card-base/50 backdrop-blur-xl",
          selectedChat ? "flex" : "hidden lg:flex"
        )}>
          <div className="h-16 border-b border-border-subtle px-4 lg:px-6 flex items-center justify-between bg-card-base">
            <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
              <button 
                onClick={() => setSelectedChat(null)}
                className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate" title={selectedChat.id}>{selectedChat.id}</h3>
              </div>
              <div className="h-8 w-px bg-border-subtle mx-2 shrink-0" />
              <Badge variant={selectedChat.status === 'human_handling' ? 'warning' : 'default'} className="px-3 py-1 gap-1 shrink-0 whitespace-nowrap">
                {selectedChat.status === 'human_handling' && <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" />}
                {formatStatus(selectedChat.status)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 shrink-0 ml-4">
              {selectedChat.status === 'human_handling' ? (
                <>
                  {selectedChat.assigned_user && (
                    <span className="text-sm text-text-secondary mr-2 whitespace-nowrap">
                      Handled by: <span className="font-medium text-white">{selectedChat.assigned_user.name}</span>
                    </span>
                  )}
                  {(selectedChat.assigned_user?.id === user?.id || !selectedChat.assigned_user) && (
                    <Button variant="secondary" size="sm" className="gap-2 shrink-0 whitespace-nowrap" onClick={handleRelease}>
                      <FastForward className="w-4 h-4 shrink-0" /> Release to AI
                    </Button>
                  )}
                </>
              ) : (
                <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shrink-0 whitespace-nowrap" onClick={handleTakeover}>
                  <PhoneCall className="w-4 h-4 shrink-0" /> Take Over
                </Button>
              )}
            </div>
          </div>
          
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, idx) => {
              const msgSender = msg.sender || msg.sender_type;
              const isCustomer = msgSender === 'user' || msgSender === 'customer';
              const isStaff = msgSender === 'staff';
              const senderDisplayName = isStaff ? (msg.sender_user?.name || msg.sender_name || 'Staff') : (isCustomer ? 'Customer' : 'AI');
              
              return (
                <div key={msg.id || idx} className={cn("flex gap-4 max-w-[80%]", isCustomer ? "ml-auto flex-row-reverse" : "")}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
                    isCustomer ? "bg-card-elevated text-text-secondary" : 
                    isStaff ? "bg-amber-500/20 text-amber-500" : "bg-brand-500/20 text-brand-400"
                  )}>
                    {isCustomer ? <User className="w-5 h-5" /> : isStaff ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={cn("flex flex-col gap-1", isCustomer ? "items-end" : "items-start")}>
                    <div className={cn("px-5 py-3 rounded-2xl text-sm leading-relaxed",
                      isCustomer ? "bg-brand-500 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(37,99,235,0.2)]" : 
                      isStaff ? "bg-amber-500 text-white rounded-tl-sm" :
                      "bg-card-elevated text-white rounded-tl-sm border border-border-subtle"
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-text-secondary px-1">
                      {isStaff ? `${senderDisplayName} • ` : isCustomer ? '' : 'AI • '}{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex gap-4 max-w-[80%]">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <div className="px-5 py-3 rounded-2xl bg-card-elevated rounded-tl-sm border border-border-subtle flex gap-1 items-center h-[46px]">
                    <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 bg-card-base border-t border-border-subtle relative">
            {selectedChat.status !== 'human_handling' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <Badge variant="outline" className="bg-background-base text-brand-400 border-brand-500/30 shadow-lg">
                  AI is currently handling this conversation
                </Badge>
              </div>
            )}
            <div className={cn("flex items-center gap-3 bg-background-elevated p-2 rounded-xl border border-border-subtle", 
              selectedChat.status !== 'human_handling' ? "opacity-50 pointer-events-none" : "focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all"
            )}>
              <Button variant="ghost" size="icon" className="text-text-secondary rounded-lg">
                <Paperclip className="w-5 h-5" />
              </Button>
              <input 
                type="text" 
                placeholder={selectedChat.status === 'human_handling' ? 
                  (selectedChat.assigned_user && selectedChat.assigned_user.id !== user?.id ? `Handled by ${selectedChat.assigned_user.name}` : "Type a message...") 
                  : "Take over conversation to reply..."}
                className="flex-1 bg-transparent text-sm text-white focus:outline-none px-2"
                disabled={selectedChat.status !== 'human_handling' || (!!selectedChat.assigned_user && selectedChat.assigned_user.id !== user?.id)}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button 
                size="icon" 
                className={cn("rounded-lg h-10 w-10 shrink-0", selectedChat.status === 'human_handling' && inputText.trim() ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-card-elevated text-text-secondary")}
                onClick={handleSendMessage}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col items-center justify-center h-full border-border-subtle bg-card-base/50 backdrop-blur-xl">
          <Bot className="w-16 h-16 text-text-secondary mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-white mb-2">No Conversation Selected</h3>
          <p className="text-text-secondary">Select a conversation from the left to view messages and intervene.</p>
        </Card>
      )}
      </div>
    </div>
  );
}

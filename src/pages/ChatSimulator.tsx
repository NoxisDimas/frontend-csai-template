import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Send, Paperclip, Smile, Bot, User, Info, CheckCircle2, Package } from 'lucide-react';
import { cn } from '../components/ui/utils';
import { getWsUrl, api } from '../lib/api';
import { toast } from 'sonner';

interface ProductInfo {
  title: string;
  url: string;
  image_url: string;
  price: string;
}

interface SimMessage {
  id: string;
  role: 'customer' | 'ai' | 'staff' | 'system';
  content: string;
  time: string;
  has_product?: boolean;
  products?: ProductInfo[];
  sender_name?: string;
}

// Generate a valid UUID v4
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback if crypto.randomUUID is not available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export function ChatSimulator() {
  const [sessionId] = useState(generateUUID());
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [wsStatus, setWsStatus] = useState<'Connecting...' | 'Connected' | 'Disconnected'>('Connecting...');
  
  const [rating, setRating] = useState(0);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wsUrl = getWsUrl(`/chat/ws/${sessionId}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus('Connected');
    ws.onclose = () => setWsStatus('Disconnected');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') {
          setIsTyping(data.status);
        } else if (data.type === 'message' || data.type === 'escalation' || data.type === 'new_message') {
          if (data.sender !== 'customer' && data.sender !== 'user') {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: data.sender || 'ai',
                content: data.text || data.message || data.messages,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                has_product: data.has_product,
                products: data.products,
                sender_name: data.sender_name
              }
            ]);
            setIsTyping(false);
            scrollToBottom();
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
  }, [sessionId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isSessionEnded) return;

    const text = inputText;
    setInputText('');

    // Optimistically add to UI
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'customer',
        content: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }
    ]);
    scrollToBottom();

    // Send to WS
    wsRef.current.send(JSON.stringify({
      type: 'message',
      text: text,
      sender: 'customer'
    }));
  };

  const handleEndSession = async () => {
    try {
      await api.post(`/conversations/${sessionId}/feedback`, {
        rating: rating || 5, // default to 5 if none selected
        feedback_text: feedbackNotes
      });
      setIsSessionEnded(true);
      toast.success('Session ended and feedback submitted.');
      wsRef.current?.close();
    } catch (error) {
      console.error('Failed to submit feedback', error);
      toast.error('Failed to end session');
    }
  };

  return (
    <div className="h-screen bg-background p-6 flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-white">Nova AI - Chat Simulator</h1>
        <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2">
          Back to Dashboard
        </Button>
      </div>
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Chat Panel - 70% */}
        <Card className="flex-1 flex flex-col h-full border-border-subtle bg-card-base/50 backdrop-blur-xl overflow-hidden">
        <CardHeader className="border-b border-border-subtle bg-card-base px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chat Simulator</CardTitle>
              <p className="text-sm text-text-secondary mt-1">Test the AI responses in real-time as a customer</p>
            </div>
            <Badge variant={wsStatus === 'Connected' ? 'success' : 'outline'} className="gap-1 px-3 py-1 text-sm">
              {wsStatus === 'Connected' && <span className="w-2 h-2 rounded-full bg-success animate-pulse" />}
              {wsStatus}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isTyping && (
             <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-50">
               <Bot className="w-16 h-16 mb-4" />
               <p>Send a message to start the simulation.</p>
             </div>
          )}
          {messages.map((msg) => {
            const isCustomer = msg.role === 'customer';
            const isStaff = msg.role === 'staff';
            const senderDisplayName = isStaff ? 'Staff' : (isCustomer ? 'Customer' : 'AI');
            
            return (
            <div key={msg.id} className={cn("flex gap-4 max-w-[80%]", isCustomer ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                isCustomer ? "bg-card-elevated text-text-secondary" : 
                isStaff ? "bg-amber-500/20 text-amber-500" : "bg-brand-500/20 text-brand-400"
              )}>
                {isCustomer ? <User className="w-5 h-5" /> : isStaff ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={cn(
                "flex flex-col gap-1",
                isCustomer ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-5 py-3 rounded-2xl text-sm leading-relaxed",
                  isCustomer 
                    ? "bg-brand-500 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(37,99,235,0.2)]" 
                    : isStaff ? "bg-amber-500 text-white rounded-tl-sm border border-border-subtle" : "bg-card-elevated text-white rounded-tl-sm border border-border-subtle"
                )}>
                  {msg.content}
                </div>
                {msg.has_product && msg.products && msg.products.length > 0 && (
                  <div className={cn(
                    "grid gap-2 mt-1 max-w-full",
                    msg.products.length === 1 
                      ? "grid-cols-1 w-[260px] sm:w-[280px]" 
                      : "grid-cols-1 sm:grid-cols-2 w-[260px] sm:w-[560px]"
                  )}>
                    {msg.products.map((p, idx) => (
                      <div key={idx} className="flex flex-col gap-3 bg-card-elevated border border-border-subtle rounded-xl p-3 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex gap-3 items-center">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-card-base shrink-0 border border-border-subtle">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-text-secondary"><Package className="w-5 h-5" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-white truncate" title={p.title}>{p.title}</p>
                            <p className="text-xs text-brand-400 mt-0.5 font-medium">{p.price && p.price !== "N/A" && p.price !== "0" ? `Rp ${p.price}` : "Cek Harga"}</p>
                          </div>
                        </div>
                        {p.url && (
                          <Button size="sm" className="w-full h-8 text-xs bg-brand-500 hover:bg-brand-600 text-white transition-colors" onClick={() => window.open(p.url, '_blank', 'noopener,noreferrer')}>
                            Lihat Produk
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <span className="text-xs text-text-secondary px-1">
                  {isStaff ? `${senderDisplayName} • ` : isCustomer ? '' : 'AI • '}{msg.time}
                </span>
              </div>
            </div>
          )})}
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-4 max-w-[80%]">
               <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-card-elevated px-5 py-4 rounded-2xl rounded-tl-sm border border-border-subtle flex items-center gap-1.5 h-[46px]">
                  <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 bg-card-base border-t border-border-subtle shrink-0">
          <div className="flex items-center gap-3 bg-background-base p-2 rounded-xl border border-border-subtle focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
            <Button variant="ghost" size="icon" className="text-text-secondary rounded-lg" disabled={isSessionEnded}>
              <Paperclip className="w-5 h-5" />
            </Button>
            <input 
              type="text" 
              placeholder={isSessionEnded ? "Session ended." : "Type a message to simulate customer..."}
              className="flex-1 bg-transparent text-sm text-white focus:outline-none px-2 disabled:opacity-50"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isSessionEnded}
            />
            <Button variant="ghost" size="icon" className="text-text-secondary rounded-lg" disabled={isSessionEnded}>
              <Smile className="w-5 h-5" />
            </Button>
            <Button 
              size="icon" 
              className={cn("rounded-lg h-10 w-10 shrink-0", inputText.trim() && !isSessionEnded ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-card-elevated text-text-secondary")}
              onClick={handleSendMessage}
              disabled={isSessionEnded}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Panel - 30% */}
      <div className="w-[30%] flex flex-col gap-6 shrink-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-400" /> Session Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs text-text-secondary font-medium">Conversation ID</span>
              <p className="text-sm font-medium text-white">{sessionId}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-text-secondary font-medium">Active Channel</span>
              <p className="text-sm text-white">Web Widget Simulator</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(isSessionEnded && "opacity-50 pointer-events-none")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> End Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Simulated CSAT Rating</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(star => (
                  <button 
                    key={star} 
                    className={cn("text-2xl transition-colors", rating >= star ? "text-warning" : "text-text-secondary hover:text-warning/50")}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Feedback Notes</label>
              <textarea 
                className="w-full h-24 rounded-xl border border-border-subtle bg-background-elevated p-3 text-sm text-white resize-none focus:outline-none focus:border-brand-500"
                placeholder="Add testing notes here..."
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
              />
            </div>
            <Button variant="danger" className="w-full" onClick={handleEndSession}>End Session</Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

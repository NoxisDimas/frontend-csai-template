import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { cn } from '../ui/utils';
import { 
  LayoutDashboard, 
  Inbox, 
  History, 
  BookOpen, 
  ShoppingBag, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  Link2, 
  Users,
  LogOut,
  Bell,
  Search,
  Bot,
  Menu,
  X
} from 'lucide-react';
import { Input } from '../ui/input';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/' },
  { icon: Inbox, label: 'Live Inbox', path: '/inbox' },
  { icon: History, label: 'Conversation History', path: '/history' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/knowledge' },
  { icon: ShoppingBag, label: 'Products (RAG)', path: '/products' },
  { icon: AlertTriangle, label: 'Escalation Tickets', path: '/tickets' },
  { icon: Settings, label: 'Settings', path: '/settings', adminOnly: true },
  { icon: Link2, label: 'Integrations', path: '/integrations', adminOnly: true },
  { icon: Users, label: 'User Management', path: '/users', adminOnly: true },
  { icon: Bot, label: 'Chat Simulator', path: '/chat-simulator' },
];

import { useAuth } from '../../contexts/AuthContext';

export function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isLoginPage = location.pathname === '/login';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background-base text-text-primary overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden h-16 border-b border-border-subtle bg-sidebar flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">Nova AI</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-text-secondary hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] bg-sidebar border-r border-border-subtle flex flex-col transition-transform duration-300 md:relative md:translate-x-0 shrink-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-0 w-full h-32 bg-brand-500/5 blur-[100px] pointer-events-none" />
        
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">Nova AI</span>
          </div>
          <button 
            className="md:hidden text-text-secondary hover:text-white p-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto z-10">
          {navItems
            .filter(item => !item.adminOnly || user?.role === 'admin' || user?.role === 'superadmin')
            .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-brand-500/10 text-brand-400" 
                  : "text-text-secondary hover:bg-card-elevated hover:text-text-primary"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border-subtle z-10">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-card-elevated transition-colors cursor-pointer">
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-text-secondary truncate capitalize">{user?.role || 'Guest'}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="text-text-secondary hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background-base relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 blur-[120px] pointer-events-none rounded-full" />
        
        {/* Top Header */}
        {/* <header className="h-16 border-b border-border-subtle flex items-center justify-between px-8 bg-background-base/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex-1 max-w-md">
            <Input 
              icon={<Search className="w-4 h-4" />} 
              placeholder="Search conversations, tickets, or users..." 
              className="bg-card-base border-border-subtle rounded-full"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-text-secondary hover:text-white transition-colors rounded-full hover:bg-card-elevated">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-background-base"></span>
            </button>
          </div>
        </header> */}

        {/* Page Content */}
        <div className="flex-1 overflow-auto z-0 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

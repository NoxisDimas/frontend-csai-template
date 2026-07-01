import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Mail, Lock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { NotificationToast } from '../components/Notifications';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      NotificationToast.error('Login Failed', 'Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.data.access_token;
      
      // We pass the token to the context which will store it and fetch the user profile
      login(token);
      NotificationToast.success('Login Successful', 'Welcome back to Nova AI Admin');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || error.response?.data?.message || 'Invalid credentials';
      NotificationToast.error('Login Failed', typeof msg === 'string' ? msg : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-base flex items-center justify-center relative overflow-hidden p-4">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-400/5 blur-[100px] rounded-full pointer-events-none" />
      
      <Card className="w-full max-w-md bg-card-base/50 backdrop-blur-xl border-border-subtle shadow-2xl z-10 relative overflow-visible">
        {/* Glow border effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-b from-brand-500/20 to-transparent rounded-[16px] -z-10" />
        
        <CardHeader className="space-y-3 pb-8 text-center pt-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] mb-4">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-display font-bold">Nova AI Admin</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Email Address</label>
                <Input 
                  type="email" 
                  placeholder="admin@nova.ai" 
                  icon={<Mail className="w-4 h-4" />} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Password</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  icon={<Lock className="w-4 h-4" />} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-border-subtle bg-background-elevated text-brand-500 focus:ring-brand-500 focus:ring-offset-background-base" />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm text-brand-400 hover:text-brand-500 transition-colors">Forgot password?</a>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-2 pt-4">
            <Activity className="w-4 h-4 text-success" />
            <span className="text-xs text-text-secondary font-medium">All systems operational</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

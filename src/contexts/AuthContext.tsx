import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_data');
      
      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse user data from local storage');
          }
        }
        
        // Fetch fresh profile data to verify token
        try {
          await fetchProfile();
        } catch (error) {
          // If fetch fails (e.g., 401), the interceptor will clear the token and redirect.
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch profile', error);
      throw error;
    }
  };

  const login = (newToken: string, userData?: User) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
    } else {
      // If userData isn't provided, fetch it immediately
      fetchProfile();
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

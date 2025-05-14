import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient, Session } from '@supabase/supabase-js';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Watchlist from './components/Watchlist';
import { DataChart } from './components/DataChart';

import PieSignals from './components/PieSignals';
import EnvTest from './components/EnvTest';
import Profile from './components/Profile';
import Settings from './components/Settings';
import DataExplorer from './components/DataExplorer';
import TopIcons from './components/TopIcons';
import AIAnalysis from './components/AIAnalysis';

// Theme Context
import { ThemeProvider } from './context/ThemeContext';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in production with mock data enabled
    if (process.env.REACT_APP_USE_MOCK_DATA === 'true') {
      console.log('Using mock data mode with auto-login');
      // Create a fake session for production without backend
      const fakeSession = {
        access_token: 'fake-token-for-production',
        refresh_token: 'fake-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'demo@example.com',
          user_metadata: {
            full_name: 'Demo User'
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        },
        expires_at: Date.now() + 86400000, // 24 hours from now
        expires_in: 86400, // 24 hours in seconds
        token_type: 'bearer'
      } as Session;
      
      setSession(fakeSession);
      setLoading(false);
      return;
    }
    
    // Check for development bypass
    const bypassAuth = localStorage.getItem('supabase.auth.token');
    if (bypassAuth) {
      try {
        const parsedBypass = JSON.parse(bypassAuth);
        if (parsedBypass.currentSession && parsedBypass.currentSession.access_token === 'fake-token-for-development') {
          console.log('Using development authentication bypass');
          // Create a fake session object
          // Ensure the user object has all required properties
          const user = parsedBypass.currentSession.user;
          const completeUser = {
            ...user,
            app_metadata: user.app_metadata || {},
            aud: user.aud || 'authenticated',
            created_at: user.created_at || new Date().toISOString()
          };
          
          const fakeSession = {
            access_token: 'fake-token-for-development',
            refresh_token: 'fake-refresh-token',
            user: completeUser,
            expires_at: parsedBypass.expiresAt,
            expires_in: 86400, // 24 hours in seconds
            token_type: 'bearer'
          } as Session;
          
          setSession(fakeSession);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing bypass auth:', error);
      }
    }
    
    // Normal authentication flow
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session ? 'Logged in' : 'No session');
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session ? 'Logged in' : 'No session');
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center h-screen bg-light-bg dark:bg-dark-bg transition-colors duration-200">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-light-accent dark:border-dark-accent"></div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-200">
          <Navbar session={session} />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
              <Route path="/watchlist" element={session ? <Watchlist /> : <Navigate to="/auth" />} />
              <Route path="/chart/:id?" element={session ? <DataChart /> : <Navigate to="/auth" />} />

              <Route path="/signals" element={session ? <PieSignals /> : <Navigate to="/auth" />} />
              <Route path="/profile" element={session ? <Profile /> : <Navigate to="/auth" />} />
              <Route path="/settings" element={session ? <Settings /> : <Navigate to="/auth" />} />
              <Route path="/explorer" element={session ? <DataExplorer /> : <Navigate to="/auth" />} />
              <Route path="/ai-analysis/:pieId?" element={session ? <AIAnalysis /> : <Navigate to="/auth" />} />
              <Route path="/env-test" element={<EnvTest />} />
              <Route path="/" element={<Navigate to={session ? "/dashboard" : "/auth"} />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;

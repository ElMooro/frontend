import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient, Session } from '@supabase/supabase-js';
import ThemeToggle from '../ThemeToggle';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface NavbarProps {
  session: Session | null;
}

const Navbar: React.FC<NavbarProps> = ({ session }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="bg-light-accent dark:bg-dark-card text-white shadow-lg transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold">
                Financial Data Platform
              </Link>
            </div>
            {session && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-white"
                >
                  Dashboard
                </Link>
                <Link
                  to="/watchlist"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-white"
                >
                  Watchlist
                </Link>
                <Link
                  to="/chart"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-white"
                >
                  Charts
                </Link>

                <Link
                  to="/signals"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-white"
                >
                  Signal Pies
                </Link>
                <Link
                  to="/ai-analysis"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-white"
                >
                  AI Analysis
                </Link>
                <Link
                  to="/explorer"
                  className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium hover:border-white"
                >
                  Data Explorer
                </Link>
              </div>
            )}
          </div>
          
          {session ? (
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <ThemeToggle />
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-accent dark:ring-offset-dark-card focus:ring-white"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-light-accent-hover dark:bg-dark-accent flex items-center justify-center">
                      {session.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </button>
                </div>
                
                {isProfileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-dark-card ring-1 ring-black ring-opacity-5 focus:outline-none z-10 transition-colors duration-200">
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                      Signed in as <span className="font-medium text-gray-900 dark:text-white">{session.user?.email}</span>
                    </div>
                    <div className="border-t border-gray-100 dark:border-dark-border"></div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleSignOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex sm:items-center">
              <Link
                to="/auth"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Sign in
              </Link>
            </div>
          )}
          
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          {session ? (
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/dashboard"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/watchlist"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Watchlist
              </Link>
              <Link
                to="/chart"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Charts
              </Link>

              <Link
                to="/signals"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Signal Pies
              </Link>
              <Link
                to="/ai-analysis"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                onClick={() => setIsMenuOpen(false)}
              >
                AI Analysis
              </Link>
              <Link
                to="/explorer"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Data Explorer
              </Link>
              <div className="border-t border-light-border dark:border-dark-border pt-4 pb-3">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-light-accent dark:bg-dark-accent flex items-center justify-center">
                      {session.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium">{session.user?.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center pl-3 pr-4 py-2">
                    <span className="text-base font-medium mr-2">Theme:</span>
                    <ThemeToggle />
                  </div>
                  <Link
                    to="/profile"
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/auth"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium hover:bg-light-accent-hover dark:hover:bg-dark-accent-hover hover:border-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

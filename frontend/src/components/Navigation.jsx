import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import UserProfile from './auth/UserProfile';
import Tooltip, { InfoTooltip } from './ui/Tooltip';

const Navigation = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileMenuOpen]);

  // Don't show navigation on auth-specific pages
  if (location.pathname === '/login' || location.pathname === '/auth/callback') {
    return null;
  }

  return (
    <nav 
      className="bg-slate-800 border-b border-slate-700"
      role="navigation"
      aria-label="Main navigation"
      id="navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-xl font-bold text-white">
              <div className="h-8 w-8 bg-sky-500 rounded-lg flex items-center justify-center mr-3">
                <svg 
                  className="h-5 w-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-label="Game Backlog Tracker Logo"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              <span className="hidden sm:inline">Game Backlog Tracker</span>
              <span className="sm:hidden">GBT</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Main Navigation Links */}
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className={`${
                  isActive('/') 
                    ? 'text-sky-400 border-b-2 border-sky-400' 
                    : 'text-slate-100 hover:text-white'
                } px-3 py-2 text-sm font-medium transition-colors duration-200`}
              >
                Home
              </Link>
              
              {isAuthenticated && (
                <>
                  <Tooltip 
                    content="View your gaming statistics, backlog progress, and quick actions"
                    position="bottom"
                  >
                    <Link
                      to="/dashboard"
                      className={`${
                        isActive('/dashboard') 
                          ? 'text-sky-400 border-b-2 border-sky-400' 
                          : 'text-slate-100 hover:text-white'
                      } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                    >
                      Dashboard
                    </Link>
                  </Tooltip>
                  
                  <Tooltip 
                    content="Browse your game collection, manage backlog, and track progress"
                    position="bottom"
                  >
                    <Link
                      to="/library"
                      className={`${
                        isActive('/library') 
                          ? 'text-sky-400 border-b-2 border-sky-400' 
                          : 'text-slate-100 hover:text-white'
                      } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                    >
                      Library
                    </Link>
                  </Tooltip>
                </>
              )}
              
              <Link
                to="/about"
                className={`${
                  isActive('/about') 
                    ? 'text-sky-400 border-b-2 border-sky-400' 
                    : 'text-slate-100 hover:text-white'
                } px-3 py-2 text-sm font-medium transition-colors duration-200`}
              >
                About
              </Link>
            </div>

            {/* Authentication Section */}
            <div className="flex items-center">
              {isAuthenticated && user ? (
                <UserProfile />
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-slate-50 bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800 transition-colors duration-200"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              aria-expanded={isMobileMenuOpen}
              aria-label="Main menu"
              style={{ minWidth: '44px', minHeight: '44px' }} // Ensure 44px touch target
            >
              <svg
                className={`h-6 w-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-700 rounded-b-lg border-x border-b border-slate-600">
            <Link
              to="/"
              className={`${
                isActive('/') 
                  ? 'text-sky-400 bg-slate-600' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              } block px-3 py-3 text-base font-medium rounded-md transition-colors duration-200`}
              style={{ minHeight: '44px' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`${
                    isActive('/dashboard') 
                      ? 'text-sky-400 bg-slate-600' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-600'
                  } block px-3 py-3 text-base font-medium rounded-md transition-colors duration-200`}
                  style={{ minHeight: '44px' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/library"
                  className={`${
                    isActive('/library') 
                      ? 'text-sky-400 bg-slate-600' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-600'
                  } block px-3 py-3 text-base font-medium rounded-md transition-colors duration-200`}
                  style={{ minHeight: '44px' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Library
                </Link>
              </>
            )}
            
            <Link
              to="/about"
              className={`${
                isActive('/about') 
                  ? 'text-sky-400 bg-slate-600' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              } block px-3 py-3 text-base font-medium rounded-md transition-colors duration-200`}
              style={{ minHeight: '44px' }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>

            {/* Mobile Authentication */}
            <div className="pt-2 border-t border-slate-600">
              {isAuthenticated && user ? (
                <div className="flex items-center px-3 py-3">
                  <div className="flex-shrink-0">
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=0ea5e9&color=fff`}
                      alt={user.name || 'User avatar'}
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{user.name}</div>
                    <div className="text-sm font-medium text-slate-400">{user.email}</div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-3 text-base font-medium text-slate-50 bg-sky-700 hover:bg-sky-800 rounded-md transition-colors duration-200"
                  style={{ minHeight: '44px' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
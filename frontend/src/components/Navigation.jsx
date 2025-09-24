import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import UserProfile from './auth/UserProfile';

const Navigation = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Don't show navigation on auth-specific pages
  if (location.pathname === '/login' || location.pathname === '/auth/callback') {
    return null;
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-xl font-bold text-white">
              <div className="h-8 w-8 bg-sky-500 rounded-lg flex items-center justify-center mr-3">
                <svg 
                  className="h-5 w-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              Game Backlog Tracker
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            {/* Main Navigation Links */}
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className={`${
                  isActive('/') 
                    ? 'text-sky-400 border-b-2 border-sky-400' 
                    : 'text-slate-300 hover:text-white'
                } px-3 py-2 text-sm font-medium transition-colors duration-200`}
              >
                Home
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className={`${
                      isActive('/dashboard') 
                        ? 'text-sky-400 border-b-2 border-sky-400' 
                        : 'text-slate-300 hover:text-white'
                    } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/library"
                    className={`${
                      isActive('/library') 
                        ? 'text-sky-400 border-b-2 border-sky-400' 
                        : 'text-slate-300 hover:text-white'
                    } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                  >
                    Library
                  </Link>
                </>
              )}
              
              <Link
                to="/about"
                className={`${
                  isActive('/about') 
                    ? 'text-sky-400 border-b-2 border-sky-400' 
                    : 'text-slate-300 hover:text-white'
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
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800 transition-colors duration-200"
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
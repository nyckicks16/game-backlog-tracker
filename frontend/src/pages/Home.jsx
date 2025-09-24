import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import api from '../utils/api';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [backendData, setBackendData] = useState(null);

  useEffect(() => {
    // Test backend connection
    const testBackend = async () => {
      try {
        // Check if api utility exists and has health method
        if (typeof api?.health === 'function') {
          const healthData = await api.health();
          setBackendStatus('connected ✅');
          setBackendData(healthData);
        } else {
          setBackendStatus('api not configured');
        }
      } catch (error) {
        setBackendStatus('disconnected ❌');
        console.error('Backend connection failed:', error);
      }
    };

    testBackend();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-6">
              🎮 Game Backlog Tracker
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Manage your video game backlog, track progress, and maintain ratings/reviews. 
              Never lose track of that perfect game you wanted to play!
            </p>
            
            {!isAuthenticated ? (
              <div className="flex justify-center space-x-4">
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 transition-all duration-200 transform hover:scale-105"
                >
                  Get Started
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center px-6 py-3 border border-slate-600 text-base font-medium rounded-xl text-slate-300 bg-transparent hover:bg-slate-800 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 transition-all duration-200"
                >
                  Learn More
                </Link>
              </div>
            ) : (
              <div className="text-sky-400">
                <p className="text-lg mb-4">Welcome back, {user?.name}!</p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 transition-all duration-200 transform hover:scale-105"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Backend Status */}
          <div className="mb-12 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              Backend Status: <span className="text-sky-400">{backendStatus}</span>
            </h3>
            {backendData && (
              <div className="text-sm text-slate-400">
                <p>API Version: {backendData.version}</p>
                <p>Last Check: {new Date(backendData.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors duration-200">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-white mb-3">Backlog Management</h3>
              <p className="text-slate-400">Keep track of games you want to play with smart categorization and priority settings</p>
            </div>
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors duration-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-3">Progress Tracking</h3>
              <p className="text-slate-400">Monitor your active gaming sessions with detailed progress metrics and time tracking</p>
            </div>
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors duration-200">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-white mb-3">Reviews & Ratings</h3>
              <p className="text-slate-400">Rate and review finished games to build your personal gaming history</p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-6 rounded-xl border border-slate-600">
              <h3 className="text-lg font-semibold text-white mb-3">🔒 Secure & Private</h3>
              <p className="text-slate-300">Your gaming data is protected with enterprise-grade security and Google OAuth authentication</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-6 rounded-xl border border-slate-600">
              <h3 className="text-lg font-semibold text-white mb-3">📊 Analytics & Insights</h3>
              <p className="text-slate-300">Get detailed insights into your gaming habits, preferences, and completion rates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
/**
 * Dashboard Page Component
 * User Story #9: Implement Protected Routes and Authentication Guards
 * 
 * Main dashboard for authenticated users - first protected route
 */
import React from 'react';
import { useAuth } from '../contexts/AuthProvider';

const Dashboard = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Gamer'}! 🎮
          </h1>
          <p className="text-xl text-slate-400">
            Ready to organize your gaming library?
          </p>
        </div>

        {/* Dashboard Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Backlog Stats */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-sky-500 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Backlog</h3>
              <div className="text-2xl">📚</div>
            </div>
            <p className="text-3xl font-bold text-sky-400 mb-2">0</p>
            <p className="text-sm text-slate-400">Games to play</p>
          </div>

          {/* Currently Playing */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-sky-500 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Playing</h3>
              <div className="text-2xl">🎯</div>
            </div>
            <p className="text-3xl font-bold text-yellow-400 mb-2">0</p>
            <p className="text-sm text-slate-400">Active games</p>
          </div>

          {/* Completed */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-sky-500 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Completed</h3>
              <div className="text-2xl">✅</div>
            </div>
            <p className="text-3xl font-bold text-green-400 mb-2">0</p>
            <p className="text-sm text-slate-400">Games finished</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center p-4 bg-sky-600 hover:bg-sky-700 rounded-xl text-white font-medium transition-colors duration-200 transform hover:scale-105">
              <span className="text-2xl mr-3">➕</span>
              Add Game
            </button>
            <button className="flex items-center p-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors duration-200">
              <span className="text-2xl mr-3">📖</span>
              View Library
            </button>
            <button className="flex items-center p-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors duration-200">
              <span className="text-2xl mr-3">🎲</span>
              Random Pick
            </button>
            <button className="flex items-center p-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors duration-200">
              <span className="text-2xl mr-3">📊</span>
              View Stats
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Welcome to Game Backlog Tracker!
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Start building your gaming library by adding your first game to track your progress and never lose sight of that perfect game to play next.
            </p>
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800 transition-all duration-200 transform hover:scale-105">
              Add Your First Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
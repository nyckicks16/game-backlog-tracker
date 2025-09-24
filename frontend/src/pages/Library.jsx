/**
 * Library Page Component
 * User Story #9: Implement Protected Routes and Authentication Guards
 * 
 * Game library page - another protected route for testing route guards
 */
import React from 'react';
import { useAuth } from '../contexts/AuthProvider';

const Library = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎮 Game Library
          </h1>
          <p className="text-xl text-slate-400">
            Your complete gaming collection
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Status:</label>
              <select className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5">
                <option>All Games</option>
                <option>Backlog</option>
                <option>Playing</option>
                <option>Completed</option>
                <option>Dropped</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Platform:</label>
              <select className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5">
                <option>All Platforms</option>
                <option>PC</option>
                <option>PlayStation</option>
                <option>Xbox</option>
                <option>Nintendo Switch</option>
                <option>Mobile</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Sort:</label>
              <select className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5">
                <option>Recently Added</option>
                <option>Alphabetical</option>
                <option>Rating</option>
                <option>Release Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Your library is empty
            </h2>
            <p className="text-slate-400 mb-8">
              Start building your game collection by adding your first game. Track what you want to play, what you're currently playing, and what you've completed!
            </p>
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-slate-50 bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-800 transition-all duration-200 transform hover:scale-105">
              <span className="text-xl mr-2">➕</span>
              Add Your First Game
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
            <p className="text-2xl font-bold text-sky-400">0</p>
            <p className="text-sm text-slate-400">Total Games</p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
            <p className="text-2xl font-bold text-yellow-400">0</p>
            <p className="text-sm text-slate-400">In Progress</p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
            <p className="text-2xl font-bold text-green-400">0</p>
            <p className="text-sm text-slate-400">Completed</p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
            <p className="text-2xl font-bold text-slate-400">0%</p>
            <p className="text-sm text-slate-400">Completion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;
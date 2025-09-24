/**
 * Dashboard Page Component
 * User Story #9: Implement Protected Routes and Authentication Guards
 * User Story #13: UX Design Optimization - Enhanced loading states and user feedback
 * 
 * Main dashboard for authenticated users - first protected route
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { DashboardCardSkeleton } from '../components/ui/SkeletonLoader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useAnnouncer } from '../components/ui/Accessibility';

const Dashboard = () => {
  const { user } = useAuth();
  const { announceLoading, announceLoadingComplete, announceSuccess, announceError } = useAnnouncer();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    backlog: 0,
    playing: 0,
    completed: 0
  });
  const [actionLoading, setActionLoading] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Simulate loading dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        announceLoading('Loading your gaming dashboard');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - in real app, this would come from API
        setStats({
          backlog: 12,
          playing: 3,
          completed: 47
        });
        
        announceLoadingComplete('Dashboard loaded successfully');
        toast.success('Dashboard updated');
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        announceError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [announceLoading, announceLoadingComplete, announceError]);

  const handleQuickAction = async (action) => {
    setActionLoading(action);
    
    try {
      // Announce the action is starting
      const actionMessages = {
        add: 'Adding new game to your library',
        library: 'Opening your game library',
        random: 'Finding a random game recommendation',
        stats: 'Loading your gaming statistics'
      };
      
      announceLoading(actionMessages[action] || 'Processing action');
      
      // Simulate action processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      switch (action) {
        case 'add':
          announceSuccess('Ready to add your first game');
          toast.success('Ready to add your first game!');
          break;
        case 'library':
          announceSuccess('Opening your library');
          toast.success('Opening your library...');
          break;
        case 'random':
          announceSuccess('Found a random game recommendation');
          toast.success('🎲 Found a random game for you!');
          break;
        case 'stats':
          announceSuccess('Gaming statistics loaded');
          toast.success('📊 Loading your gaming statistics...');
          break;
        default:
          announceSuccess('Action completed');
          toast.success('Action completed!');
      }
    } catch (error) {
      announceError('Action failed. Please try again.');
      toast.error('Action failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main 
      className="min-h-screen bg-slate-900 py-8"
      id="main-content"
      role="main"
      aria-label="Dashboard"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <header className="mb-12" role="banner">
          <h1 className="text-4xl font-bold text-white mb-2">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Gamer'}! 🎮
          </h1>
          <p className="text-xl text-slate-400">
            Ready to organize your gaming library?
          </p>
        </header>

        {/* Primary Metric Display - Single Focus Design */}
        <div className="mb-12">
          {loading ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
              <DashboardCardSkeleton />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-700 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">📚</div>
                <h2 className="text-5xl font-bold text-sky-400 mb-4">{stats.backlog}</h2>
                <p className="text-xl text-slate-300 mb-8">
                  {stats.backlog === 0 ? 'No games in your backlog yet' : 'Games in your backlog'}
                </p>
                
                {stats.backlog === 0 ? (
                  <button 
                    onClick={() => handleQuickAction('add')}
                    disabled={actionLoading === 'add'}
                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl !text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600 disabled:opacity-75 border border-emerald-500/30 hover:border-emerald-400/50 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed min-h-[56px]"
                  >
                    {actionLoading === 'add' ? (
                      <>
                        <LoadingSpinner size="sm" color="white" className="mr-3" />
                        Getting Started...
                      </>
                    ) : (
                      <>
                        <span className="text-2xl mr-3">➕</span>
                        Add Your First Game
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-400">Ready to start playing?</p>
                    <button 
                      onClick={() => handleQuickAction('random')}
                      disabled={actionLoading === 'random'}
                      className="inline-flex items-center justify-center px-6 py-4 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 disabled:from-sky-700 disabled:to-sky-700 disabled:opacity-75 border border-sky-500/30 hover:border-sky-400/50 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed min-h-[52px]"
                    >
                      {actionLoading === 'random' ? (
                        <>
                          <LoadingSpinner size="sm" color="white" className="mr-2" />
                          Picking...
                        </>
                      ) : (
                        <>
                          <span className="text-xl mr-2">🎲</span>
                          Pick a Random Game
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Progressive Disclosure: Secondary Stats */}
        {!loading && stats.backlog > 0 && (
          <div className="mb-12">
            <details className="group">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-300 transition-colors mb-6 flex items-center justify-center">
                <span className="mr-2">View Detailed Statistics</span>
                <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Currently Playing */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-yellow-500 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Currently Playing</h3>
                    <div className="text-2xl">🎯</div>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400 mb-2">{stats.playing}</p>
                  <p className="text-sm text-slate-400">Active games</p>
                </div>

                {/* Completed */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-green-500 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Completed</h3>
                    <div className="text-2xl">✅</div>
                  </div>
                  <p className="text-3xl font-bold text-green-400 mb-2">{stats.completed}</p>
                  <p className="text-sm text-slate-400">Games finished</p>
                </div>

                {/* Completion Rate */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-purple-500 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Completion Rate</h3>
                    <div className="text-2xl">📊</div>
                  </div>
                  <p className="text-3xl font-bold text-purple-400 mb-2">
                    {Math.round((stats.completed / (stats.backlog + stats.playing + stats.completed)) * 100)}%
                  </p>
                  <p className="text-sm text-slate-400">Games completed</p>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Simplified Quick Actions - Limited to 2 Primary Actions */}
        {!loading && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <button 
                onClick={() => handleQuickAction('add')}
                disabled={actionLoading === 'add'}
                className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-emerald-700 disabled:to-emerald-700 disabled:opacity-75 rounded-xl text-white font-semibold border border-emerald-500/30 hover:border-emerald-400/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed min-h-[56px] flex-1"
              >
                {actionLoading === 'add' ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-3" />
                    Adding...
                  </>
                ) : (
                  <>
                    <span className="text-2xl mr-3">➕</span>
                    Add Game
                  </>
                )}
              </button>
              
              <button 
                onClick={() => handleQuickAction('library')}
                disabled={actionLoading === 'library'}
                className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 disabled:from-violet-700 disabled:to-violet-700 disabled:opacity-75 rounded-xl text-white font-semibold border border-violet-500/30 hover:border-violet-400/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed min-h-[56px] flex-1"
              >
                {actionLoading === 'library' ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-3" />
                    Loading...
                  </>
                ) : (
                  <>
                    <span className="text-2xl mr-3">📖</span>
                    View Library
                  </>
                )}
              </button>
            </div>

            {/* Progressive Disclosure: Additional Actions */}
            <div className="mt-8">
              <details className="group">
                <summary className="cursor-pointer text-slate-400 hover:text-slate-300 transition-colors flex items-center justify-center">
                  <span className="mr-2">More Actions</span>
                  <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-w-md mx-auto">
                  <button 
                    onClick={() => handleQuickAction('random')}
                    disabled={actionLoading === 'random'}
                    className="flex items-center justify-center p-3 !text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-orange-700 disabled:to-orange-700 disabled:opacity-75 rounded-lg font-semibold border border-orange-500/30 hover:border-orange-400/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed min-h-[48px] text-sm"
                  >
                    {actionLoading === 'random' ? (
                      <>
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                        Picking...
                      </>
                    ) : (
                      <>
                        <span className="text-lg mr-2">🎲</span>
                        Random Pick
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => handleQuickAction('stats')}
                    disabled={actionLoading === 'stats'}
                    className="flex items-center justify-center p-3 !text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 disabled:from-cyan-700 disabled:to-cyan-700 disabled:opacity-75 rounded-lg font-semibold border border-cyan-500/30 hover:border-cyan-400/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed min-h-[48px] text-sm"
                  >
                    {actionLoading === 'stats' ? (
                      <>
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <span className="text-lg mr-2">📊</span>
                        View Stats
                      </>
                    )}
                  </button>
                </div>
              </details>
            </div>
          </div>
        )}

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
            <button 
              onClick={() => handleQuickAction('add')}
              disabled={actionLoading === 'add'}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-xl !text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-emerald-700 disabled:to-emerald-700 disabled:opacity-75 border border-emerald-500/30 hover:border-emerald-400/50 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed min-h-[48px]"
            >
              {actionLoading === 'add' ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Preparing...
                </>
              ) : (
                'Add Your First Game'
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
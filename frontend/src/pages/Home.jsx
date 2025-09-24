import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import api from '../utils/api';
import ExpandableSection, { FeatureExpansion } from '../components/ui/ExpandableSection';
import { HelpTooltip, InfoTooltip, FeatureTooltip } from '../components/ui/Tooltip';

const Home = () => {
  const { isAuthenticated, user, getUserDisplayName } = useAuth();
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
          {/* Hero Section - Simplified for reduced cognitive load */}
          <div className="mb-20">
            <h1 className="text-6xl font-bold text-white mb-6">
              Never Lose Track of Your Games
            </h1>
            <p className="text-2xl text-slate-300 mb-12 max-w-2xl mx-auto">
              Organize your gaming backlog with a simple, beautiful interface.
            </p>
            
            {!isAuthenticated ? (
              <div className="flex justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-slate-50 bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 transition-all duration-200 transform hover:scale-105"
                >
                  Get Started Free
                </Link>
              </div>
            ) : (
              <div className="text-sky-400">
                <p className="text-xl mb-6">Welcome back, {getUserDisplayName(user)}!</p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-slate-50 bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-slate-900 transition-all duration-200 transform hover:scale-105"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Progressive disclosure: Move backend status to bottom and make it less prominent */}
          <div className="mt-24 text-center">
            <details className="inline-block">
              <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-400 transition-colors">
                System Status: <span className="text-sky-400">{backendStatus}</span>
              </summary>
              <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700 text-left">
                {backendData && (
                  <div className="text-sm text-slate-400">
                    <p>API Version: {backendData.version}</p>
                    <p>Last Check: {new Date(backendData.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* Core Features - Progressive Disclosure Implementation */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Everything You Need to Manage Your Games
              <InfoTooltip 
                content="Game Backlog Tracker helps you organize, track, and discover your perfect next game." 
                className="ml-2"
              />
            </h2>
            
            {/* Primary Features - Always Visible */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors duration-200 text-center">
                <div className="text-5xl mb-6">📚</div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-center">
                  Organize Your Backlog
                  <FeatureTooltip 
                    title="Backlog Management"
                    description="Add games to your backlog, categorize them by genre, platform, or priority. Never forget about that game you wanted to play."
                    shortcuts={[
                      { action: "Quick add", keys: "Ctrl+N" },
                      { action: "Search games", keys: "Ctrl+F" }
                    ]}
                  />
                </h3>
                <p className="text-slate-400 mb-4">Keep track of games you want to play</p>
                
                <FeatureExpansion
                  features={[
                    "✓ Add games from IGDB database",
                    "✓ Set priority levels and categories",
                    "✓ Import from Steam, Epic, or manual entry",
                    "✓ Platform filtering and organization",
                    "✓ Wishlist integration",
                    "✓ Smart recommendations based on your tastes"
                  ]}
                  maxVisible={2}
                />
              </div>
              
              <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors duration-200 text-center">
                <div className="text-5xl mb-6">🎯</div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-center">
                  Track Progress
                  <FeatureTooltip 
                    title="Progress Tracking"
                    description="Monitor your gaming sessions, track completion status, and see your gaming statistics over time."
                    shortcuts={[
                      { action: "Mark playing", keys: "P" },
                      { action: "Mark completed", keys: "C" }
                    ]}
                  />
                </h3>
                <p className="text-slate-400 mb-4">Monitor your gaming sessions</p>
                
                <FeatureExpansion
                  features={[
                    "✓ Playing, completed, and dropped status",
                    "✓ Session time tracking",
                    "✓ Achievement and trophy integration",
                    "✓ Progress photos and notes",
                    "✓ Completion percentage tracking",
                    "✓ Gaming streaks and habits"
                  ]}
                  maxVisible={2}
                />
              </div>
              
              <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors duration-200 text-center">
                <div className="text-5xl mb-6">✅</div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-center">
                  Rate & Review
                  <FeatureTooltip 
                    title="Rating System"
                    description="Rate your games and write reviews to remember your experiences. Build your personal gaming journal."
                    shortcuts={[
                      { action: "Quick rate", keys: "R" },
                      { action: "Add review", keys: "Ctrl+R" }
                    ]}
                  />
                </h3>
                <p className="text-slate-400 mb-4">Remember your gaming experiences</p>
                
                <FeatureExpansion
                  features={[
                    "✓ 5-star rating system",
                    "✓ Written reviews and notes",
                    "✓ Screenshot gallery",
                    "✓ Share reviews with friends",
                    "✓ Export your gaming history",
                    "✓ Compare ratings with community"
                  ]}
                  maxVisible={2}
                />
              </div>
            </div>

            {/* Advanced Features - Progressive Disclosure */}
            <div className="max-w-4xl mx-auto">
              <ExpandableSection
                title="Advanced Features & Integrations"
                className="bg-slate-800 rounded-xl border border-slate-700"
                titleClassName="text-lg font-semibold text-white hover:bg-slate-700 rounded-t-xl"
                contentClassName="bg-slate-900 rounded-b-xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white flex items-center">
                      🔗 Platform Integrations
                      <HelpTooltip content="Connect your gaming platforms to automatically sync your library and achievements." />
                    </h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Steam, Epic Games, and GOG sync</li>
                      <li>• PlayStation Network integration</li>
                      <li>• Xbox Live achievements</li>
                      <li>• Nintendo Switch profile</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white flex items-center">
                      📊 Analytics & Insights
                      <HelpTooltip content="Detailed statistics about your gaming habits and preferences." />
                    </h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Monthly gaming reports</li>
                      <li>• Genre preference analysis</li>
                      <li>• Time spent analytics</li>
                      <li>• Completion rate trends</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white flex items-center">
                      🤝 Social Features
                      <HelpTooltip content="Connect with friends and discover new games through community features." />
                    </h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Friend activity feeds</li>
                      <li>• Game recommendations</li>
                      <li>• Community reviews</li>
                      <li>• Gaming challenges</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white flex items-center">
                      ⚡ Power User Tools
                      <HelpTooltip content="Advanced features for power users who want maximum control over their gaming data." />
                    </h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Custom tags and filters</li>
                      <li>• API access for developers</li>
                      <li>• Bulk import/export tools</li>
                      <li>• Advanced search queries</li>
                    </ul>
                  </div>
                </div>
              </ExpandableSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
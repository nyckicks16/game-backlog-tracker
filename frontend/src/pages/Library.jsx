/**
 * Library Page Component
 * User Story #14: Game Database Integration
 * 
 * Game library page with search functionality and library management
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import GameSearch from '../components/games/GameSearch';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const Library = () => {
  const { user, accessToken, loading: authLoading } = useAuth();
  
  // Debug logging
  console.log('Library - user:', user ? 'present' : 'missing');
  console.log('Library - accessToken:', accessToken ? 'present' : 'missing');
  console.log('Library - authLoading:', authLoading);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  // Load user's library
  const loadLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading library...');
      console.log('- User:', user ? user.email : 'not logged in');
      console.log('- AccessToken:', accessToken ? 'present' : 'missing');
      console.log('- AuthLoading:', authLoading);
      
      if (!accessToken) {
        console.log('❌ No access token available');
        setError('Authentication required. Please log in.');
        return;
      }
      
      console.log('📡 Making API calls...');
      const [libraryResponse, statsResponse] = await Promise.all([
        api.games.getLibrary({}, accessToken),
        api.games.getStats(accessToken)
      ]);
      
      console.log('✅ Library response:', libraryResponse);
      console.log('✅ Stats response:', statsResponse);
      
      setGames(libraryResponse.games || []);
      setStats(statsResponse);
    } catch (err) {
      console.error('❌ Failed to load library:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError(err.message || 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only try to load library if auth is not loading and we have a token
    if (!authLoading && accessToken) {
      loadLibrary();
    } else if (!authLoading && !accessToken) {
      // Not authenticated and auth loading is complete, stop loading
      setLoading(false);
    }
  }, [accessToken, authLoading]);

  const handleGameSelect = (game) => {
    console.log('Game selected:', game);
    // Close search dropdown after selection
    setShowSearch(false);
    
    // Reload library to show newly added game
    if (game.inLibrary) {
      loadLibrary();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-4xl font-bold text-white mb-2">
                🎮 Game Library
              </h1>
              <p className="text-xl text-slate-400">
                Your complete gaming collection
              </p>
            </div>
            
            {/* Add Game Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="
                px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 
                hover:from-sky-700 hover:to-blue-700 text-white font-semibold 
                rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg
                flex items-center space-x-2
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Games</span>
            </button>
          </div>

          {/* Game Search */}
          {showSearch && (
            <div className="mt-6">
              <GameSearch 
                onGameSelect={handleGameSelect}
                className="max-w-2xl"
                accessToken={accessToken}
              />
            </div>
          )}
        </div>

        {/* Library Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-slate-400">Total Games</div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="text-2xl font-bold text-sky-400">{stats.by_status?.want_to_play || 0}</div>
              <div className="text-sm text-slate-400">Wishlist</div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="text-2xl font-bold text-emerald-400">{stats.by_status?.playing || 0}</div>
              <div className="text-sm text-slate-400">Playing</div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.by_status?.completed || 0}</div>
              <div className="text-sm text-slate-400">Completed</div>
            </div>
          </div>
        )}

        {/* Authentication Required */}
        {!authLoading && !user && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <p className="text-slate-400 mb-6">
              Please log in to view and manage your game library
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Loading State */}
        {(authLoading || loading) && user && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
            <span className="ml-3 text-slate-400">Loading your library...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && user && (
          <div className="text-center py-16">
            <div className="text-red-400 text-lg mb-4">Failed to load library</div>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={loadLibrary}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && games.length === 0 && user && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-white mb-2">Your library is empty</h2>
            <p className="text-slate-400 mb-6">
              Start building your game collection by searching for games above
            </p>
            <button
              onClick={() => setShowSearch(true)}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              Search for Games
            </button>
          </div>
        )}

        {/* Games Grid */}
        {!loading && !error && games.length > 0 && user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {games.map((game) => (
              <GameLibraryCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple game card component for library display
const GameLibraryCard = ({ game }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'wishlist': return 'text-sky-400 bg-sky-400/10 border-sky-400/30';
      case 'playing': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'completed': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'on_hold': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'wishlist': return 'Wishlist';
      case 'playing': return 'Playing';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      default: return status;
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors duration-200">
      {/* Game Cover */}
      <div className="aspect-[3/4] bg-slate-700">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={`${game.name} cover`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            No Image
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate mb-2" title={game.name}>
          {game.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(game.status)}`}>
            {formatStatus(game.status)}
          </span>
          
          {game.userRating && (
            <div className="text-amber-400 text-sm">
              {'★'.repeat(Math.floor(game.userRating))}
            </div>
          )}
        </div>

        {game.addedAt && (
          <div className="text-xs text-slate-500 mt-2">
            Added {new Date(game.addedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
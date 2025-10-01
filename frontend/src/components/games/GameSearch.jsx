/**
 * Game Search Component
 * User Story #14: Game Database Integration
 * 
 * Provides search interface for finding games in IGDB database
 * Features: debounced search, loading states, error handling
 */
import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../../utils/api';
import GameSearchResults from './GameSearchResults';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useDebounce } from '../../hooks/useDebounce';

const GameSearch = ({ onGameSelect, className = '', accessToken }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Debounce search query to avoid too many API calls
  const debouncedQuery = useDebounce(query, 300);

  // Search function
  const searchGames = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // Debug logging
    console.log('GameSearch - accessToken:', accessToken ? 'present' : 'missing');
    
    // Don't search if no access token available
    if (!accessToken) {
      // In development, show a more helpful message
      if (import.meta.env.DEV) {
        setError('Authentication not ready. Please try logging in or check browser console for auth status.');
      } else {
        setError('Please log in to search for games');
      }
      setResults([]);
      setHasSearched(true);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await api.games.search(searchQuery.trim(), 20, 0, accessToken);
      setResults(response.games || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search games');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    searchGames(debouncedQuery);
  }, [debouncedQuery, searchGames]);

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
  };

  // Handle game selection
  const handleGameSelect = (game) => {
    if (onGameSelect) {
      onGameSelect(game);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for games..."
          className="
            block w-full pl-10 pr-10 py-3 text-sm
            bg-slate-800 border border-slate-600 rounded-xl
            text-white placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400
            hover:border-slate-500
            transition-colors duration-200
          "
          aria-label="Search for games"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="
              absolute inset-y-0 right-0 pr-3 flex items-center
              text-slate-400 hover:text-white
              transition-colors duration-200
            "
            aria-label="Clear search"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-slate-300">Searching games...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-slate-800 border border-red-500/50 rounded-xl shadow-2xl z-50">
          <div className="flex items-center space-x-2 text-red-400">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
          <button
            onClick={() => searchGames(query)}
            className="
              mt-2 px-3 py-1 text-xs font-medium
              bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg
              hover:bg-red-600/30 hover:border-red-500/50
              transition-colors duration-200
            "
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search Results */}
      {!loading && !error && hasSearched && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <GameSearchResults
            games={results}
            onGameSelect={handleGameSelect}
            query={query}
            accessToken={accessToken}
          />
        </div>
      )}
    </div>
  );
};

export default GameSearch;
/**
 * Game Search Results Component
 * User Story #14: Game Database Integration
 * 
 * Displays search results from IGDB with game cards
 * Features: game covers, metadata, add to library actions
 */
import React, { useState } from 'react';
import { PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const GameSearchResults = ({ games, onGameSelect, query, accessToken }) => {
  const [addingGames, setAddingGames] = useState(new Set());

  // Add game to library
  const addToLibrary = async (game, event) => {
    event.stopPropagation();
    
    const gameId = game.id;
    setAddingGames(prev => new Set([...prev, gameId]));

    try {
      const gameData = {
        igdbId: game.id,
        name: game.name,
        summary: game.summary,
        coverUrl: game.coverUrl,
        releaseDate: game.releaseDate,
        platforms: game.platforms,
        genres: game.genres,
        developer: game.developer,
        publisher: game.publisher,
        rating: game.rating,
        status: 'wishlist'
      };

      await api.games.addToLibrary(gameData, accessToken);
      
      toast.success(`${game.name} added to your library!`, {
        duration: 3000,
        position: 'bottom-right',
      });

      // Mark game as added (you might want to update parent state here)
      if (onGameSelect) {
        onGameSelect({ ...game, inLibrary: true });
      }
    } catch (error) {
      console.error('Failed to add game:', error);
      
      if (error.message.includes('already in library')) {
        toast.error('Game is already in your library', {
          duration: 3000,
          position: 'bottom-right',
        });
      } else {
        toast.error(`Failed to add ${game.name}: ${error.message}`, {
          duration: 4000,
          position: 'bottom-right',
        });
      }
    } finally {
      setAddingGames(prev => {
        const newSet = new Set(prev);
        newSet.delete(gameId);
        return newSet;
      });
    }
  };

  if (!games || games.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-6">
        <div className="text-center">
          <div className="text-slate-400 text-sm">
            {query ? `No games found for "${query}"` : 'Start typing to search for games'}
          </div>
          {query && (
            <div className="text-slate-500 text-xs mt-1">
              Try different keywords or check your spelling
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
      <div className="p-2">
        <div className="text-xs text-slate-400 px-3 py-2 border-b border-slate-600">
          Found {games.length} games for "{query}"
        </div>
        
        <div className="space-y-1 mt-2">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onAddToLibrary={(e) => addToLibrary(game, e)}
              isAdding={addingGames.has(game.id)}
              onSelect={() => onGameSelect && onGameSelect(game)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const GameCard = ({ game, onAddToLibrary, isAdding, onSelect }) => {
  const formatDate = (date) => {
    if (!date) return 'TBA';
    return new Date(date).getFullYear();
  };

  const formatPlatforms = (platforms) => {
    if (!platforms || platforms.length === 0) return '';
    return platforms.slice(0, 3).join(', ') + (platforms.length > 3 ? '...' : '');
  };

  return (
    <div
      className="
        flex items-start space-x-3 p-3 rounded-lg
        hover:bg-slate-700/50 cursor-pointer
        transition-colors duration-200
        group
      "
      onClick={onSelect}
    >
      {/* Game Cover */}
      <div className="flex-shrink-0">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={`${game.name} cover`}
            className="w-12 h-16 object-cover rounded-md bg-slate-700"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-16 bg-slate-700 rounded-md flex items-center justify-center">
            <div className="text-slate-500 text-xs text-center">No Image</div>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate group-hover:text-sky-400 transition-colors">
              {game.name}
            </h3>
            
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-slate-400">
                {formatDate(game.releaseDate)}
              </span>
              
              {game.rating && (
                <span className="text-xs text-emerald-400 font-medium">
                  {Math.round(game.rating)}%
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 truncate mt-1">
              {formatPlatforms(game.platforms)}
            </div>

            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {game.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="inline-block px-2 py-0.5 text-xs bg-slate-600/50 text-slate-300 rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Add to Library Button */}
          <button
            onClick={onAddToLibrary}
            disabled={isAdding}
            className="
              ml-3 p-2 rounded-lg border border-transparent
              text-slate-400 hover:text-white
              hover:bg-sky-600/20 hover:border-sky-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex-shrink-0
            "
            title="Add to Library"
            aria-label={`Add ${game.name} to library`}
          >
            {isAdding ? (
              <div className="animate-spin h-5 w-5 border-2 border-sky-400 border-t-transparent rounded-full" />
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSearchResults;
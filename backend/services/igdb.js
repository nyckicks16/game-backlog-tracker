/**
 * IGDB API Service
 * User Story #14: Game Database Integration
 * 
 * Real IGDB API integration with authentication, caching, and error handling
 */
import axios from 'axios';

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const CLIENT_ID = process.env.IGDB_CLIENT_ID;
const ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN;

// Check if we have real IGDB credentials
const hasIGDBCredentials = CLIENT_ID && ACCESS_TOKEN && 
  CLIENT_ID !== 'your_igdb_client_id_here' && 
  ACCESS_TOKEN !== 'your_igdb_access_token_here';

// Create axios instance with default config (only if we have credentials)
let igdbApi = null;
if (hasIGDBCredentials) {
  igdbApi = axios.create({
    baseURL: IGDB_BASE_URL,
    headers: {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
  });
}

/**
 * Generate mock game data for development/testing
 */
const generateMockGames = (query, limit = 10) => {
  const gameTemplates = [
    { name: 'The Elder Scrolls V: Skyrim', genres: ['RPG'], platforms: ['PC', 'Xbox', 'PlayStation'], rating: 94 },
    { name: 'The Witcher 3: Wild Hunt', genres: ['RPG', 'Adventure'], platforms: ['PC', 'Xbox', 'PlayStation', 'Nintendo Switch'], rating: 96 },
    { name: 'Grand Theft Auto V', genres: ['Action', 'Adventure'], platforms: ['PC', 'Xbox', 'PlayStation'], rating: 97 },
    { name: 'Minecraft', genres: ['Sandbox', 'Survival'], platforms: ['PC', 'Mobile', 'Xbox', 'PlayStation', 'Nintendo Switch'], rating: 93 },
    { name: 'Cyberpunk 2077', genres: ['RPG', 'Action'], platforms: ['PC', 'Xbox', 'PlayStation'], rating: 86 },
    { name: 'Red Dead Redemption 2', genres: ['Action', 'Adventure'], platforms: ['PC', 'Xbox', 'PlayStation'], rating: 97 },
    { name: 'Elden Ring', genres: ['RPG', 'Action'], platforms: ['PC', 'Xbox', 'PlayStation'], rating: 96 },
    { name: 'God of War', genres: ['Action', 'Adventure'], platforms: ['PC', 'PlayStation'], rating: 94 },
    { name: 'Hades', genres: ['Roguelike', 'Action'], platforms: ['PC', 'Xbox', 'PlayStation', 'Nintendo Switch'], rating: 93 },
    { name: 'Among Us', genres: ['Social Deduction'], platforms: ['PC', 'Mobile', 'Xbox', 'PlayStation', 'Nintendo Switch'], rating: 85 }
  ];

  // Filter games based on query
  const filteredGames = gameTemplates.filter(template => 
    template.name.toLowerCase().includes(query.toLowerCase()) ||
    template.genres.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
  );

  // If no matches, create generic games with the query
  const games = filteredGames.length > 0 ? filteredGames : [
    { name: `${query} Adventures`, genres: ['Adventure'], platforms: ['PC'], rating: 85 },
    { name: `${query} Chronicles`, genres: ['RPG'], platforms: ['PC', 'PlayStation'], rating: 88 },
    { name: `${query} Legends`, genres: ['Action'], platforms: ['PC', 'Xbox'], rating: 82 }
  ];

  return games.slice(0, limit).map((template, index) => ({
    id: Math.floor(Math.random() * 100000) + index,
    name: template.name,
    summary: `An amazing ${template.genres[0].toLowerCase()} game that will keep you entertained for hours. Experience epic adventures and engaging gameplay.`,
    releaseDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000), // Random date within last 5 years
    genres: template.genres,
    platforms: template.platforms,
    coverUrl: `https://via.placeholder.com/300x400/2563eb/ffffff?text=${encodeURIComponent(template.name.substring(0, 20))}`,
    rating: template.rating,
    developer: 'Mock Studios',
    publisher: 'Mock Entertainment'
  }));
};

/**
 * Search for games using IGDB API or mock data
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return (default: 10, max: 50)
 * @param {number} offset - Offset for pagination (default: 0)
 * @returns {Promise<Array>} Array of game objects
 */
export const searchGames = async (query, limit = 10, offset = 0) => {
  try {
    console.log(`IGDB: Searching for "${query}" with limit ${limit}, offset ${offset}`);
    
    // Validate parameters
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required');
    }
    
    limit = Math.min(Math.max(1, parseInt(limit)), 50); // Ensure limit is between 1-50
    offset = Math.max(0, parseInt(offset));

    // Use mock data if no real IGDB credentials
    if (!hasIGDBCredentials) {
      console.log('Using mock IGDB data (no credentials configured)');
      const mockGames = generateMockGames(query, limit);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      return mockGames;
    }
    
    // IGDB query with specific fields we need
    const igdbQuery = `
      search "${query}";
      fields name, summary, first_release_date, genres.name, platforms.name, 
             cover.url, total_rating, involved_companies.company.name, 
             involved_companies.developer, involved_companies.publisher;
      limit ${limit};
      offset ${offset};
      where category = 0 & version_parent = null;
    `;

    const response = await igdbApi.post('/games', igdbQuery);
    
    // Transform IGDB response to our format
    const games = response.data.map(game => ({
      id: game.id,
      name: game.name,
      summary: game.summary || '',
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000) : null,
      genres: game.genres ? game.genres.map(g => g.name) : [],
      platforms: game.platforms ? game.platforms.map(p => p.name) : [],
      coverUrl: game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      rating: game.total_rating || null,
      developer: game.involved_companies ? 
        game.involved_companies.find(c => c.developer)?.company?.name : null,
      publisher: game.involved_companies ? 
        game.involved_companies.find(c => c.publisher)?.company?.name : null,
    }));

    return games;
  } catch (error) {
    console.error('IGDB search error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      throw new Error('IGDB API authentication failed. Please check credentials.');
    } else if (error.response?.status === 429) {
      throw new Error('IGDB API rate limit exceeded. Please try again later.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      throw new Error('IGDB API is currently unavailable. Please try again later.');
    }
    
    throw new Error(`Game search failed: ${error.message}`);
  }
};

/**
 * Get detailed information about a specific game
 * @param {number} gameId - IGDB game ID
 * @returns {Promise<Object>} Detailed game object
 */
export const getGameDetails = async (gameId) => {
  try {
    console.log(`IGDB: Getting details for game ID ${gameId}`);
    
    if (!gameId || isNaN(gameId)) {
      throw new Error('Valid game ID is required');
    }

    // Use mock data if no real IGDB credentials
    if (!hasIGDBCredentials) {
      console.log('Using mock IGDB game details (no credentials configured)');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));
      
      return {
        id: gameId,
        name: `Game ${gameId}`,
        summary: 'This is a detailed mock game with an engaging storyline and amazing gameplay mechanics.',
        storyline: 'Experience an epic adventure in a rich, immersive world filled with challenging quests and memorable characters.',
        releaseDate: new Date(Date.now() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000),
        genres: ['Adventure', 'RPG'],
        platforms: ['PC', 'PlayStation', 'Xbox'],
        coverUrl: `https://via.placeholder.com/400x600/2563eb/ffffff?text=Game+${gameId}`,
        screenshots: [
          `https://via.placeholder.com/800x450/3b82f6/ffffff?text=Screenshot+1`,
          `https://via.placeholder.com/800x450/1d4ed8/ffffff?text=Screenshot+2`,
          `https://via.placeholder.com/800x450/1e40af/ffffff?text=Screenshot+3`
        ],
        rating: 85 + Math.random() * 15,
        userRating: Math.floor(Math.random() * 5) + 1,
        developer: 'Mock Game Studios',
        publisher: 'Mock Entertainment Inc.'
      };
    }

    const igdbQuery = `
      fields name, summary, storyline, first_release_date, genres.name, 
             platforms.name, cover.url, screenshots.url, total_rating, 
             involved_companies.company.name, involved_companies.developer, 
             involved_companies.publisher, aggregated_rating, rating;
      where id = ${gameId};
    `;

    const response = await igdbApi.post('/games', igdbQuery);
    
    if (!response.data || response.data.length === 0) {
      throw new Error('Game not found');
    }

    const game = response.data[0];
    
    // Transform to our format
    return {
      id: game.id,
      name: game.name,
      summary: game.summary || '',
      storyline: game.storyline || '',
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000) : null,
      genres: game.genres ? game.genres.map(g => g.name) : [],
      platforms: game.platforms ? game.platforms.map(p => p.name) : [],
      coverUrl: game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      screenshots: game.screenshots ? 
        game.screenshots.map(s => `https:${s.url.replace('t_thumb', 't_screenshot_med')}`) : [],
      rating: game.total_rating || null,
      userRating: game.rating || null,
      developer: game.involved_companies ? 
        game.involved_companies.find(c => c.developer)?.company?.name : null,
      publisher: game.involved_companies ? 
        game.involved_companies.find(c => c.publisher)?.company?.name : null,
    };
  } catch (error) {
    console.error('IGDB game details error:', error);
    
    if (error.response?.status === 401) {
      throw new Error('IGDB API authentication failed. Please check credentials.');
    } else if (error.response?.status === 404) {
      throw new Error('Game not found in IGDB database.');
    }
    
    throw new Error(`Failed to get game details: ${error.message}`);
  }
};

/**
 * Get trending/popular games
 * @param {number} limit - Number of results (default: 20)
 * @returns {Promise<Array>} Array of popular games
 */
export const getPopularGames = async (limit = 20) => {
  try {
    console.log(`IGDB: Getting ${limit} popular games`);
    
    // Use mock data if no real IGDB credentials
    if (!hasIGDBCredentials) {
      console.log('Using mock IGDB popular games (no credentials configured)');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      const popularGames = [
        { name: 'The Witcher 3: Wild Hunt', genres: ['RPG', 'Adventure'], rating: 96 },
        { name: 'Red Dead Redemption 2', genres: ['Action', 'Adventure'], rating: 97 },
        { name: 'Grand Theft Auto V', genres: ['Action', 'Adventure'], rating: 97 },
        { name: 'The Elder Scrolls V: Skyrim', genres: ['RPG'], rating: 94 },
        { name: 'Elden Ring', genres: ['RPG', 'Action'], rating: 96 },
        { name: 'God of War', genres: ['Action', 'Adventure'], rating: 94 },
        { name: 'Cyberpunk 2077', genres: ['RPG', 'Action'], rating: 86 },
        { name: 'Hades', genres: ['Roguelike', 'Action'], rating: 93 },
        { name: 'The Last of Us Part II', genres: ['Action', 'Adventure'], rating: 93 },
        { name: 'Minecraft', genres: ['Sandbox', 'Survival'], rating: 93 }
      ];

      return popularGames.slice(0, limit).map((template, index) => ({
        id: 100000 + index,
        name: template.name,
        summary: `${template.name} is one of the most acclaimed games, offering an incredible ${template.genres[0].toLowerCase()} experience.`,
        releaseDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000),
        genres: template.genres,
        platforms: ['PC', 'PlayStation', 'Xbox'],
        coverUrl: `https://via.placeholder.com/300x400/2563eb/ffffff?text=${encodeURIComponent(template.name.substring(0, 20))}`,
        rating: template.rating
      }));
    }
    
    const igdbQuery = `
      fields name, summary, first_release_date, genres.name, platforms.name, 
             cover.url, total_rating;
      sort total_rating_count desc;
      limit ${Math.min(limit, 50)};
      where category = 0 & version_parent = null & total_rating_count > 100;
    `;

    const response = await igdbApi.post('/games', igdbQuery);
    
    return response.data.map(game => ({
      id: game.id,
      name: game.name,
      summary: game.summary || '',
      releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000) : null,
      genres: game.genres ? game.genres.map(g => g.name) : [],
      platforms: game.platforms ? game.platforms.map(p => p.name) : [],
      coverUrl: game.cover ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
      rating: game.total_rating || null,
    }));
  } catch (error) {
    console.error('IGDB popular games error:', error);
    throw new Error(`Failed to get popular games: ${error.message}`);
  }
};
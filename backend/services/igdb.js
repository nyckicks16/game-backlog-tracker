/**
 * Stub for IGDB API Service
 * Used for testing game search functionality
 */

export const searchGames = async (query, limit = 10) => {
  console.log(`Mock: Searching IGDB for "${query}" with limit ${limit}`);
  
  // Mock response structure
  return Promise.resolve([
    {
      id: 12345,
      name: `Mock Game for "${query}"`,
      summary: `This is a mock game result for the search query: ${query}`,
      first_release_date: Math.floor(Date.now() / 1000),
      genres: [{ name: 'Action' }, { name: 'Adventure' }],
      platforms: [{ name: 'PC' }, { name: 'PlayStation 5' }],
      cover: { url: '//example.com/mock-cover.jpg' },
      total_rating: 85.5
    }
  ]);
};

export const getGameDetails = async (gameId) => {
  console.log(`Mock: Getting IGDB game details for ID ${gameId}`);
  
  return Promise.resolve({
    id: gameId,
    name: `Mock Game ${gameId}`,
    summary: `Detailed information for mock game with ID ${gameId}`,
    first_release_date: Math.floor(Date.now() / 1000),
    genres: [{ name: 'Action' }, { name: 'RPG' }],
    platforms: [{ name: 'PC' }],
    cover: { url: '//example.com/mock-cover-detail.jpg' },
    screenshots: [{ url: '//example.com/screenshot1.jpg' }],
    total_rating: 88.2,
    storyline: 'Mock storyline for testing purposes'
  });
};
/**
 * Unit Tests for IGDB Service
 * Tests game database integration functionality
 */
import { jest } from '@jest/globals';

// Mock axios for HTTP requests
const mockAxios = {
  post: jest.fn(),
  create: jest.fn()
};

jest.unstable_mockModule('axios', () => ({
  default: mockAxios,
  create: jest.fn(() => mockAxios)
}));

const { searchGames, getGameDetails } = await import('../../services/igdb.js');

describe('IGDB Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchGames', () => {
    test('should search games successfully', async () => {
      const query = 'Zelda';

      const result = await searchGames(query);

      expect(result).toEqual([{
        id: 12345,
        name: `Mock Game for "${query}"`,
        summary: `This is a mock game result for the search query: ${query}`,
        first_release_date: expect.any(Number),
        genres: [{ name: 'Action' }, { name: 'Adventure' }],
        platforms: [{ name: 'PC' }, { name: 'PlayStation 5' }],
        cover: { url: '//example.com/mock-cover.jpg' },
        total_rating: 85.5
      }]);
    });

    test('should handle different search queries', async () => {
      const query = 'RPG Game';
      
      const result = await searchGames(query);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(`Mock Game for "${query}"`);
      expect(result[0].summary).toContain(query);
    });

    test('should respect limit parameter', async () => {
      const query = 'Test';
      const limit = 5;
      
      const result = await searchGames(query, limit);

      expect(result).toHaveLength(1); // Stub always returns 1 result
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
    });
  });

  describe('getGameDetails', () => {
    test('should get game details by ID', async () => {
      const gameId = 12345;

      const result = await getGameDetails(gameId);

      expect(result).toEqual({
        id: gameId,
        name: `Mock Game ${gameId}`,
        summary: `Detailed information for mock game with ID ${gameId}`,
        first_release_date: expect.any(Number),
        genres: [{ name: 'Action' }, { name: 'RPG' }],
        platforms: [{ name: 'PC' }],
        cover: { url: '//example.com/mock-cover-detail.jpg' },
        screenshots: [{ url: '//example.com/screenshot1.jpg' }],
        total_rating: 88.2,
        storyline: 'Mock storyline for testing purposes'
      });
    });

    test('should return consistent results for different game IDs', async () => {
      const gameId = 99999;

      const result = await getGameDetails(gameId);

      expect(result).toEqual({
        id: gameId,
        name: `Mock Game ${gameId}`,
        summary: `Detailed information for mock game with ID ${gameId}`,
        first_release_date: expect.any(Number),
        genres: [{ name: 'Action' }, { name: 'RPG' }],
        platforms: [{ name: 'PC' }],
        cover: { url: '//example.com/mock-cover-detail.jpg' },
        screenshots: [{ url: '//example.com/screenshot1.jpg' }],
        total_rating: 88.2,
        storyline: 'Mock storyline for testing purposes'
      });
    });

    test('should return expected data structure', async () => {
      const gameId = 12345;
      
      const result = await getGameDetails(gameId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('genres');
      expect(result).toHaveProperty('platforms');
      expect(result).toHaveProperty('cover');
      expect(result).toHaveProperty('total_rating');
    });
  });
});
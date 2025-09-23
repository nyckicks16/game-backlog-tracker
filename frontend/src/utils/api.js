// Simple API utility for making requests to the backend
const API_BASE_URL = 'http://localhost:3000';

export const api = {
  // Health check
  health: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Get API info
  getApiInfo: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api`);
      return await response.json();
    } catch (error) {
      console.error('API info request failed:', error);
      throw error;
    }
  }
};

export default api;
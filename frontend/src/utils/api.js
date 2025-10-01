// API utility for making requests to the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to get auth token (fallback to localStorage for backward compatibility)
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  // Try to get token from options first, then fallback to localStorage
  const token = options.token || getAuthToken();
  
  console.log('🌐 fetchWithAuth:', {
    url,
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
  });
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Remove token from options to avoid passing it to fetch
  const { token: _, ...fetchOptions } = options;

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...fetchOptions,
      headers,
    });

    console.log('📡 Response status:', response.status, 'for', url);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error('❌ API Error:', {
        url,
        status: response.status,
        error
      });
      throw new Error(error.message || error.error || `HTTP ${response.status}: Request failed`);
    }

    const data = await response.json();
    console.log('✅ API Success:', { url, dataKeys: Object.keys(data) });
    return data;
  } catch (fetchError) {
    console.error('🔥 Fetch Error:', {
      url,
      error: fetchError.message,
      type: fetchError.name
    });
    throw fetchError;
  }
};

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
  },

  // Game search API
  games: {
    // Search for games
    search: async (query, limit = 10, offset = 0, token = null) => {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      return fetchWithAuth(`/api/games/search?${params}`, { token });
    },

    // Get game details
    getDetails: async (gameId, token = null) => {
      return fetchWithAuth(`/api/games/${gameId}/details`, { token });
    },

    // Get popular games
    getPopular: async (limit = 20, token = null) => {
      const params = new URLSearchParams({ limit: limit.toString() });
      return fetchWithAuth(`/api/games/popular?${params}`, { token });
    },

    // Add game to library
    addToLibrary: async (gameData, token = null) => {
      return fetchWithAuth('/api/games', {
        method: 'POST',
        body: JSON.stringify(gameData),
        token
      });
    },

    // Get user's library
    getLibrary: async (filters = {}, token = null) => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const queryString = params.toString();
      const url = queryString ? `/api/games?${queryString}` : '/api/games';
      
      return fetchWithAuth(url, { token });
    },

    // Get library statistics
    getStats: async (token = null) => {
      return fetchWithAuth('/api/games/stats', { token });
    },
  },
};

export default api;
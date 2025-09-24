/**
 * Authentication Context Provider
 * User Story #7: Frontend Authentication UI Components
 * 
 * Manages authentication state and provides a  /**
   * Initiate Google OAuth login
   */
  const login = (returnTo = null) => {
    // Re-enable auth for login attempts
    setAuthDisabled(false);
    setIsInitialized(false);
    
    // Store the current URL or provided returnTo URL for redirect after login
    const returnUrl = returnTo || window.location.pathname + window.location.search;
    sessionStorage.setItem('auth_return_url', returnUrl);
    
    console.log('🔓 Re-enabling auth for login attempt...');
    
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

/**
 * Authentication Provider - Provides authentication state and methods
 * to the entire application via React Context.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Create authentication context
const AuthContext = createContext({});

// API base URL - matches backend configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true; // Important: Include cookies for refresh tokens

/**
 * Authentication Provider Component
 * Wraps the app and provides authentication state and methods
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authDisabled, setAuthDisabled] = useState(false);

  /**
   * Set up axios interceptors for token management
   */
  useEffect(() => {
    // Request interceptor - Add access token to all requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If access token expired, try to refresh (but not for auth endpoints that shouldn't be refreshed)
        const skipRefreshUrls = ['/auth/logout', '/auth/refresh', '/auth/login', '/auth/google'];
        const shouldSkipRefresh = skipRefreshUrls.some(url => originalRequest.url?.includes(url));
        
        if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
          console.log('🔄 Token expired, attempting refresh for:', originalRequest.url);
          originalRequest._retry = true;

          try {
            const response = await axios.post('/auth/refresh');
            const newAccessToken = response.data.accessToken;
            
            console.log('✅ Token refresh successful');
            setAccessToken(newAccessToken);
            setUser(response.data.user);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, user needs to log in again
            console.error('❌ Token refresh failed:', refreshError.response?.status, refreshError.response?.data);
            
            // Clear tokens immediately to prevent further refresh attempts
            setAccessToken(null);
            setUser(null);
            setAuthDisabled(true); // Disable further auth attempts
            
            // Prevent infinite loops by checking if we're already logged out or logging out
            if (user !== null && !isLoggingOut) {
              console.log('🚪 Token refresh failed, logging out...');
              logout();
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);

  /**
   * Initialize authentication state on app load
   */
  useEffect(() => {
    if (!isInitialized && !isLoggingOut) {
      console.log('🚀 AuthProvider useEffect triggered - initializing auth');
      setIsInitialized(true);
      initializeAuth();
    } else if (isLoggingOut) {
      console.log('🚪 Logout in progress, skipping auth initialization...');
    } else {
      console.log('⏭️ AuthProvider already initialized, skipping...');
    }
  }, [isInitialized, isLoggingOut]);

  /**
   * Initialize authentication by checking for existing session
   */
  const initializeAuth = async () => {
    // Don't initialize if we're in the middle of logging out or auth is disabled
    if (isLoggingOut || authDisabled) {
      console.log('🚪 Auth disabled or logout in progress, skipping initialization');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 Initializing authentication...');
      
      // Try to get current user (will use refresh token if available)
      const response = await axios.get('/auth/me');
      
      if (response.data.success) {
        console.log('✅ Found existing authentication session:', response.data.user.email);
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
      }
    } catch (error) {
      // No existing session or refresh token expired
      console.log('❌ No existing authentication session:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiate Google OAuth login
   */
  const login = (returnTo = null) => {
    // Store the current URL or provided returnTo URL for redirect after login
    const returnUrl = returnTo || window.location.pathname + window.location.search;
    sessionStorage.setItem('auth_return_url', returnUrl);
    
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  /**
   * Handle OAuth callback (called from OAuth callback page)
   */
  const handleOAuthCallback = async (accessToken) => {
    try {
      setLoading(true);
      
      // Set the access token
      setAccessToken(accessToken);
      
      // Get user profile
      const response = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        
        // Show success toast
        toast.success(`Welcome back, ${response.data.user.firstName || response.data.user.username}!`);
        
        // Redirect to intended page or home
        const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
        sessionStorage.removeItem('auth_return_url');
        window.location.href = returnUrl;
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user and clear session
   */
  const logout = async () => {
    if (isLoggingOut) {
      console.log('🔄 Logout already in progress, skipping...');
      return;
    }

    try {
      console.log('🚪 Starting logout process...');
      setIsLoggingOut(true);
      setLoading(true);
      
      // Call backend logout endpoint first
      console.log('🔍 Current access token:', accessToken ? 'Present' : 'Missing');
      console.log('🔍 Current user:', user ? user.email : 'None');
      
      if (accessToken) {
        try {
          console.log('📡 Calling backend logout endpoint with token...');
          const response = await axios.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          console.log('✅ Backend logout successful:', response.data);
        } catch (error) {
          console.warn('❌ Backend logout failed:', error.response?.data || error.message);
          console.warn('❌ Error status:', error.response?.status);
        }
      } else {
        console.log('⚠️ No access token found, trying logout without token...');
        try {
          const response = await axios.post('/auth/logout');
          console.log('✅ Backend logout successful (no token):', response.data);
        } catch (error) {
          console.warn('❌ Backend logout failed (no token):', error.response?.data || error.message);
        }
      }
      
      // Clear local state
      console.log('🧹 Clearing local authentication state...');
      setUser(null);
      setAccessToken(null);
      setAuthDisabled(true); // Disable further auth attempts
      
      // Clear all possible cached authentication data
      sessionStorage.clear();
      localStorage.removeItem('auth_return_url');
      
      // Show logout toast
      toast.success('You have been logged out successfully');
      
      console.log('🔄 Redirecting to home page...');
      
      // Force a complete page reload to clear all state and redirect to home
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Clear state anyway
      setUser(null);
      setAccessToken(null);
      sessionStorage.clear();
      localStorage.removeItem('auth_return_url');
      toast.success('You have been logged out successfully');
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } finally {
      setLoading(false);
      setIsLoggingOut(false);
    }
  };

  /**
   * Get user initials for avatar
   */
  const getUserInitials = (user) => {
    if (!user) return '??';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return '??';
  };

  /**
   * Get user display name
   */
  const getUserDisplayName = (user) => {
    if (!user) return '';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.username) {
      return user.username;
    }
    
    return user.email;
  };

  // Context value
  const value = {
    // State
    user,
    loading,
    accessToken,
    isAuthenticated: !!user,
    
    // Methods
    login,
    logout,
    handleOAuthCallback,
    initializeAuth,
    getUserInitials,
    getUserDisplayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthProvider;
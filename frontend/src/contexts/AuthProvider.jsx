/**
 * Authentication Context Provider
 * User Story #7: Frontend Authentication UI Components
 * 
 * Manages authentication state and provides authentication methods
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

        // If access token expired, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const response = await axios.post('/auth/refresh');
            const newAccessToken = response.data.accessToken;
            
            setAccessToken(newAccessToken);
            setUser(response.data.user);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, user needs to log in again
            console.error('Token refresh failed:', refreshError);
            logout();
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
    initializeAuth();
  }, []);

  /**
   * Initialize authentication by checking for existing session
   */
  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Try to get current user (will use refresh token if available)
      const response = await axios.get('/auth/me');
      
      if (response.data.success) {
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
      }
    } catch (error) {
      // No existing session or refresh token expired
      console.log('No existing authentication session');
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
    try {
      setLoading(true);
      
      // Call backend logout endpoint
      if (accessToken) {
        await axios.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      
      // Clear local state
      setUser(null);
      setAccessToken(null);
      
      // Show logout toast
      toast.success('You have been logged out successfully');
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state anyway
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
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
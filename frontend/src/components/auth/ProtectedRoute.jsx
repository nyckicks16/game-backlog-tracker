/**
 * Protected Route Component
 * User Story #9: Implement Protected Routes and Authentication Guards
 * 
 * Wraps routes that require authentication and provides gate UI for unauthorized access
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthProvider';
import AuthenticationGate from './AuthenticationGate';
import LoadingState from '../ui/LoadingState';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingState message="Checking authentication..." />;
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return children;
  }

  // If user is not authenticated, show authentication gate
  if (!isAuthenticated || !user) {
    return (
      <AuthenticationGate 
        returnTo={location.pathname + location.search}
        message="Please sign in to access your game library"
      />
    );
  }

  // If user is authenticated, render the protected content
  return children;
};

export default ProtectedRoute;
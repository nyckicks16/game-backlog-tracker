import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import ProfilePage from './pages/ProfilePage';
import OAuthCallback from './components/auth/OAuthCallback';
import { AnnouncerProvider, SkipLink } from './components/ui/Accessibility';
import './App.css'

function App() {
  return (
    <AuthProvider>
      <AnnouncerProvider>
        <Router>
          <div className="min-h-screen bg-slate-900">
            {/* Skip Links for Accessibility */}
            <SkipLink href="#main-content">Skip to main content</SkipLink>
            <SkipLink href="#navigation">Skip to navigation</SkipLink>
            
            <Navigation />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/library" 
              element={
                <ProtectedRoute>
                  <Library />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-white mb-4">Settings Page</h1>
                      <p className="text-slate-400">Coming soon...</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } 
            />

            {/* 404 Route */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-slate-400 mb-8">Page not found</p>
                    <a 
                      href="/" 
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-50 bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
                    >
                      ← Go home
                    </a>
                  </div>
                </div>
              } 
            />
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: '',
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                style: {
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #22c55e',
                },
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#1e293b',
                },
              },
              error: {
                style: {
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #ef4444',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#1e293b',
                },
              },
              loading: {
                style: {
                  background: '#1e293b',
                  color: '#f1f5f9',
                  border: '1px solid #0ea5e9',
                },
                iconTheme: {
                  primary: '#0ea5e9',
                  secondary: '#1e293b',
                },
              },
            }}
          />
        </div>
      </Router>
      </AnnouncerProvider>
    </AuthProvider>
  );
}

export default App;
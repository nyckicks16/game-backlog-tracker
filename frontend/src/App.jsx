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
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-900">
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
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
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
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
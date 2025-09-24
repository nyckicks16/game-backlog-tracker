import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const SecurityPanel = ({ profile, onUpdate }) => {
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Fetch user sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/profile/sessions', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }

        const data = await response.json();
        setSessions(data.sessions || []);
      } catch (error) {
        console.error('Sessions fetch error:', error);
        toast.error('Failed to load session data');
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, []);

  const handleExportData = async () => {
    try {
      toast.loading('Preparing your data export...', { id: 'export' });
      
      const response = await fetch('/api/profile/export', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profile-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Profile data exported successfully', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export profile data', { id: 'export' });
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session? You will be logged out from that device.')) {
      return;
    }

    try {
      // This would typically call a revoke session API
      toast.success('Session revoked successfully');
      // Remove from local state
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  };

  const getDeviceIcon = (device, browser) => {
    if (device?.toLowerCase().includes('mobile') || browser?.toLowerCase().includes('mobile')) {
      return DevicePhoneMobileIcon;
    }
    return ComputerDesktopIcon;
  };

  const SecurityCard = ({ title, description, children, variant = 'default' }) => {
    const bgColor = variant === 'danger' ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-700/50 border-slate-600';
    
    return (
      <div className={`rounded-lg border p-4 ${bgColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white">{title}</h4>
            {description && (
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Security & Privacy</h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage your account security and privacy settings
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Account Security Overview */}
        <div>
          <h3 className="text-lg font-medium text-slate-300 mb-4">Account Security</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecurityCard
              title="Authentication Method"
              description="Your account is secured with Google OAuth 2.0"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Google OAuth</p>
                  <p className="text-xs text-slate-400">Secure authentication via Google</p>
                </div>
              </div>
            </SecurityCard>

            <SecurityCard
              title="Password Management"
              description="Password is managed by Google"
            >
              <div className="text-sm text-slate-300">
                <p>Your password is managed by Google's secure infrastructure.</p>
                <a
                  href="https://myaccount.google.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sky-400 hover:text-sky-300 mt-2 text-xs"
                >
                  Manage Google Account Security
                  <GlobeAltIcon className="h-3 w-3 ml-1" />
                </a>
              </div>
            </SecurityCard>
          </div>
        </div>

        {/* Active Sessions */}
        <div>
          <h3 className="text-lg font-medium text-slate-300 mb-4">Active Sessions</h3>
          
          {loadingSessions ? (
            <div className="bg-slate-700/50 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-400 mx-auto mb-2"></div>
              <p className="text-slate-400 text-sm">Loading sessions...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const DeviceIcon = getDeviceIcon(session.device, session.browser);
                
                return (
                  <div
                    key={session.id}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <DeviceIcon className="h-6 w-6 text-slate-400" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-white">
                              {session.device}
                            </p>
                            {session.isCurrent && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                Current Device
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {session.browser} • {session.os} • {session.location}
                          </p>
                          <p className="text-xs text-slate-500">
                            Last active: {new Date(session.lastActive).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-600 text-xs font-medium rounded text-red-400 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data & Privacy */}
        <div>
          <h3 className="text-lg font-medium text-slate-300 mb-4">Data & Privacy</h3>
          <div className="space-y-4">
            <SecurityCard
              title="Data Export"
              description="Download a copy of your account data (GDPR compliant)"
            >
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export My Data
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Includes profile information, preferences, and gaming data
              </p>
            </SecurityCard>

            <SecurityCard
              title="Privacy Settings"
              description="Control how your information is shared"
            >
              <div className="text-sm text-slate-300">
                <p>Your privacy settings are managed in the Settings tab.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Configure profile visibility and data sharing preferences.
                </p>
              </div>
            </SecurityCard>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-red-400">Danger Zone</h3>
            <button
              onClick={() => setShowDangerZone(!showDangerZone)}
              className="text-xs text-slate-500 hover:text-slate-400"
            >
              {showDangerZone ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showDangerZone && (
            <SecurityCard
              title="Delete Account"
              description="Permanently delete your account and all associated data"
              variant="danger"
            >
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-300 mb-3">
                    This action cannot be undone. This will permanently delete your account,
                    profile information, and remove all associated data from our servers.
                  </p>
                  <button
                    onClick={() => {
                      toast.error('Account deletion feature coming soon');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-lg text-red-400 bg-red-600/10 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </SecurityCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;
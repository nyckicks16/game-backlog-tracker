import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfilePanel from '../components/profile/ProfilePanel';
import SettingsPanel from '../components/profile/SettingsPanel';
import SecurityPanel from '../components/profile/SecurityPanel';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState(null);

  // Fetch complete profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        setProfileData(data);
        setError(null);
      } catch (error) {
        console.error('Profile fetch error:', error);
        setError(error.message);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleProfileUpdate = async (updateData) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfileData(updatedProfile);
      
      // Update auth context if needed
      updateUser(updatedProfile);
      
      toast.success('Profile updated successfully');
      return updatedProfile;
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload avatar');
      }

      const result = await response.json();
      
      // Update profile data with new avatar
      const updatedProfile = { 
        ...profileData, 
        avatarUrl: result.avatarUrl,
        profileImage: result.profileImage 
      };
      setProfileData(updatedProfile);
      updateUser(updatedProfile);
      
      toast.success('Avatar updated successfully');
      return result;
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const handleAvatarRemove = async () => {
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove avatar');
      }

      const result = await response.json();
      
      // Update profile data
      const updatedProfile = { 
        ...profileData, 
        avatarUrl: null,
        profileImage: result.profileImage 
      };
      setProfileData(updatedProfile);
      updateUser(updatedProfile);
      
      toast.success('Avatar removed successfully');
      return result;
    } catch (error) {
      console.error('Avatar removal error:', error);
      toast.error(error.message);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Profile Load Error</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <ProfileHeader
          profile={profileData}
          onAvatarUpload={handleAvatarUpload}
          onAvatarRemove={handleAvatarRemove}
        />

        {/* Main Content */}
        <div className="mt-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Side Navigation (Desktop) / Tab Bar (Mobile) */}
            <div className="lg:col-span-3">
              <ProfileTabs 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
              />
            </div>

            {/* Main Content Area */}
            <div className="mt-6 lg:mt-0 lg:col-span-9">
              <div className="bg-slate-800 rounded-lg border border-slate-700">
                {activeTab === 'profile' && (
                  <ProfilePanel
                    profile={profileData}
                    onUpdate={handleProfileUpdate}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsPanel
                    profile={profileData}
                    onUpdate={handleProfileUpdate}
                  />
                )}

                {activeTab === 'security' && (
                  <SecurityPanel
                    profile={profileData}
                    onUpdate={handleProfileUpdate}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
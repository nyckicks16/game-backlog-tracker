import React, { useState, useRef } from 'react';
import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ProfileHeader = ({ profile, onAvatarUpload, onAvatarRemove }) => {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  const displayName = profile?.displayName || 
                     (profile?.firstName || profile?.lastName ? 
                      `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : 
                      profile?.username || 'User');

  const joinDate = profile?.createdAt ? 
    new Date(profile.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'Unknown';

  const lastLogin = profile?.lastLogin ? 
    new Date(profile.lastLogin).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Never';

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    try {
      setAvatarUploading(true);
      await onAvatarUpload(file);
    } catch (error) {
      // Error handled in parent component
    } finally {
      setAvatarUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile?.avatarUrl) return;

    if (!confirm('Are you sure you want to remove your avatar?')) {
      return;
    }

    try {
      await onAvatarRemove();
    } catch (error) {
      // Error handled in parent component
    }
  };

  const getAvatarSrc = () => {
    if (profile?.profileImage) {
      // Handle both local uploads and Google profile pictures
      if (profile.profileImage.startsWith('/uploads/')) {
        return `http://localhost:3000${profile.profileImage}`;
      }
      return profile.profileImage;
    }
    return null;
  };

  const getInitials = () => {
    const name = displayName || 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Avatar Section */}
        <div className="flex-shrink-0">
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-sky-600 flex items-center justify-center">
              {getAvatarSrc() ? (
                <img
                  src={getAvatarSrc()}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-xl sm:text-2xl font-bold">
                  {getInitials()}
                </span>
              )}
              
              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                   onClick={handleAvatarClick}>
                {avatarUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <CameraIcon className="h-6 w-6 text-white" />
                )}
              </div>
            </div>

            {/* Remove Avatar Button */}
            {profile?.avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-colors"
                title="Remove avatar"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                {displayName}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-1">
                {profile?.email}
              </p>
              {profile?.bio && (
                <p className="text-slate-300 mt-2 text-sm sm:text-base">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Stats Cards */}
            <div className="flex flex-row sm:flex-col gap-4 sm:gap-2 text-center sm:text-right">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Member Since</p>
                <p className="text-sm text-slate-300 font-medium">{joinDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Last Active</p>
                <p className="text-sm text-slate-300 font-medium">{lastLogin}</p>
              </div>
            </div>
          </div>

          {/* Gaming Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-sky-400">
                {profile?.stats?.totalGames || 0}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-400">
                {profile?.stats?.completedGames || 0}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-400">
                {profile?.stats?.hoursPlayed || 0}h
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Hours Played</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">
                {profile?.stats?.achievements || 0}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Achievements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
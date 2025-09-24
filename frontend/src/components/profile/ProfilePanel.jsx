import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ProfilePanel = ({ profile, onUpdate }) => {
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: {
      displayName: profile?.displayName || '',
      bio: profile?.bio || '',
    }
  });

  const watchedValues = watch();

  // Update hasChanges when form values change
  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);

  // Reset form when profile data changes
  useEffect(() => {
    if (profile) {
      setValue('displayName', profile.displayName || '');
      setValue('bio', profile.bio || '');
    }
  }, [profile, setValue]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      await onUpdate(data);
      setHasChanges(false);
    } catch (error) {
      // Error handled in parent component
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue('displayName', profile?.displayName || '');
    setValue('bio', profile?.bio || '');
    setHasChanges(false);
  };

  const getCharacterCount = (value, max) => {
    const current = value?.length || 0;
    const isOverLimit = current > max;
    return (
      <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-slate-500'}`}>
        {current}/{max}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Profile Information</h2>
          <p className="text-slate-400 text-sm mt-1">
            Update your personal information and bio
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 text-sm">Unsaved changes</span>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">
              Email is managed by your Google account
            </p>
          </div>

          {/* Username (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={profile?.username || ''}
              disabled
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">
              Username cannot be changed
            </p>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Display Name
            <span className="text-slate-500 font-normal ml-1">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              {...register('displayName', {
                maxLength: {
                  value: 50,
                  message: 'Display name must be 50 characters or less'
                },
                minLength: {
                  value: 2,
                  message: 'Display name must be at least 2 characters'
                }
              })}
              className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
                errors.displayName ? 'border-red-500' : 'border-slate-600'
              }`}
              placeholder="How should others see your name?"
            />
            <div className="absolute right-3 top-2">
              {getCharacterCount(watchedValues.displayName, 50)}
            </div>
          </div>
          {errors.displayName && (
            <p className="text-red-400 text-sm mt-1">{errors.displayName.message}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            This is how your name will appear to other users
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Bio
            <span className="text-slate-500 font-normal ml-1">(Optional)</span>
          </label>
          <div className="relative">
            <textarea
              {...register('bio', {
                maxLength: {
                  value: 500,
                  message: 'Bio must be 500 characters or less'
                }
              })}
              rows={4}
              className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors resize-none ${
                errors.bio ? 'border-red-500' : 'border-slate-600'
              }`}
              placeholder="Tell others about yourself, your favorite games, or your gaming goals..."
            />
            <div className="absolute right-3 bottom-2">
              {getCharacterCount(watchedValues.bio, 500)}
            </div>
          </div>
          {errors.bio && (
            <p className="text-red-400 text-sm mt-1">{errors.bio.message}</p>
          )}
        </div>

        {/* Account Information (Read-only) */}
        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-lg font-medium text-slate-300 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Member Since
              </label>
              <p className="text-white">
                {profile?.createdAt ? 
                  new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 
                  'Unknown'
                }
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Last Updated
              </label>
              <p className="text-white">
                {profile?.updatedAt ? 
                  new Date(profile.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 
                  'Never'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        {hasChanges && (
          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                You have unsaved changes
              </p>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || Object.keys(errors).length > 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-slate-50 bg-sky-700 hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfilePanel;
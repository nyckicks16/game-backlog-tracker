import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  CheckIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  BellIcon,
  BellSlashIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const SettingsPanel = ({ profile, onUpdate }) => {
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty }
  } = useForm({
    defaultValues: {
      theme: profile?.theme || 'dark',
      notifications: {
        gameUpdates: profile?.preferences?.notifications?.gameUpdates ?? true,
        achievements: profile?.preferences?.notifications?.achievements ?? true,
        system: profile?.preferences?.notifications?.system ?? true,
      },
      privacy: {
        profileVisible: profile?.preferences?.privacy?.profileVisible ?? true,
        statisticsVisible: profile?.preferences?.privacy?.statisticsVisible ?? true,
      },
      gaming: {
        favoriteGenres: profile?.preferences?.gaming?.favoriteGenres || [],
        platforms: profile?.preferences?.gaming?.platforms || [],
      }
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
      setValue('theme', profile.theme || 'dark');
      setValue('notifications.gameUpdates', profile.preferences?.notifications?.gameUpdates ?? true);
      setValue('notifications.achievements', profile.preferences?.notifications?.achievements ?? true);
      setValue('notifications.system', profile.preferences?.notifications?.system ?? true);
      setValue('privacy.profileVisible', profile.preferences?.privacy?.profileVisible ?? true);
      setValue('privacy.statisticsVisible', profile.preferences?.privacy?.statisticsVisible ?? true);
      setValue('gaming.favoriteGenres', profile.preferences?.gaming?.favoriteGenres || []);
      setValue('gaming.platforms', profile.preferences?.gaming?.platforms || []);
    }
  }, [profile, setValue]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      
      // Restructure data for API
      const updateData = {
        theme: data.theme,
        preferences: {
          notifications: data.notifications,
          privacy: data.privacy,
          gaming: data.gaming,
        }
      };

      await onUpdate(updateData);
      setHasChanges(false);
    } catch (error) {
      // Error handled in parent component
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue('theme', profile?.theme || 'dark');
    setValue('notifications.gameUpdates', profile?.preferences?.notifications?.gameUpdates ?? true);
    setValue('notifications.achievements', profile?.preferences?.notifications?.achievements ?? true);
    setValue('notifications.system', profile?.preferences?.notifications?.system ?? true);
    setValue('privacy.profileVisible', profile?.preferences?.privacy?.profileVisible ?? true);
    setValue('privacy.statisticsVisible', profile?.preferences?.privacy?.statisticsVisible ?? true);
    setValue('gaming.favoriteGenres', profile?.preferences?.gaming?.favoriteGenres || []);
    setValue('gaming.platforms', profile?.preferences?.gaming?.platforms || []);
    setHasChanges(false);
  };

  const themeOptions = [
    {
      value: 'dark',
      label: 'Dark',
      description: 'Dark theme optimized for gaming',
      icon: MoonIcon,
    },
    {
      value: 'light',
      label: 'Light',
      description: 'Light theme for daytime use',
      icon: SunIcon,
    },
    {
      value: 'auto',
      label: 'Auto',
      description: 'Follow system preference',
      icon: ComputerDesktopIcon,
    }
  ];

  const ToggleSwitch = ({ name, label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          checked ? 'bg-sky-600' : 'bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage your preferences and notifications
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center space-x-2">
            <span className="text-amber-400 text-sm">Unsaved changes</span>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Theme Selection */}
        <div>
          <h3 className="text-lg font-medium text-slate-300 mb-4">Appearance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = watchedValues.theme === option.value;
              
              return (
                <label
                  key={option.value}
                  className={`relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-sky-500 ${
                    isSelected 
                      ? 'border-sky-500 bg-sky-500/10' 
                      : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <input
                    {...register('theme')}
                    type="radio"
                    value={option.value}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                    {isSelected && (
                      <CheckIcon className="h-5 w-5 text-sky-400" />
                    )}
                  </div>
                  <div className="text-sm font-medium text-white mb-1">
                    {option.label}
                  </div>
                  <div className="text-xs text-slate-400">
                    {option.description}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <h3 className="text-lg font-medium text-slate-300 mb-4">Notifications</h3>
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-1">
            <ToggleSwitch
              name="notifications.gameUpdates"
              label="Game Updates"
              description="Notifications about game releases and updates"
              checked={watchedValues.notifications?.gameUpdates}
              onChange={(checked) => setValue('notifications.gameUpdates', checked)}
            />
            <ToggleSwitch
              name="notifications.achievements"
              label="Achievement Alerts"
              description="Notifications when you earn achievements"
              checked={watchedValues.notifications?.achievements}
              onChange={(checked) => setValue('notifications.achievements', checked)}
            />
            <ToggleSwitch
              name="notifications.system"
              label="System Notifications"
              description="Account security and system maintenance alerts"
              checked={watchedValues.notifications?.system}
              onChange={(checked) => setValue('notifications.system', checked)}
            />
          </div>
        </div>

        {/* Privacy Settings */}
        <div>
          <h3 className="text-lg font-medium text-slate-300 mb-4">Privacy</h3>
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-1">
            <ToggleSwitch
              name="privacy.profileVisible"
              label="Public Profile"
              description="Allow other users to view your profile"
              checked={watchedValues.privacy?.profileVisible}
              onChange={(checked) => setValue('privacy.profileVisible', checked)}
            />
            <ToggleSwitch
              name="privacy.statisticsVisible"
              label="Public Statistics"
              description="Show your gaming statistics to other users"
              checked={watchedValues.privacy?.statisticsVisible}
              onChange={(checked) => setValue('privacy.statisticsVisible', checked)}
            />
          </div>
        </div>

        {/* Gaming Preferences */}
        <div>
          <h3 className="text-lg font-medium text-slate-300 mb-4">Gaming Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Favorite Genres
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Select your favorite gaming genres (feature coming soon)
              </p>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center text-slate-400 text-sm">
                Genre selection will be available in the next update
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Preferred Platforms
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Choose your gaming platforms (feature coming soon)
              </p>
              <div className="bg-slate-700/50 rounded-lg p-3 text-center text-slate-400 text-sm">
                Platform selection will be available in the next update
              </div>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Settings
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

export default SettingsPanel;
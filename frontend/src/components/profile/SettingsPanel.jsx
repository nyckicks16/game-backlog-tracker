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
import { SettingsExpansion } from '../ui/ExpandableSection';
import { HelpTooltip, InfoTooltip } from '../ui/Tooltip';

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
        {/* Essential Settings - Always Visible */}
        <div className="space-y-8">
          {/* Theme Selection */}
          <div>
            <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center">
              Appearance
              <InfoTooltip content="Choose your preferred color theme. Dark theme is optimized for gaming sessions." />
            </h3>
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

          {/* Essential Notifications */}
          <div>
            <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center">
              Key Notifications
              <InfoTooltip content="Control the most important notifications you receive." />
            </h3>
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-1">
              <ToggleSwitch
                name="notifications.gameUpdates"
                label="Game Updates"
                description="New releases and updates for games in your backlog"
                checked={watchedValues.notifications?.gameUpdates}
                onChange={(checked) => setValue('notifications.gameUpdates', checked)}
              />
              <ToggleSwitch
                name="notifications.system"
                label="Account Security"
                description="Important security and account notifications"
                checked={watchedValues.notifications?.system}
                onChange={(checked) => setValue('notifications.system', checked)}
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings - Progressive Disclosure */}
        <div className="space-y-6">
          <SettingsExpansion title="Detailed Notification Settings">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-300 flex items-center">
                Achievement & Progress Notifications
                <HelpTooltip content="Control notifications related to your gaming progress and achievements." />
              </h4>
              <div className="space-y-1">
                <ToggleSwitch
                  name="notifications.achievements"
                  label="Achievement Alerts"
                  description="Notifications when you earn new achievements"
                  checked={watchedValues.notifications?.achievements}
                  onChange={(checked) => setValue('notifications.achievements', checked)}
                />
              </div>
            </div>
          </SettingsExpansion>

          <SettingsExpansion title="Privacy & Sharing Settings">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-300 flex items-center">
                Profile Visibility
                <HelpTooltip content="Control what information other users can see about your gaming activity." />
              </h4>
              <div className="space-y-1">
                <ToggleSwitch
                  name="privacy.profileVisible"
                  label="Public Profile"
                  description="Allow other users to view your basic profile information"
                  checked={watchedValues.privacy?.profileVisible}
                  onChange={(checked) => setValue('privacy.profileVisible', checked)}
                />
                <ToggleSwitch
                  name="privacy.statisticsVisible"
                  label="Public Statistics"
                  description="Show your gaming statistics and completion rates to others"
                  checked={watchedValues.privacy?.statisticsVisible}
                  onChange={(checked) => setValue('privacy.statisticsVisible', checked)}
                />
              </div>
            </div>
          </SettingsExpansion>

          <SettingsExpansion title="Gaming Preferences & Recommendations" defaultExpanded={false}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-300 mb-2">
                    Favorite Genres
                    <HelpTooltip content="Tell us your favorite gaming genres to get better recommendations." />
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Select your preferred gaming genres for personalized recommendations
                  </p>
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 text-center text-slate-400 text-sm">
                    <div className="mb-2">🎮</div>
                    <div>Genre preferences coming soon!</div>
                    <div className="text-xs text-slate-500 mt-1">This feature will help us recommend games you'll love</div>
                  </div>
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-300 mb-2">
                    Preferred Platforms
                    <HelpTooltip content="Select your gaming platforms to filter recommendations and track cross-platform games." />
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Choose your gaming platforms for better organization
                  </p>
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 text-center text-slate-400 text-sm">
                    <div className="mb-2">🖥️</div>
                    <div>Platform integration coming soon!</div>
                    <div className="text-xs text-slate-500 mt-1">Connect Steam, Epic Games, Xbox, PlayStation, and more</div>
                  </div>
                </div>
              </div>
            </div>
          </SettingsExpansion>

          <SettingsExpansion title="Advanced Options" defaultExpanded={false}>
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-300 mb-3 flex items-center">
                  Data & Export Options
                  <HelpTooltip content="Advanced options for managing your gaming data and exports." />
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="text-left p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
                  >
                    <div className="font-medium text-slate-300">Export Gaming Data</div>
                    <div className="text-xs text-slate-500 mt-1">Download your complete gaming history</div>
                  </button>
                  <button
                    type="button"
                    className="text-left p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
                  >
                    <div className="font-medium text-slate-300">Import from Platform</div>
                    <div className="text-xs text-slate-500 mt-1">Sync your library from Steam, Epic, etc.</div>
                  </button>
                </div>
              </div>
            </div>
          </SettingsExpansion>
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
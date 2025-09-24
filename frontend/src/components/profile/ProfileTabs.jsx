import React from 'react';
import { 
  UserIcon, 
  CogIcon, 
  ShieldCheckIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

const ProfileTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'profile',
      name: 'Profile',
      icon: UserIcon,
      description: 'Personal information and bio'
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: CogIcon,
      description: 'Preferences and notifications'
    },
    {
      id: 'security',
      name: 'Security',
      icon: ShieldCheckIcon,
      description: 'Account security and sessions'
    }
  ];

  return (
    <>
      {/* Mobile Tab Bar */}
      <div className="lg:hidden">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-1">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <nav className="bg-slate-800 rounded-lg border border-slate-700 p-2">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full text-left group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {tab.name}
                      </div>
                      <div className={`text-xs truncate ${
                        isActive ? 'text-sky-100' : 'text-slate-500 group-hover:text-slate-400'
                      }`}>
                        {tab.description}
                      </div>
                    </div>

                    <ChevronRightIcon className={`h-4 w-4 flex-shrink-0 ml-2 transition-transform ${
                      isActive ? 'text-white rotate-90' : 'text-slate-400 group-hover:text-white'
                    }`} />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Actions (Desktop Only) */}
        <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/api/profile/export';
                link.download = `profile-export-${new Date().toISOString().slice(0, 10)}.json`;
                link.click();
              }}
              className="w-full text-left text-xs text-slate-400 hover:text-slate-300 p-2 hover:bg-slate-700 rounded transition-colors"
            >
              Export Profile Data
            </button>
            <button 
              className="w-full text-left text-xs text-slate-400 hover:text-slate-300 p-2 hover:bg-slate-700 rounded transition-colors"
              onClick={() => window.open('/help/profile', '_blank')}
            >
              Profile Help
            </button>
          </div>
        </div>

        {/* Profile Stats Summary (Desktop Only) */}
        <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700 p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Profile Complete</span>
              <div className="flex items-center">
                <div className="w-12 bg-slate-700 rounded-full h-1.5 mr-2">
                  <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="text-xs text-slate-400">75%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Account Age</span>
              <span className="text-xs text-slate-400">New User</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Theme</span>
              <span className="text-xs text-slate-400">Dark</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileTabs;
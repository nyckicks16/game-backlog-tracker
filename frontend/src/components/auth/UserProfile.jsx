/**
 * User Profile Component
 * User Story #7: Frontend Authentication UI Components
 * 
 * User profile dropdown with avatar, user info, and menu items
 * Following exact design specifications:
 * - 32px avatar circle, Sky Blue bg, white initials
 * - 240px dropdown width, dark surface bg, 8px shadow
 * - Menu items: Profile, Settings, Analytics, Sign Out
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  UserIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthProvider';

const UserProfile = ({ className = '' }) => {
  const { user, logout, getUserInitials, getUserDisplayName } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  if (!user) return null;

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  return (
    <div className={clsx('relative', className)}>
      {/* Profile Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={clsx(
          'flex items-center gap-2 p-2 rounded-lg',
          'text-slate-200 hover:text-white',
          'hover:bg-slate-800/50',
          'focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-gray-900',
          'transition-all duration-200',
          isOpen && 'bg-slate-800/50'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`User menu for ${displayName}`}
      >
        {/* Avatar - 32px circle with Sky Blue background */}
        <div className="relative">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={`${displayName}'s avatar`}
              className="w-8 h-8 rounded-full border border-slate-600"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </div>
          )}
          
          {/* Online status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
        </div>

        {/* User name (hidden on mobile) */}
        <span className="hidden sm:block text-sm font-medium truncate max-w-24">
          {displayName}
        </span>

        {/* Chevron */}
        <ChevronDownIcon
          className={clsx(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={clsx(
            'absolute right-0 top-full mt-2 z-50',
            'w-60', // 240px width as specified
            'bg-slate-800 border border-slate-700 rounded-lg shadow-xl', // Dark surface bg with 8px shadow
            'py-2',
            'animate-in fade-in slide-in-from-top-2 duration-200'
          )}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-3">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${displayName}'s avatar`}
                  className="w-10 h-10 rounded-full border border-slate-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-semibold">
                  {initials}
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <MenuItem
              icon={UserIcon}
              label="Profile"
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
            />
            
            <MenuItem
              icon={Cog6ToothIcon}
              label="Settings"
              onClick={() => {
                setIsOpen(false);
                navigate('/profile'); // For now, settings are part of profile page
              }}
            />
            
            <MenuItem
              icon={ChartBarIcon}
              label="Analytics"
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to analytics page
                console.log('Navigate to analytics');
              }}
            />
            
            <div className="my-1 border-t border-slate-700"></div>
            
            <MenuItem
              icon={ArrowRightOnRectangleIcon}
              label="Sign Out"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual menu item component
 */
const MenuItem = ({ icon: Icon, label, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 w-full px-4 py-2 text-sm',
        'text-slate-300 hover:text-white hover:bg-slate-700/50',
        'focus:outline-none focus:bg-slate-700/50',
        'transition-colors duration-150',
        className
      )}
      role="menuitem"
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};

export default UserProfile;
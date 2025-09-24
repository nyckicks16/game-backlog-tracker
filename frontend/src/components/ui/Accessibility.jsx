import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

// Screen Reader Announcer Context
const AnnouncerContext = createContext();

export const useAnnouncer = () => {
  const context = useContext(AnnouncerContext);
  if (!context) {
    throw new Error('useAnnouncer must be used within an AnnouncerProvider');
  }
  return context;
};

// Live Region Component for Screen Reader Announcements
export const LiveRegion = ({ 
  ariaLive = 'polite', 
  ariaAtomic = true, 
  className = 'sr-only',
  children 
}) => (
  <div
    aria-live={ariaLive}
    aria-atomic={ariaAtomic}
    className={className}
    role="status"
  >
    {children}
  </div>
);

// Screen Reader Announcer Provider
export const AnnouncerProvider = ({ children }) => {
  const [announcement, setAnnouncement] = useState('');
  const [urgentAnnouncement, setUrgentAnnouncement] = useState('');
  const timeoutRef = useRef(null);

  const announce = useCallback((message, urgent = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (urgent) {
      setUrgentAnnouncement(message);
      timeoutRef.current = setTimeout(() => setUrgentAnnouncement(''), 100);
    } else {
      setAnnouncement(message);
      timeoutRef.current = setTimeout(() => setAnnouncement(''), 100);
    }
  }, []);

  const announceError = useCallback((error) => {
    announce(`Error: ${error}`, true);
  }, [announce]);

  const announceSuccess = useCallback((message) => {
    announce(`Success: ${message}`, false);
  }, [announce]);

  const announceLoading = useCallback((message = 'Loading') => {
    announce(message, false);
  }, [announce]);

  const announceLoadingComplete = useCallback((message = 'Loading complete') => {
    announce(message, false);
  }, [announce]);

  return (
    <AnnouncerContext.Provider value={{
      announce,
      announceError,
      announceSuccess,
      announceLoading,
      announceLoadingComplete
    }}>
      {children}
      {/* Live regions for announcements */}
      <LiveRegion ariaLive="polite">
        {announcement}
      </LiveRegion>
      <LiveRegion ariaLive="assertive">
        {urgentAnnouncement}
      </LiveRegion>
    </AnnouncerContext.Provider>
  );
};

// Skip Link Component
export const SkipLink = ({ href, children, className = '' }) => (
  <a
    href={href}
    className={`sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-sky-700 text-slate-50 px-4 py-2 rounded-br-lg text-sm font-medium ${className}`}
    onFocus={(e) => e.target.scrollIntoView()}
  >
    {children}
  </a>
);

// Focus Management Hook
export const useFocusManagement = () => {
  const focusableElementsSelector = 
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const trapFocus = useCallback((element) => {
    const focusableElements = element.querySelectorAll(focusableElementsSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const restoreFocus = useCallback((previousActiveElement) => {
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
  }, []);

  const moveFocusToFirstElement = useCallback((container) => {
    const firstFocusable = container.querySelector(focusableElementsSelector);
    if (firstFocusable) {
      firstFocusable.focus();
      return firstFocusable;
    }
    return null;
  }, []);

  return {
    trapFocus,
    restoreFocus,
    moveFocusToFirstElement
  };
};

// Accessible Button Component with proper ARIA
export const AccessibleButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900';
  
  const variants = {
    primary: 'bg-sky-700 hover:bg-sky-800 text-slate-50 focus:ring-sky-500',
    secondary: 'bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'text-slate-300 hover:text-white hover:bg-slate-700 focus:ring-slate-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  } ${className}`;

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      {...props}
    >
      {loading && (
        <div 
          className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
          aria-hidden="true"
        />
      )}
      {children}
      {loading && <span className="sr-only">Loading</span>}
    </button>
  );
};

// Accessible Form Field Component
export const AccessibleFormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  description,
  required = false,
  disabled = false,
  placeholder,
  className = '',
  ...props
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const descriptionId = description ? `${id}-description` : undefined;
  const ariaDescribedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-slate-300"
      >
        {label}
        {required && (
          <span className="text-red-400 ml-1" aria-label="required">*</span>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-slate-500">
          {description}
        </p>
      )}

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : 'false'}
        className={`w-full px-3 py-2 border rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent ${
          error 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-slate-600 focus:ring-sky-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        {...props}
      />

      {error && (
        <p 
          id={errorId} 
          className="text-sm text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Loading Component
export const AccessibleLoading = ({ 
  message = 'Loading content', 
  size = 'md',
  className = '' 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div 
        className={`animate-spin rounded-full border-b-2 border-sky-500 ${sizes[size]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default {
  AnnouncerProvider,
  useAnnouncer,
  LiveRegion,
  SkipLink,
  useFocusManagement,
  AccessibleButton,
  AccessibleFormField,
  AccessibleLoading
};
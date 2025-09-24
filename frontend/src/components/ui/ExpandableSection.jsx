import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const ExpandableSection = ({ 
  title, 
  children, 
  defaultExpanded = false,
  className = '',
  titleClassName = '',
  contentClassName = '',
  showIcon = true,
  onToggle,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (disabled) return;
    
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    if (onToggle) {
      onToggle(newState);
    }
  };

  const Icon = isExpanded ? ChevronUpIcon : ChevronDownIcon;

  const contentId = `expandable-content-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`expandable-section ${className}`}>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-3 text-left transition-colors
          ${disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'
          } 
          ${titleClassName}`}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} section`}
        type="button"
        role="button"
      >
        <span className="font-medium text-gray-900 dark:text-white">
          {title}
        </span>
        {showIcon && (
          <Icon 
            className="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200" 
            aria-hidden="true"
          />
        )}
      </button>
      
      <div 
        id={contentId}
        className={`expandable-content transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
        role="region"
        aria-labelledby={contentId}
        aria-hidden={!isExpanded}
      >
        <div className={`pt-2 pb-4 px-3 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Preset variants for common use cases
export const FeatureExpansion = ({ title, features, maxVisible = 3, ...props }) => {
  const visibleFeatures = features.slice(0, maxVisible);
  const hiddenFeatures = features.slice(maxVisible);

  if (hiddenFeatures.length === 0) {
    return (
      <div className="space-y-2">
        {visibleFeatures.map((feature, index) => (
          <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
            {feature}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visibleFeatures.map((feature, index) => (
        <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
          {feature}
        </div>
      ))}
      
      <ExpandableSection
        title={`Show ${hiddenFeatures.length} more feature${hiddenFeatures.length === 1 ? '' : 's'}`}
        className="mt-3"
        titleClassName="text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        {...props}
      >
        <div className="space-y-2">
          {hiddenFeatures.map((feature, index) => (
            <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
              {feature}
            </div>
          ))}
        </div>
      </ExpandableSection>
    </div>
  );
};

// Quick settings expansion
export const SettingsExpansion = ({ title = "Advanced Settings", children, ...props }) => (
  <ExpandableSection
    title={title}
    className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
    titleClassName="border-b border-gray-200 dark:border-gray-700"
    contentClassName="bg-gray-50 dark:bg-gray-900"
    {...props}
  >
    {children}
  </ExpandableSection>
);

export default ExpandableSection;
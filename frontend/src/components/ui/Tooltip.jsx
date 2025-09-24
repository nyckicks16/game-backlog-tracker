import React, { useState, useRef, useEffect } from 'react';
import { InformationCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const Tooltip = ({ 
  content, 
  children, 
  position = 'top',
  trigger = 'hover',
  disabled = false,
  delay = 500,
  className = '',
  contentClassName = '',
  maxWidth = '16rem'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (trigger === 'hover') {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        updatePosition();
      }, delay);
    } else {
      setIsVisible(true);
      updatePosition();
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  const updatePosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Check if tooltip fits in the preferred position
    switch (position) {
      case 'top':
        if (triggerRect.top - tooltipRect.height < 10) {
          newPosition = 'bottom';
        }
        break;
      case 'bottom':
        if (triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
          newPosition = 'top';
        }
        break;
      case 'left':
        if (triggerRect.left - tooltipRect.width < 10) {
          newPosition = 'right';
        }
        break;
      case 'right':
        if (triggerRect.right + tooltipRect.width > viewport.width - 10) {
          newPosition = 'left';
        }
        break;
      default:
        break;
    }

    setActualPosition(newPosition);
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg dark:bg-gray-700';
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} mb-2 bottom-full left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} mt-2 top-full left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} mr-2 right-full top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `${baseClasses} ml-2 left-full top-1/2 transform -translate-y-1/2`;
      default:
        return `${baseClasses} mb-2 bottom-full left-1/2 transform -translate-x-1/2`;
    }
  };

  const getArrowClasses = () => {
    const baseArrow = 'absolute border-4';
    
    switch (actualPosition) {
      case 'top':
        return `${baseArrow} top-full left-1/2 transform -translate-x-1/2 border-gray-900 border-b-transparent border-l-transparent border-r-transparent dark:border-gray-700`;
      case 'bottom':
        return `${baseArrow} bottom-full left-1/2 transform -translate-x-1/2 border-gray-900 border-t-transparent border-l-transparent border-r-transparent dark:border-gray-700`;
      case 'left':
        return `${baseArrow} left-full top-1/2 transform -translate-y-1/2 border-gray-900 border-r-transparent border-t-transparent border-b-transparent dark:border-gray-700`;
      case 'right':
        return `${baseArrow} right-full top-1/2 transform -translate-y-1/2 border-gray-900 border-l-transparent border-t-transparent border-b-transparent dark:border-gray-700`;
      default:
        return `${baseArrow} top-full left-1/2 transform -translate-x-1/2 border-gray-900 border-b-transparent border-l-transparent border-r-transparent dark:border-gray-700`;
    }
  };

  const eventHandlers = trigger === 'hover' ? {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip
  } : {
    onClick: toggleTooltip
  };

  return (
    <div className={`relative inline-block ${className}`} ref={triggerRef} {...eventHandlers}>
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={getPositionClasses()}
          style={{ maxWidth }}
          role="tooltip"
          aria-hidden="false"
          id={`tooltip-${Math.random().toString(36).substr(2, 9)}`}
        >
          <div className={`whitespace-pre-wrap ${contentClassName}`}>
            {content}
          </div>
          <div className={getArrowClasses()} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

// Preset components for common use cases
export const HelpTooltip = ({ content, size = 'sm', className = '', ...props }) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  
  return (
    <Tooltip content={content} {...props}>
      <QuestionMarkCircleIcon 
        className={`${iconSize} text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help transition-colors ${className}`}
      />
    </Tooltip>
  );
};

export const InfoTooltip = ({ content, size = 'sm', className = '', ...props }) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  
  return (
    <Tooltip content={content} {...props}>
      <InformationCircleIcon 
        className={`${iconSize} text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-help transition-colors ${className}`}
      />
    </Tooltip>
  );
};

// Feature tooltip for explaining functionality
export const FeatureTooltip = ({ title, description, shortcuts, ...props }) => {
  const content = (
    <div className="space-y-2">
      <div className="font-semibold">{title}</div>
      <div className="text-gray-200">{description}</div>
      {shortcuts && (
        <div className="text-xs text-gray-300 border-t border-gray-600 pt-2">
          <div className="font-medium">Shortcuts:</div>
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between">
              <span>{shortcut.action}</span>
              <kbd className="px-1 py-0.5 bg-gray-800 rounded text-xs">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip 
      content={content} 
      maxWidth="20rem"
      contentClassName="text-left"
      {...props}
    >
      <HelpTooltip size="sm" />
    </Tooltip>
  );
};

export default Tooltip;
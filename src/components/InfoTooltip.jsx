import { useState } from 'react';

/**
 * Reusable info tooltip component
 * Shows a question mark icon that displays a tooltip on hover
 */
export default function InfoTooltip({ text, position = 'bottom' }) {
  const [isVisible, setIsVisible] = useState(false);

  // Position classes for the tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* Question mark icon */}
      <div className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-help transition-colors">
        <span className="text-xs text-gray-600 font-medium">?</span>
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`absolute z-[1100] ${positionClasses[position]} w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg`}
        >
          {text}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
              position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' :
              position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' :
              position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' :
              '-left-1 top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
}

import React from 'react';

const colorMap = {
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-600',
  danger: 'bg-danger-100 text-danger-600',
  primary: 'bg-primary-100 text-primary-700',
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

const Badge = ({
  children,
  color = 'primary',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-semibold rounded-full
        ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
        ${colorMap[color] || colorMap.primary}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            color === 'success' ? 'bg-success-600' :
            color === 'warning' ? 'bg-warning-500' :
            color === 'danger' ? 'bg-danger-500' :
            'bg-primary-600'
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;

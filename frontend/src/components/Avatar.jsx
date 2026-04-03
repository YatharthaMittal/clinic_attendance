import React from 'react';
import { getInitials } from '../utils';

const Avatar = ({ name, photo, size = 'md', className = '' }) => {
  const sizeMap = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const colors = [
    'from-teal-400 to-cyan-500',
    'from-violet-400 to-purple-500',
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-green-500',
    'from-blue-400 to-indigo-500',
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`rounded-2xl object-cover ${sizeMap[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center font-bold text-white ${sizeMap[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;

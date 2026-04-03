import React from 'react';

const Card = ({
  children,
  className = '',
  onClick,
  padding = true,
  gradient = false,
  hover = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border border-gray-100
        ${padding ? 'p-4' : ''}
        ${gradient ? 'gradient-card' : 'bg-white'}
        ${hover || onClick ? 'active:scale-95 transition-transform duration-150 cursor-pointer' : ''}
        shadow-card
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;

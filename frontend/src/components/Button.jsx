import React from 'react';

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700',
  warning: 'bg-warning-500 text-white hover:bg-warning-600',
  success: 'bg-success-600 text-white hover:bg-success-700',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50',
  outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50',
};

const sizes = {
  sm: 'py-1.5 px-3 text-xs rounded-lg',
  md: 'py-2.5 px-4 text-sm rounded-xl',
  lg: 'py-3 px-6 text-base rounded-xl',
  full: 'py-3.5 px-6 text-base rounded-xl w-full',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        select-none touch-none
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.5} />
      ) : null}
      {children}
      {iconRight && !loading && <iconRight.type {...iconRight.props} size={size === 'sm' ? 14 : 16} />}
    </button>
  );
};

export default Button;

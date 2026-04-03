import React from 'react';

const Input = React.forwardRef(({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon: Icon,
  helper,
  disabled = false,
  rows,
  className = '',
}, ref) => {
  const baseClass = `
    w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-800
    placeholder-gray-400 outline-none transition-all duration-150
    focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100
    disabled:opacity-60 disabled:cursor-not-allowed
    ${error ? 'border-danger-400 bg-danger-50' : 'border-gray-200'}
    ${Icon ? 'pl-10' : ''}
  `;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={16} />
          </span>
        )}
        {type === 'textarea' ? (
          <textarea
            ref={ref}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows || 3}
            className={baseClass}
          />
        ) : (
          <input
            ref={ref}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={baseClass}
          />
        )}
      </div>
      {helper && !error && <p className="text-xs text-gray-400">{helper}</p>}
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

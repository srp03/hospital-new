import { forwardRef } from 'react'

export const Input = forwardRef(function Input({
    label,
    error,
    helper,
    type = 'text',
    size = 'md',
    icon,
    className = '',
    ...props
}, ref) {
    const sizes = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-5 py-4 text-lg',
    }

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={`
            w-full rounded-xl border bg-white
            ${sizes[size]}
            ${icon ? 'pl-12' : ''}
            ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                        }
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            transition-all duration-200
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
            {helper && !error && (
                <p className="mt-2 text-sm text-gray-500">{helper}</p>
            )}
        </div>
    )
})

export const Select = forwardRef(function Select({
    label,
    error,
    options = [],
    placeholder = 'Select an option',
    size = 'md',
    className = '',
    ...props
}, ref) {
    const sizes = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-5 py-4 text-lg',
    }

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                className={`
          w-full rounded-xl border bg-white appearance-none cursor-pointer
          ${sizes[size]}
          ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }
          focus:outline-none focus:ring-2 focus:ring-opacity-20
          transition-all duration-200
        `}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
        </div>
    )
})

export const Textarea = forwardRef(function Textarea({
    label,
    error,
    helper,
    rows = 4,
    className = '',
    ...props
}, ref) {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                rows={rows}
                className={`
          w-full rounded-xl border bg-white px-4 py-3 text-base
          ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-opacity-20
          transition-all duration-200
          resize-none
        `}
                {...props}
            />
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {helper && !error && (
                <p className="mt-2 text-sm text-gray-500">{helper}</p>
            )}
        </div>
    )
})

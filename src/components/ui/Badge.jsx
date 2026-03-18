// Badge component for status indicators
export function Badge({
    children,
    variant = 'default',
    size = 'md',
    className = '',
}) {
    const variants = {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-blue-100 text-blue-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-cyan-100 text-cyan-700',
    }

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    }

    return (
        <span
            className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
        >
            {children}
        </span>
    )
}

// Status badge with dot indicator
export function StatusBadge({ status, className = '' }) {
    const statuses = {
        // Appointments
        scheduled: { label: 'Scheduled', variant: 'primary', dot: 'bg-blue-500' },
        completed: { label: 'Completed', variant: 'success', dot: 'bg-green-500' },
        cancelled: { label: 'Cancelled', variant: 'danger', dot: 'bg-red-500' },
        'no-show': { label: 'No Show', variant: 'warning', dot: 'bg-yellow-500' },

        // Lab requests
        requested: { label: 'Requested', variant: 'info', dot: 'bg-cyan-500' },
        collected: { label: 'Collected', variant: 'primary', dot: 'bg-blue-500' },
        processing: { label: 'Processing', variant: 'warning', dot: 'bg-yellow-500' },

        // Billing
        pending: { label: 'Pending', variant: 'warning', dot: 'bg-yellow-500' },
        paid: { label: 'Paid', variant: 'success', dot: 'bg-green-500' },
        partially_paid: { label: 'Partially Paid', variant: 'info', dot: 'bg-cyan-500' },

        // Urgency
        normal: { label: 'Normal', variant: 'default', dot: 'bg-gray-500' },
        urgent: { label: 'Urgent', variant: 'warning', dot: 'bg-yellow-500' },
        critical: { label: 'Critical', variant: 'danger', dot: 'bg-red-500' },
    }

    const config = statuses[status] || statuses.pending

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-full
        ${config.variant === 'primary' ? 'bg-blue-100 text-blue-700' : ''}
        ${config.variant === 'success' ? 'bg-green-100 text-green-700' : ''}
        ${config.variant === 'warning' ? 'bg-yellow-100 text-yellow-700' : ''}
        ${config.variant === 'danger' ? 'bg-red-100 text-red-700' : ''}
        ${config.variant === 'info' ? 'bg-cyan-100 text-cyan-700' : ''}
        ${config.variant === 'default' ? 'bg-gray-100 text-gray-700' : ''}
        ${className}
      `}
        >
            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    )
}

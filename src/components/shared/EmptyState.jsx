export function EmptyState({
    icon,
    title,
    description,
    action,
    className = '',
}) {
    return (
        <div className={`text-center py-12 px-4 ${className}`}>
            {icon ? (
                <div className="mx-auto w-16 h-16 text-gray-300 mb-4">
                    {icon}
                </div>
            ) : (
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">{description}</p>
            {action && action}
        </div>
    )
}

// Pre-built empty states for common scenarios
export function NoDataFound({ type = 'data' }) {
    const messages = {
        data: { title: 'No data yet', description: 'There is nothing to show here yet.' },
        patients: { title: 'No patients found', description: 'No patients match your search criteria.' },
        appointments: { title: 'No appointments', description: 'You don\'t have any appointments scheduled.' },
        prescriptions: { title: 'No prescriptions', description: 'No prescriptions have been added yet.' },
        reports: { title: 'No lab reports', description: 'No lab reports have been uploaded yet.' },
        vitals: { title: 'No health readings', description: 'Your health readings will appear here.' },
        bills: { title: 'No bills', description: 'You don\'t have any pending bills.' },
    }

    const { title, description } = messages[type] || messages.data

    return <EmptyState title={title} description={description} />
}

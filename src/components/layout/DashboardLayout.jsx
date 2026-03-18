import { Sidebar } from './Sidebar'

export function DashboardLayout({ children, menuItems, title, accentColor }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar menuItems={menuItems} title={title} accentColor={accentColor} />
            <main className="ml-64 min-h-screen transition-all duration-300">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

export function PageHeader({ title, subtitle, action }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                    <p className="text-gray-500 mt-1">{subtitle}</p>
                )}
            </div>
            {action && <div className="mt-4 sm:mt-0">{action}</div>}
        </div>
    )
}

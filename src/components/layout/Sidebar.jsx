import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function Sidebar({ menuItems, title, accentColor = 'blue' }) {
    const [collapsed, setCollapsed] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const { profile, signOut } = useAuth()

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const colors = {
        blue: {
            active: 'bg-blue-50 text-blue-600 border-blue-500',
            hover: 'hover:bg-blue-50 hover:text-blue-600',
            icon: 'text-blue-500',
        },
        green: {
            active: 'bg-green-50 text-green-600 border-green-500',
            hover: 'hover:bg-green-50 hover:text-green-600',
            icon: 'text-green-500',
        },
        purple: {
            active: 'bg-purple-50 text-purple-600 border-purple-500',
            hover: 'hover:bg-purple-50 hover:text-purple-600',
            icon: 'text-purple-500',
        },
        cyan: {
            active: 'bg-cyan-50 text-cyan-600 border-cyan-500',
            hover: 'hover:bg-cyan-50 hover:text-cyan-600',
            icon: 'text-cyan-500',
        },
    }

    const colorScheme = colors[accentColor] || colors.blue

    return (
        <aside
            className={`
        fixed left-0 top-0 h-screen bg-white border-r border-gray-100
        transition-all duration-300 z-40 flex flex-col
        ${collapsed ? 'w-20' : 'w-64'}
      `}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-gray-100">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
                    <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${accentColor === 'blue' ? 'bg-blue-500' : ''}
            ${accentColor === 'green' ? 'bg-green-500' : ''}
            ${accentColor === 'purple' ? 'bg-purple-500' : ''}
            ${accentColor === 'cyan' ? 'bg-cyan-500' : ''}
          `}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-gray-800">{title}</span>
                    )}
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200 border-l-4
                    ${isActive
                                            ? colorScheme.active
                                            : `border-transparent text-gray-600 ${colorScheme.hover}`
                                        }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                                    title={collapsed ? item.label : ''}
                                >
                                    <span className={`w-5 h-5 ${isActive ? '' : 'text-gray-400'}`}>
                                        {item.icon}
                                    </span>
                                    {!collapsed && (
                                        <span className="font-medium">{item.label}</span>
                                    )}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* User section */}
            <div className="border-t border-gray-100 p-4">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                            {profile?.full_name?.charAt(0) || 'U'}
                        </span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {profile?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSignOut}
                    className={`
            mt-3 flex items-center gap-3 px-3 py-2 rounded-xl w-full
            text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
                    title="Sign out"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!collapsed && <span>Sign out</span>}
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
            >
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
        </aside>
    )
}

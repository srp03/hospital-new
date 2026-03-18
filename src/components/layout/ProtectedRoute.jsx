import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingPage } from '../shared/LoadingSpinner'

export function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return <LoadingPage message="Verifying access..." />
    }

    // If no user, send to login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // If user exists but profile is missing, we might still be loading or there's an error
    // But our AuthContext sets loading=true during fetchProfile, so if loading is false
    // and profile is still null, it means the profile fetch failed or doesn't exist.
    if (!profile) {
        return <Navigate to="/login" replace />
    }

    // Role check
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
        const roleRoutes = {
            patient: '/patient',
            doctor: '/doctor',
            lab: '/lab',
            admin: '/admin',
        }
        return <Navigate to={roleRoutes[profile.role] || '/login'} replace />
    }

    return children
}

export function PublicRoute({ children }) {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return <LoadingPage message="Loading..." />
    }

    // If already logged in, send to their dashboard
    if (user && profile) {
        const roleRoutes = {
            patient: '/patient',
            doctor: '/doctor',
            lab: '/lab',
            admin: '/admin',
        }
        return <Navigate to={roleRoutes[profile.role] || '/patient'} replace />
    }

    return children
}

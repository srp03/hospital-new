import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({
    user: null,
    profile: null,
    loading: true,
    signIn: () => { },
    signUp: () => { },
    signOut: () => { },
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        let authSubscription = null
        let profileFetchingId = null

        // Absolute fail-safe timeout
        const failSafeTimeout = setTimeout(() => {
            if (mounted) {
                setLoading(prevLoading => {
                    if (prevLoading) {
                        console.warn('[AuthContext] Fail-safe timeout triggered - forcing UI unlock')
                        return false
                    }
                    return prevLoading
                })
            }
        }, 5000)

        // Fetch user profile from database with deduplication
        const fetchUserProfile = async (userId) => {
            if (profileFetchingId === userId) return
            profileFetchingId = userId

            try {
                // Query the PUBLIC profiles table which has the role
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle()

                if (!mounted) return null

                if (error) {
                    if (error.code !== 'PGRST116' && !error.message?.includes('aborted')) {
                        console.error('[AuthContext] Profile fetch error:', error.message)
                    }
                    return null
                }

                return data
            } catch (err) {
                if (!err.message?.includes('aborted')) {
                    console.error('[AuthContext] Profile fetch exception:', err)
                }
                return null
            } finally {
                if (profileFetchingId === userId) {
                    profileFetchingId = null
                }
            }
        }

        const handleAuthStateChange = async (event, session) => {
            if (!mounted) return

            console.log(`[AuthContext] Auth event: ${event}`, session?.user?.id || 'No session')

            if (event === 'SIGNED_OUT') {
                setUser(null)
                setProfile(null)
                setLoading(false)
                return
            }

            if (session?.user) {
                setUser(session.user)
                const userProfile = await fetchUserProfile(session.user.id)
                if (mounted) {
                    setProfile(userProfile)
                    setLoading(false)
                }
            } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                // Handle cases where session might be null unexpectedly
                setUser(null)
                setProfile(null)
                setLoading(false)
            }
        }

        // Initialize auth state and listener
        const init = async () => {
            try {
                // Use getSession() with caution, it might trigger refresh
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    if (error.message?.includes('refresh_token_not_found') || error.status === 400) {
                        console.warn('[AuthContext] Session refresh failed - user likely needs to re-login')
                        // Clear any stale local state if necessary
                    } else {
                        console.error('[AuthContext] getSession error:', error)
                    }
                }

                if (mounted) {
                    if (session) {
                        await handleAuthStateChange('INITIAL_SESSION', session)
                    } else {
                        setLoading(false)
                    }
                }
            } catch (err) {
                if (mounted) {
                    console.error('[AuthContext] Session init exception:', err)
                    setLoading(false)
                }
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                // Defensive: Ensure we don't process tokens as sessions
                handleAuthStateChange(event, session)
            })
            authSubscription = subscription
        }

        init()

        // Cleanup
        return () => {
            mounted = false
            clearTimeout(failSafeTimeout)
            if (authSubscription) {
                authSubscription.unsubscribe()
            }
        }
    }, []) // Empty dependency array - run once on mount

    const signUp = async (email, password) => {
        try {
            // Simplified signUp - let the Register component handle profile creation
            // or we can keep it here but make it more robust. 
            // In this app, Register.jsx is already doing it, so let's simplify here
            // to avoid duplication and 403 errors during registration.
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            })
            if (error) throw error
            return data
        } catch (error) {
            console.error('[AuthContext] Sign up error:', error)
            throw error
        }
    }

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            return data
        } catch (error) {
            console.error('[AuthContext] Sign in error:', error)
            throw error
        }
    }

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            setUser(null)
            setProfile(null)
        } catch (error) {
            console.error('[AuthContext] Sign out error:', error)
            throw error
        }
    }

    const value = {
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isPatient: profile?.role === 'patient',
        isDoctor: profile?.role === 'doctor',
        isLab: profile?.role === 'lab',
        isAdmin: profile?.role === 'admin',
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

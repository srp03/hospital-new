import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import toast from 'react-hot-toast'

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        age: '',
        gender: '',
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const { signUp } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors = {}
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
        if (!formData.email) newErrors.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email'
        if (!formData.password) newErrors.password = 'Password is required'
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
        if (!formData.age) newErrors.age = 'Age is required'
        else if (isNaN(formData.age) || formData.age < 0 || formData.age > 150) newErrors.age = 'Please enter a valid age'
        if (!formData.gender) newErrors.gender = 'Please select your gender'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const generatePatientUID = () => {
        const year = new Date().getFullYear()
        const random = Math.floor(1000 + Math.random() * 9000)
        return `PAT-${year}-${random}`
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        // 0. Prevent duplicate submission
        if (loading) return

        setLoading(true)
        try {
            console.log('[Register] Starting registration for:', formData.email)

            // 1. Check if user is already authenticated
            const { data: { session: existingSession } } = await supabase.auth.getSession()
            if (existingSession) {
                console.warn('[Register] User already logged in, redirecting...')
                toast.error('You are already logged in.')
                navigate(existingSession.user.user_metadata?.role === 'patient' ? '/patient/dashboard' : '/')
                return
            }

            // 2. Sign up user via Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            })

            if (authError) {
                // Handle "User already registered" error (typically 422)
                if (authError.status === 422 || authError.message?.includes('already registered')) {
                    console.log('[Register] User already registered, suggesting login')
                    toast.error('This email is already registered. Please sign in.')
                    navigate('/login')
                    return
                }
                console.error('[Register] Auth signUp error:', authError)
                throw authError
            }

            if (!authData?.user) {
                throw new Error('Registration failed: No user data returned.')
            }

            const userId = authData.user.id
            console.log('[Register] Auth successful, User ID:', userId)

            // 3. Create patient record
            // Profile is created automatically by database trigger
            const patientUID = generatePatientUID()
            const { error: patientError } = await supabase
                .from('patients')
                .insert({
                    user_id: userId,
                    patient_uid: patientUID,
                    full_name: formData.fullName,
                    age: parseInt(formData.age),
                    gender: formData.gender,
                })

            if (patientError) {
                console.error('[Register] Patient record creation failed:', patientError)
                throw new Error(`Patient record failed: ${patientError.message}`)
            }

            console.log('[Register] Patient record created:', patientUID)
            toast.success(`Registration successful! ID: ${patientUID}`)

            // 5. Check if we have an active session (automatic sign-in after signUp)
            const { data: { session: newSession } } = await supabase.auth.getSession()
            if (newSession) {
                navigate('/patient/dashboard')
            } else {
                toast('Please check your email to confirm registration.')
                navigate('/login')
            }
        } catch (error) {
            console.error('[Register] Process failed:', error)
            toast.error(error.message || 'Registration encountered an error.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo & Welcome */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4 shadow-lg shadow-green-500/25">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
                    <p className="text-gray-500 mt-2">Join our health portal in just a few steps</p>
                </div>

                {/* Registration Card */}
                <Card className="shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            name="fullName"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={handleChange}
                            error={errors.fullName}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            }
                        />

                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            }
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Age"
                                name="age"
                                type="number"
                                placeholder="Your age"
                                value={formData.age}
                                onChange={handleChange}
                                error={errors.age}
                            />

                            <Select
                                label="Gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                error={errors.gender}
                                options={[
                                    { value: 'male', label: 'Male' },
                                    { value: 'female', label: 'Female' },
                                    { value: 'other', label: 'Other' },
                                ]}
                                placeholder="Select"
                            />
                        </div>

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            helper="At least 6 characters"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        <Input
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            }
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                loading={loading}
                                fullWidth
                                size="lg"
                                variant="success"
                            >
                                Create Account
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-500 font-medium hover:text-blue-600">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>

                {/* Help text */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    By registering, you agree to our privacy policy
                </p>
            </div>
        </div>
    )
}

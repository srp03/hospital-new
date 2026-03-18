import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { StatsCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingPage } from '../../components/shared/LoadingSpinner'

// Sub-pages
import LabPendingTests from './LabPendingTests'
import LabCompletedReports from './LabCompletedReports'

// Menu items for lab sidebar
const menuItems = [
    {
        path: '/lab',
        label: 'Dashboard',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        path: '/lab/pending',
        label: 'Pending Tests',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        path: '/lab/completed',
        label: 'Completed reports',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
]

export default function LabDashboard() {
    return (
        <DashboardLayout menuItems={menuItems} title="Laboratory Portal" accentColor="cyan">
            <Routes>
                <Route path="/" element={<LabOverview />} />
                <Route path="/pending" element={<LabPendingTests />} />
                <Route path="/completed" element={<LabCompletedReports />} />
            </Routes>
        </DashboardLayout>
    )
}

function LabOverview() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({ requested: 0, processing: 0, completed: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const { data } = await supabase.from('lab_requests').select('status')

            const requested = data?.filter(r => r.status === 'requested').length || 0
            const processing = data?.filter(r => r.status === 'collected' || r.status === 'processing').length || 0
            const completed = data?.filter(r => r.status === 'completed').length || 0

            setStats({ requested, processing, completed })
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingPage message="Loading overview stats..." />

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-cyan-600 to-cyan-700 p-8 rounded-3xl text-white shadow-xl">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name}!</h1>
                    <p className="text-cyan-100 mt-2 text-lg">You have {stats.requested + stats.processing} tests waiting for your attention today.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="white" onClick={() => navigate('/lab/pending')}>Manage Samples</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title="Awaiting Sample"
                    value={stats.requested}
                    subtitle="Tests requested by doctors"
                    color="yellow"
                    onClick={() => navigate('/lab/pending')}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatsCard
                    title="In Processing"
                    value={stats.processing}
                    subtitle="Samples collected/being tested"
                    color="blue"
                    onClick={() => navigate('/lab/pending')}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                />
                <StatsCard
                    title="Reports Completed"
                    value={stats.completed}
                    subtitle="Total reports generated"
                    color="green"
                    onClick={() => navigate('/lab/completed')}
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            <div className="bg-white border rounded-3xl p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold">Lab Efficiency</h3>
                <p className="text-gray-500 max-w-md mx-auto">Your completion rate is high! Ensure all reports are uploaded promptly so doctors can provide treatment advice.</p>
                <div className="flex justify-center gap-4 pt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/lab/pending')}>View Priority Tests</Button>
                </div>
            </div>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { DashboardLayout, PageHeader } from '../../components/layout/DashboardLayout'
import { Card, StatsCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { LoadingPage } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { Modal } from '../../components/ui/Modal'
import toast from 'react-hot-toast'

// Sub-pages
import AdminPatients from './AdminPatients'
import AdminStaff from './AdminStaff'
import AdminBilling from './AdminBilling'
import AdminBeds from './AdminBeds'

// Menu items for admin sidebar
const menuItems = [
    {
        path: '/admin',
        label: 'Dashboard',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        path: '/admin/patients',
        label: 'Patients',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        path: '/admin/staff',
        label: 'Staff Management',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
    {
        path: '/admin/billing',
        label: 'Billing & Ops',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    {
        path: '/admin/beds',
        label: 'Bed Inventory',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
]

export default function AdminDashboard() {
    return (
        <DashboardLayout menuItems={menuItems} title="Administrative Control" accentColor="purple">
            <Routes>
                <Route path="/" element={<AdminOverview />} />
                <Route path="/patients" element={<AdminPatients />} />
                <Route path="/staff" element={<AdminStaff />} />
                <Route path="/billing" element={<AdminBilling />} />
                <Route path="/beds" element={<AdminBeds />} />
            </Routes>
        </DashboardLayout>
    )
}

function AdminOverview() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState({
        totalPatients: 0,
        admittedPatients: 0,
        availableBeds: 0,
        pendingPayments: 0,
        totalDoctors: 0,
        todayAppointments: 0,
    })
    const [recentPatients, setRecentPatients] = useState([])
    const [pendingBills, setPendingBills] = useState([])
    const [showBillingModal, setShowBillingModal] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            // Fetch stats in parallel
            const [patientsRes, bedsRes, billsRes, doctorsRes, apptsRes] = await Promise.all([
                supabase.from('patients').select('id, is_admitted'),
                supabase.from('beds').select('id, is_available'),
                supabase.from('billing').select('amount, paid_amount, status').eq('status', 'pending'),
                supabase.from('doctors').select('id'),
                supabase.from('appointments').select('id').eq('appointment_date', new Date().toISOString().split('T')[0]),
                supabase.from('patients').select('*').order('created_at', { ascending: false }).limit(5),
                supabase.from('billing').select('*, patients(full_name, patient_uid)').eq('status', 'pending').order('created_at', { ascending: false }).limit(5)
            ])

            // We need a separate call for recent data to avoid complex Promise.all indexing
            const { data: recentPatientsData } = await supabase.from('patients').select('*').order('created_at', { ascending: false }).limit(5)
            const { data: pendingBillsData } = await supabase.from('billing').select('*, patients(full_name, patient_uid)').eq('status', 'pending').order('created_at', { ascending: false }).limit(5)

            const totalPatients = patientsRes.data?.length || 0
            const admittedPatients = patientsRes.data?.filter((p) => p.is_admitted).length || 0
            const availableBeds = bedsRes.data?.filter((b) => b.is_available).length || 0
            const pendingPayments = billsRes.data?.reduce((sum, b) => sum + (parseFloat(b.amount) - parseFloat(b.paid_amount || 0)), 0) || 0
            const totalDoctors = doctorsRes.data?.length || 0
            const todayAppointments = apptsRes.data?.length || 0

            setStats({
                totalPatients,
                admittedPatients,
                availableBeds,
                pendingPayments,
                totalDoctors,
                todayAppointments,
            })

            setRecentPatients(recentPatientsData || [])
            setPendingBills(pendingBillsData || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingPage message="Syncing hospital operations..." />

    return (
        <>
            <PageHeader
                title="Hospital Command Center"
                subtitle={`Administrative access for ${profile?.full_name}`}
                action={
                    <Button onClick={() => setShowBillingModal(true)} variant="primary">
                        + New Billing Invoice
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
                <StatsCard title="Total Patients" value={stats.totalPatients} color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <StatsCard title="Admitted" value={stats.admittedPatients} color="green" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatsCard title="Beds Open" value={stats.availableBeds} color="purple" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
                <StatsCard title="Due Payments" value={`₹${stats.pendingPayments.toLocaleString()}`} color="yellow" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatsCard title="Total Staff" value={stats.totalDoctors} color="indigo" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatsCard title="Today Visits" value={stats.todayAppointments} color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-900">Recent Registrations</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/patients')}>Manage All</Button>
                    </div>
                    {recentPatients.length > 0 ? (
                        <div className="space-y-4">
                            {recentPatients.map((patient) => (
                                <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-purple-100 transition-all cursor-pointer" onClick={() => navigate('/admin/patients')}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-black text-lg">
                                            {patient.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-none mb-1">{patient.full_name}</p>
                                            <p className="text-xs text-gray-500">{patient.patient_uid}</p>
                                        </div>
                                    </div>
                                    <Badge variant={patient.is_admitted ? 'success' : 'default'} size="sm">
                                        {patient.is_admitted ? 'Admitted' : 'OPD'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : <NoDataFound type="patients" />}
                </Card>

                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-gray-900">Recent Billing Activity</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/billing')}>Financials</Button>
                    </div>
                    {pendingBills.length > 0 ? (
                        <div className="space-y-4">
                            {pendingBills.map((bill) => (
                                <div key={bill.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-yellow-200 transition-all">
                                    <div className="max-w-[200px]">
                                        <p className="font-bold text-gray-900 truncate leading-none mb-1">{bill.patients?.full_name}</p>
                                        <p className="text-xs text-gray-400 font-mono">{bill.patients?.patient_uid}</p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">{bill.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-red-600">₹{parseFloat(bill.amount).toLocaleString()}</p>
                                        <StatusBadge status={bill.status} size="sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <p className="font-bold text-gray-900">Maximum Efficiency!</p>
                            <p className="text-sm text-gray-500">All pending invoices have been cleared.</p>
                        </div>
                    )}
                </Card>
            </div>

            <Modal
                isOpen={showBillingModal}
                onClose={() => {
                    setShowBillingModal(false)
                    setSelectedPatient(null)
                }}
                title="Create Global Invoice"
                size="md"
            >
                <BillingForm
                    patient={selectedPatient}
                    onSuccess={() => {
                        setShowBillingModal(false)
                        setSelectedPatient(null)
                        fetchDashboardData()
                    }}
                />
            </Modal>
        </>
    )
}

function BillingForm({ patient, onSuccess }) {
    const [patientId, setPatientId] = useState(patient?.id || '')
    const [patients, setPatients] = useState([])
    const [formData, setFormData] = useState({ description: '', category: 'consultation', amount: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!patient) fetchPatients()
    }, [patient])

    const fetchPatients = async () => {
        const { data } = await supabase.from('patients').select('id, full_name, patient_uid').order('full_name')
        setPatients(data || [])
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!patientId || !formData.amount) return toast.error('Fields required')
        setLoading(true)
        try {
            const { error } = await supabase.from('billing').insert({
                patient_id: patientId,
                description: formData.description,
                category: formData.category,
                amount: parseFloat(formData.amount),
                status: 'pending',
            })
            if (error) throw error
            toast.success('Bill generated')
            onSuccess()
        } catch (error) {
            toast.error('Error creating bill')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {patient ? (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <p className="font-bold text-purple-900 text-lg">{patient.full_name}</p>
                    <p className="text-sm text-purple-600 font-mono tracking-widest">{patient.patient_uid}</p>
                </div>
            ) : (
                <Select
                    label="Identify Patient"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    options={patients.map((p) => ({
                        value: p.id,
                        label: `${p.full_name} (${p.patient_uid})`,
                    }))}
                    placeholder="Search for patient..."
                />
            )}

            <Input
                label="Invoice Description"
                placeholder="e.g., Surgery Deposit, Room Rent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
            />

            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Transaction Category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    options={[
                        { value: 'consultation', label: 'Consultation' },
                        { value: 'lab', label: 'Lab Test' },
                        { value: 'medicine', label: 'Pharmacy' },
                        { value: 'room', label: 'Ward/Bed' },
                        { value: 'other', label: 'Misc' },
                    ]}
                />
                <Input
                    label="Amount Due (₹)"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                />
            </div>

            <Button type="submit" loading={loading} fullWidth variant="primary" className="h-12 text-lg">
                Generate Invoice
            </Button>
        </form>
    )
}

import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { DashboardLayout, PageHeader } from '../../components/layout/DashboardLayout'
import { Card, StatsCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { LoadingPage } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { formatDoctorName } from '../../lib/formatters'
import toast from 'react-hot-toast'

// Sub-pages
import PatientsPage from './PatientsPage'
import AppointmentsPage from './AppointmentsPage'
import PrescriptionsPage from './PrescriptionsPage'

// Shared components
import PatientDetailView from '../../components/shared/PatientDetailView'

// Context for doctor data
const DoctorContext = createContext(null)
export const useDoctor = () => useContext(DoctorContext)

// Menu items for doctor sidebar
const menuItems = [
    {
        path: '/doctor',
        label: 'Dashboard',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        path: '/doctor/patients',
        label: 'All Patients',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    {
        path: '/doctor/appointments',
        label: 'Appointments',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        path: '/doctor/prescriptions',
        label: 'Prescriptions',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
]

export default function DoctorDashboard() {
    const { profile } = useAuth()
    const [doctor, setDoctor] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile) {
            fetchDoctorData()
        }
    }, [profile])

    const fetchDoctorData = async () => {
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .eq('user_id', profile.id)
                .single()

            if (error) throw error
            setDoctor(data)
        } catch (error) {
            console.error('Error fetching doctor:', error)
            toast.error('Failed to load doctor profile')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingPage message="Loading doctor dashboard..." />

    return (
        <DoctorContext.Provider value={{ doctor, fetchDoctorData }}>
            <DashboardLayout menuItems={menuItems} title="Doctor Portal" accentColor="green">
                <Routes>
                    <Route index element={<DoctorOverview />} />
                    <Route path="patients" element={<PatientsPage />} />
                    <Route path="appointments" element={<AppointmentsPage />} />
                    <Route path="prescriptions" element={<PrescriptionsPage />} />
                </Routes>
            </DashboardLayout>
        </DoctorContext.Provider>
    )
}

function DoctorOverview() {
    const { profile } = useAuth()
    const { doctor, fetchDoctorData } = useDoctor()
    const [stats, setStats] = useState({ todayAppointments: 0, totalPatients: 0, pendingLabs: 0 })
    const [recentPatients, setRecentPatients] = useState([])
    const [todayAppointments, setTodayAppointments] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)
    const [showPatientModal, setShowPatientModal] = useState(false)
    const [showFeeModal, setShowFeeModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [consultationFee, setConsultationFee] = useState(doctor?.consultation_fee || '')

    useEffect(() => {
        if (doctor) {
            fetchStats()
        }
    }, [doctor])

    const fetchStats = async () => {
        try {
            setLoading(true)
            // Fetch today's appointments
            const today = new Date().toISOString().split('T')[0]
            const { data: apptData } = await supabase
                .from('appointments')
                .select('*, patients(full_name, patient_uid, age, gender)')
                .eq('doctor_id', doctor.id)
                .eq('appointment_date', today)
                .order('appointment_time', { ascending: true })

            setTodayAppointments(apptData || [])
            setStats((prev) => ({ ...prev, todayAppointments: apptData?.length || 0 }))

            // Fetch total unique patients
            const { data: presData } = await supabase
                .from('prescriptions')
                .select('patient_id')
                .eq('doctor_id', doctor.id)

            const uniquePatients = new Set(presData?.map((p) => p.patient_id))
            setStats((prev) => ({ ...prev, totalPatients: uniquePatients.size }))

            // Fetch pending lab requests
            const { data: labData } = await supabase
                .from('lab_requests')
                .select('id')
                .eq('doctor_id', doctor.id)
                .neq('status', 'completed')

            setStats((prev) => ({ ...prev, pendingLabs: labData?.length || 0 }))

            // Fetch recent patients (from prescriptions)
            const { data: recentData } = await supabase
                .from('prescriptions')
                .select('patient_id, created_at, patients(id, full_name, patient_uid, age, gender)')
                .eq('doctor_id', doctor.id)
                .order('created_at', { ascending: false })
                .limit(5)

            const uniqueRecent = recentData?.reduce((acc, item) => {
                if (!acc.find((p) => p.patients?.id === item.patients?.id)) {
                    acc.push(item)
                }
                return acc
            }, [])

            setRecentPatients(uniqueRecent || [])
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateFee = async () => {
        try {
            const { error } = await supabase
                .from('doctors')
                .update({ consultation_fee: parseFloat(consultationFee) })
                .eq('id', doctor.id)

            if (error) throw error
            toast.success('Consultation fee updated')
            setShowFeeModal(false)
            fetchDoctorData()
        } catch (error) {
            toast.error('Failed to update fee')
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return

        try {
            const { data } = await supabase
                .from('patients')
                .select('*')
                .or(`patient_uid.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
                .limit(10)

            setSearchResults(data || [])
        } catch (error) {
            console.error('Search error:', error)
            toast.error('Failed to search patients')
        }
    }

    const openPatientDetails = (patient, appointmentId = null) => {
        setSelectedPatient(patient)
        setSelectedAppointmentId(appointmentId)
        setShowPatientModal(true)
    }

    if (loading) {
        return <LoadingPage message="Loading your dashboard..." />
    }

    return (
        <>
            <PageHeader
                title={`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, ${formatDoctorName(doctor?.full_name || profile?.full_name)}`}
                subtitle={doctor?.specialization || 'General Medicine'}
                action={
                    <Button variant="outline" onClick={() => setShowFeeModal(true)}>
                        Fee: ₹{doctor?.consultation_fee || 0}
                    </Button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatsCard
                    title="Today's Appointments"
                    value={stats.todayAppointments}
                    color="blue"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                />
                <StatsCard
                    title="Total Patients Treated"
                    value={stats.totalPatients}
                    color="green"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                />
                <StatsCard
                    title="Pending Lab Reports"
                    value={stats.pendingLabs}
                    color="yellow"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    }
                />
            </div>

            {/* Patient Search */}
            <Card className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Patient Search</h3>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by Patient ID or Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                    <Button onClick={handleSearch}>Search</Button>
                </div>

                {searchResults.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <p className="text-sm text-gray-500 mb-3">{searchResults.length} patient(s) found</p>
                        <div className="space-y-2">
                            {searchResults.map((patient) => (
                                <div
                                    key={patient.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => openPatientDetails(patient)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-medium">{patient.full_name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{patient.full_name}</p>
                                            <p className="text-sm text-gray-500">{patient.patient_uid}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{patient.age} years, {patient.gender}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Appointments */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
                        <Badge variant="primary">{todayAppointments.length}</Badge>
                    </div>
                    {todayAppointments.length > 0 ? (
                        <div className="space-y-3">
                            {todayAppointments.map((appt) => (
                                <div
                                    key={appt.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => openPatientDetails(appt.patients, appt.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-green-600 font-medium">
                                                {appt.patients?.full_name?.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{appt.patients?.full_name}</p>
                                            <p className="text-sm text-gray-500">{appt.appointment_time}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={appt.status} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <NoDataFound type="appointments" />
                    )}
                </Card>

                {/* Recent Patients */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Patients</h3>
                    </div>
                    {recentPatients.length > 0 ? (
                        <div className="space-y-3">
                            {recentPatients.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => openPatientDetails(item.patients)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-purple-600 font-medium">
                                                {item.patients?.full_name?.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.patients?.full_name}</p>
                                            <p className="text-sm text-gray-500">{item.patients?.patient_uid}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <NoDataFound type="patients" />
                    )}
                </Card>
            </div>

            {/* Patient Detail Modal */}
            <Modal
                isOpen={showPatientModal}
                onClose={() => setShowPatientModal(false)}
                title={`Patient: ${selectedPatient?.full_name}`}
                size="lg"
            >
                {selectedPatient && (
                    <PatientDetailView
                        patient={selectedPatient}
                        doctorId={doctor?.id}
                        appointmentId={selectedAppointmentId}
                        onClose={() => setShowPatientModal(false)}
                    />
                )}
            </Modal>

            {/* Fee Update Modal */}
            <Modal
                isOpen={showFeeModal}
                onClose={() => setShowFeeModal(false)}
                title="Update Consultation Fee"
            >
                <div className="space-y-4">
                    <Input
                        label="Fee Amount (₹)"
                        type="number"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(e.target.value)}
                        placeholder="e.g. 500"
                    />
                    <Button onClick={handleUpdateFee} fullWidth>Save Fee</Button>
                </div>
            </Modal>
        </>
    )
}

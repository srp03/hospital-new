import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, StatsCard } from '../../components/ui/Card'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingPage } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { formatDoctorName } from '../../lib/formatters'

// Sub-pages
import PatientPrescriptions from './PatientPrescriptions'
import PatientLabReports from './PatientLabReports'
import PatientAppointments from './PatientAppointments'
import PatientBilling from './PatientBilling'

// Menu items for patient sidebar
const menuItems = [
    {
        path: '/patient',
        label: 'Dashboard',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        path: '/patient/prescriptions',
        label: 'My Prescriptions',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        path: '/patient/reports',
        label: 'Lab Reports',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
    },
    {
        path: '/patient/appointments',
        label: 'Appointments',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        path: '/patient/billing',
        label: 'My Bills',
        icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
]

export default function PatientDashboard() {
    return (
        <DashboardLayout menuItems={menuItems} title="Health Portal" accentColor="blue">
            <Routes>
                <Route path="/" element={<PatientOverview />} />
                <Route path="/prescriptions" element={<PatientPrescriptions />} />
                <Route path="/reports" element={<PatientLabReports />} />
                <Route path="/appointments" element={<PatientAppointments />} />
                <Route path="/billing" element={<PatientBilling />} />
            </Routes>
        </DashboardLayout>
    )
}

function PatientOverview() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [patient, setPatient] = useState(null)
    const [vitals, setVitals] = useState(null)
    const [prescriptions, setPrescriptions] = useState([])
    const [labReports, setLabReports] = useState([])
    const [appointments, setAppointments] = useState([])
    const [billing, setBilling] = useState({ total: 0, pending: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile) fetchPatientData()
    }, [profile])

    const fetchPatientData = async () => {
        try {
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('user_id', profile.id)
                .single()

            if (patientError) {
                console.error('[PatientDashboard] Profile fetch error:', patientError)
                throw patientError
            }

            if (patientData) {
                setPatient(patientData)

                // Fetch latest vitals, prescriptions, reports, etc.
                const readings = await Promise.all([
                    supabase.from('vitals').select('*').eq('patient_id', patientData.id).order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
                    supabase.from('prescriptions').select('*, doctors(full_name)').eq('patient_id', patientData.id).order('created_at', { ascending: false }).limit(3),
                    supabase.from('lab_reports').select('*, lab_requests(test_name)').eq('patient_id', patientData.id).order('created_at', { ascending: false }).limit(3),
                    supabase.from('appointments').select('*, doctors(full_name, specialization)').eq('patient_id', patientData.id).gte('appointment_date', new Date().toISOString().split('T')[0]).order('appointment_date', { ascending: true }).limit(3),
                    supabase.from('billing').select('amount, status').eq('patient_id', patientData.id)
                ])

                setVitals(readings[0].data)
                setPrescriptions(readings[1].data || [])
                setLabReports(readings[2].data || [])
                setAppointments(readings[3].data || [])

                if (readings[4].data) {
                    const total = readings[4].data.reduce((sum, b) => sum + parseFloat(b.amount), 0)
                    const pending = readings[4].data.filter(b => b.status === 'pending').reduce((sum, b) => sum + parseFloat(b.amount), 0)
                    setBilling({ total, pending })
                }
            }
        } catch (error) {
            console.error('[PatientDashboard] Data sync error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingPage message="Refreshing your statistics..." />

    return (
        <>
            {/* Welcome Section */}
            <div className="mb-8">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Welcome back, {patient?.full_name || profile?.full_name}! 👋
                            </h1>
                            <p className="mt-1 text-blue-100 italic">
                                "{patient?.is_admitted ? `Currently admitted in ${patient.ward} - Bed ${patient.bed_number}` : 'Your health is our priority today.'}"
                            </p>
                            {patient && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                        <span className="text-xs uppercase tracking-wider opacity-70">Patient ID</span>
                                        <span className="font-bold">{patient.patient_uid}</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                        <span className="text-xs uppercase tracking-wider opacity-70">Blood Group</span>
                                        <span className="font-bold">{patient.blood_group || 'N/A'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 md:mt-0 text-right">
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                <p className="text-blue-100 text-sm mb-1 uppercase tracking-widest">Current Date</p>
                                <p className="text-xl font-bold">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Health Summary Cards */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Latest Health Readings</h2>
                    <span className="text-xs text-gray-400">Last updated: {vitals ? new Date(vitals.recorded_at).toLocaleTimeString() : 'N/A'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Blood Pressure"
                        value={vitals ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}` : '--/--'}
                        subtitle="mmHg"
                        color="red"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                    />
                    <StatsCard
                        title="Blood Sugar"
                        value={vitals?.blood_sugar ? `${vitals.blood_sugar}` : '--'}
                        subtitle="mg/dL"
                        color="yellow"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                    />
                    <StatsCard
                        title="SpO2 Level"
                        value={vitals?.spo2 ? `${vitals.spo2}%` : '--%'}
                        subtitle="Saturation"
                        color="blue"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    />
                    <StatsCard
                        title="Heart Rate"
                        value={vitals?.heart_rate ? `${vitals.heart_rate}` : '--'}
                        subtitle="bpm"
                        color="purple"
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                    />
                </div>
            </div>

            {/* Quick Links / Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* Recent Prescriptions */}
                <Card className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Recent Prescriptions</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/patient/prescriptions')}>View All</Button>
                    </div>
                    {prescriptions.length > 0 ? (
                        <div className="space-y-3 flex-1">
                            {prescriptions.map((pres) => (
                                <div key={pres.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100" onClick={() => navigate('/patient/prescriptions')}>
                                    <div>
                                        <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors uppercase text-xs tracking-wider">{pres.diagnosis || 'General'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{formatDoctorName(pres.doctors?.full_name)}</p>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            ))}
                        </div>
                    ) : <NoDataFound type="prescriptions" />}
                </Card>

                {/* Upcoming Appointments */}
                <Card className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Upcoming Visits</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/patient/appointments')}>View All</Button>
                    </div>
                    {appointments.length > 0 ? (
                        <div className="space-y-3 flex-1">
                            {appointments.map((appt) => (
                                <div key={appt.id} className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex flex-col items-center justify-center border shadow-sm">
                                        <span className="text-[10px] text-red-500 font-bold uppercase">{new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-sm font-bold text-gray-900 leading-none">{new Date(appt.appointment_date).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 text-sm">{formatDoctorName(appt.doctors?.full_name)}</p>
                                        <p className="text-[10px] text-gray-500">{appt.appointment_time}</p>
                                    </div>
                                    <StatusBadge status={appt.status} size="sm" />
                                </div>
                            ))}
                        </div>
                    ) : <NoDataFound type="appointments" />}
                </Card>

                {/* Lab Reports Summary */}
                <Card className="flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Latest Lab Reports</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/patient/reports')}>View All</Button>
                    </div>
                    {labReports.length > 0 ? (
                        <div className="space-y-3 flex-1">
                            {labReports.map((report) => (
                                <div key={report.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{report.lab_requests?.test_name || report.file_name}</p>
                                            <p className="text-[10px] text-gray-500">{new Date(report.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => navigate('/patient/reports')}>Download</Button>
                                </div>
                            ))}
                        </div>
                    ) : <NoDataFound type="reports" />}
                </Card>
            </div>

            {/* Billing Summary Banner */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2">Billing & Payments</p>
                    <h3 className="text-3xl font-bold">₹{billing.pending.toLocaleString()}</h3>
                    <p className="text-gray-400 text-sm mt-1">Pending dues to be cleared</p>
                </div>
                <div className="relative z-10 mt-6 md:mt-0 flex gap-3">
                    <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={() => navigate('/patient/billing')}>Payment History</Button>
                    <Button variant="primary" className="shadow-lg shadow-blue-500/20" onClick={() => navigate('/patient/billing')}>Pay Balance Now</Button>
                </div>
            </div>
        </>
    )
}

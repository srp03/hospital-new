import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { PageHeader } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { formatDoctorName } from '../../lib/formatters'
import toast from 'react-hot-toast'

export default function PatientAppointments() {
    const { profile } = useAuth()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [doctors, setDoctors] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [bookingDate, setBookingDate] = useState('')
    const [bookingTime, setBookingTime] = useState('')
    const [bookingReason, setBookingReason] = useState('')
    const [isBooking, setIsBooking] = useState(false)

    useEffect(() => {
        if (profile) {
            fetchAppointments()
            fetchDoctors()
        }
    }, [profile])

    const fetchDoctors = async () => {
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .order('full_name')
            if (error) throw error
            setDoctors(data || [])
        } catch (error) {
            console.error('Error fetching doctors:', error)
        }
    }

    const fetchAppointments = async () => {
        try {
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', profile.id)
                .single()

            if (patient) {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*, doctors(full_name, specialization, qualification)')
                    .eq('patient_id', patient.id)
                    .order('appointment_date', { ascending: false })

                if (error) throw error
                setAppointments(data || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleBookAppointment = async (e) => {
        e.preventDefault()
        if (!selectedDoctor || !bookingDate || !bookingTime) {
            toast.error('Please select a doctor, date, and time')
            return
        }

        try {
            setIsBooking(true)
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', profile.id)
                .single()

            if (!patient) throw new Error('Patient profile not found')

            const { error } = await supabase.from('appointments').insert({
                patient_id: patient.id,
                doctor_id: selectedDoctor.id,
                appointment_date: bookingDate,
                appointment_time: bookingTime.split(' - ')[0], // Extracts 09:00 from "09:00 - 12:00"
                reason: `Shift: ${bookingTime} | Reason: ${bookingReason}`,
                status: 'pending'
            })

            if (error) throw error

            toast.success('Appointment requested successfully! Your request is now pending approval.', {
                duration: 5000,
                icon: '⏲️'
            })
            setShowBookingModal(false)
            resetBookingForm()
            fetchAppointments()
        } catch (error) {
            console.error('Booking error:', error)
            toast.error(error.message || 'Failed to book appointment')
        } finally {
            setIsBooking(false)
        }
    }

    const resetBookingForm = () => {
        setSelectedDoctor(null)
        setBookingDate('')
        setBookingTime('')
        setBookingReason('')
        setSearchQuery('')
    }

    const shifts = [
        { id: 'Morning', label: 'Morning', time: '09:00 - 12:00' },
        { id: 'Afternoon', label: 'Afternoon', time: '13:00 - 17:00' },
        { id: 'Evening', label: 'Evening', time: '18:00 - 22:00' }
    ]

    const filteredDoctors = doctors.filter(doc =>
        doc.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const upcoming = appointments.filter(a => (a.status === 'pending' || a.status === 'confirmed' || a.status === 'scheduled') && new Date(a.appointment_date) >= new Date().setHours(0, 0, 0, 0))
    const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected' || (new Date(a.appointment_date) < new Date().setHours(0, 0, 0, 0) && a.status !== 'completed'))

    return (
        <div className="space-y-8">
            <PageHeader
                title="My Appointments"
                subtitle="Manage and track your visits with healthcare professionals"
                action={
                    <Button onClick={() => setShowBookingModal(true)}>Book New Appointment</Button>
                }
            />

            {/* Upcoming */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Upcoming Visits</h3>
                    <Badge variant="success">{upcoming.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        Array(2).fill(0).map((_, i) => <Card key={i} className="animate-pulse h-32" />)
                    ) : upcoming.length > 0 ? (
                        upcoming.map((appt) => (
                            <Card key={appt.id} className="border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {appt.doctors?.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">
                                                {formatDoctorName(appt.doctors?.full_name)}
                                            </p>
                                            <p className="text-xs text-blue-600 font-medium">{appt.doctors?.specialization}</p>
                                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(appt.appointment_date).toLocaleDateString()} at {appt.appointment_time}
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={appt.status} />
                                </div>
                                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                    <p className="text-xs text-gray-400">Reason: {appt.reason || 'General Checkup'}</p>
                                    <Button variant="outline" size="sm" className="text-red-600 border-red-100 hover:bg-red-50">Cancel</Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-2">
                            <Card className="bg-gray-50 border-dashed border-2 py-8 text-center bg-white">
                                <p className="text-gray-500">No upcoming appointments found</p>
                                <Button className="mt-4" size="sm" onClick={() => setShowBookingModal(true)}>Book New Appointment</Button>
                            </Card>
                        </div>
                    )}
                </div>
            </section>

            {/* Past */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Past Appointments</h3>
                </div>
                <Card>
                    {loading ? (
                        <LoadingTable rows={3} />
                    ) : past.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="pb-4 font-medium">Date</th>
                                        <th className="pb-4 font-medium">Doctor</th>
                                        <th className="pb-4 font-medium">Reason</th>
                                        <th className="pb-4 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {past.map((appt) => (
                                        <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 text-gray-600">
                                                {new Date(appt.appointment_date).toLocaleDateString()}
                                            </td>
                                            <td className="py-4">
                                                <p className="font-medium text-gray-900">
                                                    {formatDoctorName(appt.doctors?.full_name)}
                                                </p>
                                                <p className="text-xs text-gray-500">{appt.doctors?.specialization}</p>
                                            </td>
                                            <td className="py-4 text-gray-600 truncate max-w-[200px]">
                                                {appt.reason || '-'}
                                            </td>
                                            <td className="py-4 text-right">
                                                <StatusBadge status={appt.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <NoDataFound type="appointments" />
                    )}
                </Card>
            </section>

            {/* Booking Modal */}
            <Modal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                title="Book New Appointment"
                size="lg"
            >
                <form onSubmit={handleBookAppointment} className="space-y-6">
                    {/* Doctor Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">1. Select a Doctor</label>
                        <Input
                            placeholder="Search by name or specialty..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                        <div className="max-h-48 overflow-y-auto border rounded-xl divide-y">
                            {filteredDoctors.length > 0 ? (
                                filteredDoctors.map(doc => (
                                    <div
                                        key={doc.id}
                                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${selectedDoctor?.id === doc.id ? 'bg-blue-50 border-blue-200' : ''}`}
                                        onClick={() => setSelectedDoctor(doc)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {doc.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {formatDoctorName(doc.full_name)}
                                                </p>
                                                <p className="text-xs text-blue-600">{doc.specialization}</p>
                                            </div>
                                        </div>
                                        {selectedDoctor?.id === doc.id && (
                                            <Badge variant="primary" size="sm">Selected</Badge>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="p-4 text-center text-gray-500 text-sm">No doctors found</p>
                            )}
                        </div>
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">2. Select Date</label>
                            <Input
                                type="date"
                                value={bookingDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setBookingDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">3. Select Time Slot</label>
                            <div className="grid grid-cols-1 gap-2">
                                {shifts.map(shift => (
                                    <button
                                        key={shift.id}
                                        type="button"
                                        className={`flex justify-between items-center p-3 rounded-xl border transition-all ${bookingTime === shift.time ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50 border-gray-200'}`}
                                        onClick={() => setBookingTime(shift.time)}
                                    >
                                        <span className="font-medium text-sm">{shift.label}</span>
                                        <span className="text-xs text-gray-500">{shift.time}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">4. Reason for Visit</label>
                        <Input
                            placeholder="Describe your symptoms or reason for visiting..."
                            value={bookingReason}
                            onChange={(e) => setBookingReason(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <Button variant="outline" fullWidth onClick={() => setShowBookingModal(false)}>Cancel</Button>
                        <Button type="submit" fullWidth loading={isBooking} disabled={!selectedDoctor || !bookingDate || !bookingTime}>Confirm Booking</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

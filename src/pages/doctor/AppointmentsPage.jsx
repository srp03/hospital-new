import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card } from '../../components/ui/Card'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/layout/DashboardLayout'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import toast from 'react-hot-toast'

import { formatDoctorName } from '../../lib/formatters'

import { useDoctor } from './DoctorDashboard'

export default function DoctorAppointmentsPage() {
    const { doctor } = useDoctor()
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedAppt, setSelectedAppt] = useState(null)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (doctor) {
            fetchAppointments()
        }
    }, [doctor])

    const fetchAppointments = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('appointments')
                .select('*, patients(full_name, patient_uid, emergency_phone, age, gender)')
                .eq('doctor_id', doctor.id)
                .order('appointment_date', { ascending: false })
                .order('appointment_time', { ascending: false })

            if (error) {
                console.error('Error fetching appointments:', error)
                throw error
            }
            setAppointments(data || [])
        } catch (error) {
            console.error('Error fetching appointments:', error)
            toast.error('Failed to load appointments')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <PageHeader
                title="Appointments"
                subtitle="Manage your scheduled patient visits"
            />

            <Card>
                {loading ? (
                    <LoadingTable rows={5} />
                ) : appointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-4 font-medium">Date & Time</th>
                                    <th className="pb-4 font-medium">Patient</th>
                                    <th className="pb-4 font-medium">Reason</th>
                                    <th className="pb-4 font-medium text-center">Status</th>
                                    <th className="pb-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {appointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4">
                                            <p className="font-semibold text-gray-900">
                                                {new Date(appt.appointment_date).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-gray-500">{appt.appointment_time}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-medium text-gray-900">{appt.patients?.full_name}</p>
                                            <p className="text-xs text-gray-500">{appt.patients?.patient_uid}</p>
                                        </td>
                                        <td className="py-4 text-gray-600 max-w-xs">
                                            <p className="truncate">{appt.reason || 'Routine Checkup'}</p>
                                            {appt.rejection_reason && (
                                                <p className="text-xs text-red-500 mt-1 italic">Rejected: {appt.rejection_reason}</p>
                                            )}
                                        </td>
                                        <td className="py-4 text-center">
                                            <StatusBadge status={appt.status} />
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {appt.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="xs"
                                                            variant="success"
                                                            onClick={() => handleStatusUpdate(appt, 'confirmed')}
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="outline"
                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={() => {
                                                                setSelectedAppt(appt)
                                                                setShowRejectModal(true)
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                                                    <Button
                                                        size="xs"
                                                        variant="success"
                                                        onClick={() => handleComplete(appt)}
                                                    >
                                                        Complete
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="xs">Details</Button>
                                            </div>
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

            <Modal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false)
                    setRejectionReason('')
                    setSelectedAppt(null)
                }}
                title="Reject Appointment"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Please provide a reason for rejecting the appointment with <b>{selectedAppt?.patients?.full_name}</b>.
                    </p>
                    <Input
                        label="Reason for Rejection"
                        placeholder="e.g., Doctor unavailable, please book another slot"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                    />
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => setShowRejectModal(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            fullWidth
                            className="bg-red-600 text-white border-transparent hover:bg-red-700 disabled:opacity-50"
                            onClick={() => handleStatusUpdate(selectedAppt, 'rejected')}
                            loading={processing}
                            disabled={!rejectionReason.trim()}
                        >
                            Reject Appointment
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )

    async function handleStatusUpdate(appt, newStatus) {
        try {
            setProcessing(true)
            const updateData = { status: newStatus }
            if (newStatus === 'rejected') {
                updateData.rejection_reason = rejectionReason
            }

            const { error } = await supabase
                .from('appointments')
                .update(updateData)
                .eq('id', appt.id)

            if (error) throw error

            toast.success(`Appointment ${newStatus === 'confirmed' ? 'confirmed' : 'rejected'}`)
            setShowRejectModal(false)
            setRejectionReason('')
            setSelectedAppt(null)
            fetchAppointments()
        } catch (error) {
            console.error(error)
            toast.error('Failed to update status')
        } finally {
            setProcessing(false)
        }
    }

    async function handleComplete(appt) {
        try {
            // 1. Update appointment status
            const { error: apptError } = await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', appt.id)

            if (apptError) throw apptError

            // 2. Generate Bill
            if (doctor?.consultation_fee > 0) {
                await supabase.from('billing').insert({
                    patient_id: appt.patient_id,
                    description: `Doctor Consultation (Visit: ${new Date(appt.appointment_date).toLocaleDateString()})`,
                    category: 'consultation',
                    amount: doctor.consultation_fee,
                    status: 'pending'
                })
                toast.success('Appointment completed & bill generated')
            } else {
                toast.success('Appointment completed')
            }

            fetchAppointments()
        } catch (error) {
            console.error(error)
            toast.error('Failed to complete appointment')
        }
    }
}

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/layout/DashboardLayout'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

// Note: Reusing the PatientDetailView from DoctorDashboard.jsx would be better
// But since I'm told not to refactor working logic aggressively, I'll implement a clean version here
// or better yet, I'll extract it later. For now, let's build the listing.

// Shared components
import PatientDetailView from '../../components/shared/PatientDetailView'
import { useDoctor } from './DoctorDashboard'

export default function DoctorPatientsPage() {
    const { doctor } = useDoctor()
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        fetchPatients()
    }, [])

    const fetchPatients = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('full_name', { ascending: true })

            if (error) throw error
            setPatients(data || [])
        } catch (error) {
            console.error('Error fetching patients:', error)
            toast.error('Failed to load patients')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            return fetchPatients()
        }

        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .or(`full_name.ilike.%${searchQuery}%,patient_uid.ilike.%${searchQuery}%`)
                .order('full_name', { ascending: true })

            if (error) throw error
            setPatients(data || [])
        } catch (error) {
            console.error('Search error:', error)
            toast.error('Search failed')
        } finally {
            setLoading(false)
        }
    }

    const openDetails = (patient) => {
        setSelectedPatient(patient)
        setShowModal(true)
    }

    return (
        <div>
            <PageHeader
                title="All Patients"
                subtitle="View and manage patient health records"
            />

            <Card className="mb-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by name or Patient ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            icon={
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                    <Button onClick={handleSearch}>Search</Button>
                </div>
            </Card>

            <Card>
                {loading ? (
                    <LoadingTable rows={5} />
                ) : patients.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-4 font-medium">Patient Details</th>
                                    <th className="pb-4 font-medium">Patient ID</th>
                                    <th className="pb-4 font-medium">Age/Gender</th>
                                    <th className="pb-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-medium">
                                                        {patient.full_name?.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{patient.full_name}</p>
                                                    <p className="text-xs text-gray-500">{patient.blood_group || 'Blood Group N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-gray-600 font-mono text-xs">
                                            {patient.patient_uid}
                                        </td>
                                        <td className="py-4 text-gray-600">
                                            {patient.age}y, {patient.gender}
                                        </td>
                                        <td className="py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDetails(patient)}
                                            >
                                                View Records
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <NoDataFound type="patients" />
                )}
            </Card>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={`Patient History: ${selectedPatient?.full_name}`}
                size="lg"
            >
                {selectedPatient && (
                    <PatientDetailView
                        patient={selectedPatient}
                        doctorId={doctor?.id}
                        onClose={() => setShowModal(false)}
                    />
                )}
            </Modal>
        </div>
    )
}


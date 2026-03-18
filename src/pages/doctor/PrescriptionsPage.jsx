import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { PageHeader } from '../../components/layout/DashboardLayout'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

import { useDoctor } from './DoctorDashboard'

export default function DoctorPrescriptionsPage() {
    const { doctor } = useDoctor()
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (doctor) {
            fetchPrescriptions()
        }
    }, [doctor])

    const fetchPrescriptions = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('prescriptions')
                .select('*, patients(full_name, patient_uid)')
                .eq('doctor_id', doctor.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setPrescriptions(data || [])
        } catch (error) {
            console.error('Error fetching prescriptions:', error)
            toast.error('Failed to load prescriptions')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <PageHeader
                title="Prescriptions"
                subtitle="Historical record of all issued prescriptions"
            />

            <Card>
                {loading ? (
                    <LoadingTable rows={5} />
                ) : prescriptions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-4 font-medium">Date</th>
                                    <th className="pb-4 font-medium">Patient</th>
                                    <th className="pb-4 font-medium">Diagnosis</th>
                                    <th className="pb-4 font-medium">Medicines</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {prescriptions.map((pres) => (
                                    <tr key={pres.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-gray-600">
                                            {new Date(pres.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <p className="font-medium text-gray-900">{pres.patients?.full_name}</p>
                                            <p className="text-xs text-gray-500">{pres.patients?.patient_uid}</p>
                                        </td>
                                        <td className="py-4 text-gray-900 font-medium">
                                            {pres.diagnosis || 'General'}
                                        </td>
                                        <td className="py-4">
                                            <Badge variant="outline">
                                                {pres.medicines?.length || 0} items
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <NoDataFound type="prescriptions" />
                )}
            </Card>
        </div>
    )
}

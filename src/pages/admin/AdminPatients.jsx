import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'

export default function AdminPatients() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchPatients()
    }, [])

    const fetchPatients = async () => {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('full_name')
            if (error) throw error
            setPatients(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const filteredPatients = patients.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patient_uid.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">All Registered Patients</h2>
                <div className="w-full md:w-72">
                    <Input
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                {loading ? (
                    <LoadingTable rows={8} />
                ) : filteredPatients.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-gray-500 border-b">
                                    <th className="pb-4 font-medium">Patient Details</th>
                                    <th className="pb-4 font-medium">Patient ID</th>
                                    <th className="pb-4 font-medium">Contact</th>
                                    <th className="pb-4 font-medium">Status</th>
                                    <th className="pb-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredPatients.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                                                    {p.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{p.full_name}</p>
                                                    <p className="text-xs text-gray-500">{p.age}y, {p.gender}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 font-mono text-gray-600">{p.patient_uid}</td>
                                        <td className="py-4 text-gray-600">{p.phone || 'No phone'}</td>
                                        <td className="py-4">
                                            <Badge variant={p.is_admitted ? 'success' : 'default'}>
                                                {p.is_admitted ? 'Admitted' : 'OPD'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 text-right">
                                            <Button variant="ghost" size="sm">View History</Button>
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
        </div>
    )
}

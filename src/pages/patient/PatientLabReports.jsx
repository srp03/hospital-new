import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { PageHeader } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { formatDoctorName } from '../../lib/formatters'
import toast from 'react-hot-toast'

export default function PatientLabReports() {
    const { profile } = useAuth()
    const [labRequests, setLabRequests] = useState([])
    const [labReports, setLabReports] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile) fetchLabData()
    }, [profile])

    const fetchLabData = async () => {
        try {
            const { data: patient } = await supabase
                .from('patients')
                .select('id')
                .eq('user_id', profile.id)
                .single()

            if (patient) {
                const [requestsRes, reportsRes] = await Promise.all([
                    supabase.from('lab_requests').select('*, doctors(full_name)').eq('patient_id', patient.id).order('created_at', { ascending: false }),
                    supabase.from('lab_reports').select('*, lab_requests(test_name)').eq('patient_id', patient.id).order('created_at', { ascending: false })
                ])

                if (requestsRes.error) throw requestsRes.error
                if (reportsRes.error) throw reportsRes.error

                setLabRequests(requestsRes.data || [])
                setLabReports(reportsRes.data || [])
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load lab data')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (report) => {
        try {
            if (!report.file_url) {
                toast.error('No file URL found for this report')
                return
            }

            toast.loading('Starting download...', { id: 'download' })

            // Extract filename from the stored file_url
            const filename = report.file_url.split('/').pop()
            
            // Use the new reliable download route instead of supabase.storage
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
            const downloadUrl = `${backendUrl}/api/lab-reports/download/${filename}`

            // Trigger browser download
            const link = document.createElement('a')
            link.href = downloadUrl
            link.setAttribute('download', report.file_name || filename)
            document.body.appendChild(link)
            link.click()
            link.remove()

            toast.success('Download complete', { id: 'download' })
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download report', { id: 'download' })
        }
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Lab Reports & Requests"
                subtitle="Track your diagnostic tests and view results"
            />

            {/* Completed Reports */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Completed Reports</h3>
                    <Badge variant="success">{labReports.length}</Badge>
                </div>
                <Card>
                    {loading ? (
                        <LoadingTable rows={3} />
                    ) : labReports.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="pb-4 font-medium">Date</th>
                                        <th className="pb-4 font-medium">Test Name</th>
                                        <th className="pb-4 font-medium">Status</th>
                                        <th className="pb-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {labReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 text-gray-600">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4">
                                                <p className="font-medium text-gray-900">{report.lab_requests?.test_name || report.file_name}</p>
                                            </td>
                                            <td className="py-4">
                                                <StatusBadge status="completed" />
                                            </td>
                                            <td className="py-4 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleDownload(report)}>
                                                    Download PDF
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <NoDataFound type="reports" />
                    )}
                </Card>
            </section>

            {/* Pending Requests */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Pending Requests</h3>
                    <Badge variant="yellow">{labRequests.filter(r => r.status !== 'completed').length}</Badge>
                </div>
                <Card>
                    {loading ? (
                        <LoadingTable rows={3} />
                    ) : labRequests.filter(r => r.status !== 'completed').length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="pb-4 font-medium">Requested Date</th>
                                        <th className="pb-4 font-medium">Test Name</th>
                                        <th className="pb-4 font-medium">Doctor</th>
                                        <th className="pb-4 font-medium">Urgency</th>
                                        <th className="pb-4 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {labRequests.filter(r => r.status !== 'completed').map((req) => (
                                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 text-gray-600">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4">
                                                <p className="font-medium text-gray-900">{req.test_name}</p>
                                                <p className="text-xs text-gray-500">{req.test_type}</p>
                                            </td>
                                            <td className="py-4 text-gray-600">
                                                By {formatDoctorName(req.doctors?.full_name)}
                                            </td>
                                            <td className="py-4">
                                                <Badge variant={req.urgency === 'critical' ? 'red' : req.urgency === 'urgent' ? 'yellow' : 'default'} size="sm">
                                                    {req.urgency}
                                                </Badge>
                                            </td>
                                            <td className="py-4 text-right">
                                                <StatusBadge status={req.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <NoDataFound type="reports" />
                    )}
                </Card>
            </section>
        </div>
    )
}

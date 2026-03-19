import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card } from '../../components/ui/Card'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'

export default function LabCompletedReports() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('lab_reports')
                .select('*, patients(id, full_name, patient_uid), lab_requests(test_name, test_type)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setReports(data || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleView = (path) => {
        const { data: { publicUrl } } = supabase.storage
            .from('lab-reports')
            .getPublicUrl(path)
        window.open(publicUrl, '_blank')
    }

    const handleDownload = async (path, fileName) => {
        try {
            // Extract filename from the stored file_url (path)
            const filename = path.split('/').pop();
            
            // Use the new reliable download route instead of supabase.storage
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
            const downloadUrl = `${backendUrl}/api/lab-reports/download/${filename}`

            // Trigger browser download
            const link = document.createElement('a')
            link.href = downloadUrl
            link.setAttribute('download', fileName || filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download report')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Completed Reports</h2>
                <Badge variant="success">{reports.length} Total</Badge>
            </div>

            <Card>
                {loading ? (
                    <LoadingTable rows={5} />
                ) : reports.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-gray-500 border-b">
                                    <th className="pb-4 font-medium">Date</th>
                                    <th className="pb-4 font-medium">Patient</th>
                                    <th className="pb-4 font-medium">Test Name</th>
                                    <th className="pb-4 font-medium">Results Summary</th>
                                    <th className="pb-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-gray-600">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <p className="font-medium text-gray-900">{report.patients?.full_name}</p>
                                            <p className="text-xs text-gray-500">ID: {report.patients?.id?.slice(0, 8)}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-medium text-gray-900">{report.lab_requests?.test_name}</p>
                                            <p className="text-xs text-gray-500">{report.lab_requests?.test_type}</p>
                                        </td>
                                        <td className="py-4 text-gray-600 max-w-xs truncate">
                                            {report.results_summary || 'N/A'}
                                        </td>
                                        <td className="py-4 text-right space-x-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleView(report.file_url)}>
                                                View
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDownload(report.file_url, report.file_name)}>
                                                Download
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
        </div>
    )
}

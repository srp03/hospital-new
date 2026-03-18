import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card } from '../../components/ui/Card'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { formatDoctorName } from '../../lib/formatters'
import toast from 'react-hot-toast'

export default function LabPendingTests() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [labTech, setLabTech] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { data: tech } = await supabase
                .from('lab_technicians')
                .select('*')
                .eq('user_id', user.id)
                .single()
            setLabTech(tech)

            const { data } = await supabase
                .from('lab_requests')
                .select('*, patients(id, full_name, patient_uid, age, gender), doctors(full_name)')
                .neq('status', 'completed')
                .order('created_at', { ascending: false })

            setRequests(data || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id, status) => {
        try {
            const { error } = await supabase
                .from('lab_requests')
                .update({ status })
                .eq('id', id)

            if (error) throw error
            toast.success(`Marked as ${status}`)
            fetchData()
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Pending Lab Requests</h2>
                <Badge variant="warning">{requests.length} Active</Badge>
            </div>

            <Card>
                {loading ? (
                    <LoadingTable rows={5} />
                ) : requests.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-gray-500 border-b">
                                    <th className="pb-4 font-medium">Date</th>
                                    <th className="pb-4 font-medium">Patient</th>
                                    <th className="pb-4 font-medium">Test Name</th>
                                    <th className="pb-4 font-medium">Urgency</th>
                                    <th className="pb-4 font-medium">Status</th>
                                    <th className="pb-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-gray-600">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <p className="font-medium text-gray-900">{req.patients?.full_name}</p>
                                            <p className="text-xs text-gray-500">ID: {req.patients?.id?.slice(0, 8)}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-medium text-gray-900">{req.test_name}</p>
                                            <p className="text-xs text-gray-500">{req.test_type} (By {formatDoctorName(req.doctors?.full_name)})</p>
                                        </td>
                                        <td className="py-4">
                                            <StatusBadge status={req.urgency} />
                                        </td>
                                        <td className="py-4">
                                            <StatusBadge status={req.status} />
                                        </td>
                                        <td className="py-4 text-right space-x-2">
                                            {req.status === 'requested' && (
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'collected')}>
                                                    Collect Sample
                                                </Button>
                                            )}
                                            {(req.status === 'collected' || req.status === 'processing') && (
                                                <Button size="sm" variant="primary" onClick={() => {
                                                    setSelectedRequest(req)
                                                    setShowUploadModal(true)
                                                }}>
                                                    Upload Results
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <NoDataFound type="data" />
                )}
            </Card>

            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Complete Lab Report"
                size="md"
            >
                {selectedRequest && (
                    <UploadReportForm
                        request={selectedRequest}
                        labTechId={labTech?.id}
                        onSuccess={() => {
                            setShowUploadModal(false)
                            fetchData()
                        }}
                    />
                )}
            </Modal>
        </div>
    )
}

function UploadReportForm({ request, labTechId, onSuccess }) {
    const [file, setFile] = useState(null)
    const [fee, setFee] = useState('')
    const [summary, setSummary] = useState('')
    const [uploading, setUploading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!file || !fee) {
            toast.error('File and Fee are required')
            return
        }

        setUploading(true)
        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${request.id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('lab-reports')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Create the report - Store filePath for better durability and download support
            const { error: reportError } = await supabase.from('lab_reports').insert({
                lab_request_id: request.id,
                patient_id: request.patient_id,
                uploaded_by: labTechId,
                file_url: filePath,
                file_name: file.name,
                results_summary: summary
            })
            if (reportError) throw reportError

            // 3. Create billing entry
            const { error: billError } = await supabase.from('billing').insert({
                patient_id: request.patient_id,
                description: `Lab Test: ${request.test_name}`,
                category: 'lab',
                amount: parseFloat(fee),
                status: 'pending'
            })
            if (billError) throw billError

            // 4. Update request status
            const { error: reqError } = await supabase
                .from('lab_requests')
                .update({ status: 'completed' })
                .eq('id', request.id)
            if (reqError) throw reqError

            toast.success('Report completed and fee added to bill')
            onSuccess()
        } catch (error) {
            console.error(error)
            toast.error('Failed to complete report')
        } finally {
            setUploading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-lg">
                <p className="text-sm text-cyan-800">Completing <strong>{request.test_name}</strong> for <strong>{request.patients?.full_name}</strong></p>
            </div>

            <Input
                label="Lab Test Fee (₹)"
                type="number"
                placeholder="Enter test cost"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                required
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Report (PDF/IMAGE)</label>
                <input
                    type="file"
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Results Summary</label>
                <textarea
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
                    placeholder="Briefly describe the findings..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                />
            </div>

            <Button type="submit" loading={uploading} fullWidth>
                Complete & Bill Patient
            </Button>
        </form>
    )
}

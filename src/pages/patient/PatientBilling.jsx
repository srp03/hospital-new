import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { PageHeader } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import toast from 'react-hot-toast'
import PaymentModal from '../../components/shared/PaymentModal'
import HospitalReceipt from '../../components/shared/HospitalReceipt'
import { formatDoctorName } from '../../lib/formatters'

export default function PatientBilling() {
    const { profile } = useAuth()
    const [bills, setBills] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 })
    const [selectedBill, setSelectedBill] = useState(null)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const [patient, setPatient] = useState(null)

    useEffect(() => {
        if (profile) fetchBillingData()
    }, [profile])

    const fetchBillingData = async () => {
        try {
            const { data: patient } = await supabase
                .from('patients')
                .select('id, full_name, patient_uid, gender, date_of_birth, age')
                .eq('user_id', profile.id)
                .single()

            if (patient) {
                setPatient(patient)
                const { data, error } = await supabase
                    .from('billing')
                    .select('*')
                    .eq('patient_id', patient.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setBills(data || [])

                const total = data.reduce((sum, b) => sum + parseFloat(b.amount), 0)
                const pending = data.filter(b => b.status === 'pending').reduce((sum, b) => sum + parseFloat(b.amount), 0)
                const paid = data.filter(b => b.status === 'paid').reduce((sum, b) => sum + parseFloat(b.amount), 0)
                setStats({ total, pending, paid })
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePayBill = (bill) => {
        setSelectedBill(bill)
        setShowPaymentModal(true)
    }

    const handlePaymentSuccess = async () => {
        try {
            const { error } = await supabase
                .from('billing')
                .update({
                    status: 'paid',
                    paid_amount: parseFloat(selectedBill.amount),
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedBill.id)

            if (error) throw error

            // Update local state immediately to avoid lag
            setBills(prev => {
                const updated = prev.map(b => b.id === selectedBill.id ? { ...b, status: 'paid', paid_amount: parseFloat(selectedBill.amount) } : b)

                // Recalculate stats immediately from the updated list
                const total = updated.reduce((sum, b) => sum + parseFloat(b.amount), 0)
                const pending = updated.filter(b => b.status === 'pending').reduce((sum, b) => sum + parseFloat(b.amount), 0)
                const paidVal = updated.filter(b => b.status === 'paid').reduce((sum, b) => sum + parseFloat(b.amount), 0)
                setStats({ total, pending, paid: paidVal })

                return updated
            })

            toast.success('Payment settled successfully')
            setShowPaymentModal(false)

            // Re-fetch in background to ensure sync, but the UI is already updated
            setTimeout(() => fetchBillingData(), 1000)
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Failed to update payment status')
        }
    }

    const handleViewReceipt = (bill) => {
        setSelectedBill(bill)
        setShowReceiptModal(true)
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Bills & Payments"
                subtitle="Manage your medical invoices and payment history"
            />

            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-l-4 border-l-gray-900">
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Billed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">₹{stats.total.toLocaleString()}</p>
                </Card>
                <Card className="bg-yellow-50 border-l-4 border-l-yellow-500">
                    <p className="text-sm text-yellow-600 font-medium uppercase tracking-wider">Pending Amount</p>
                    <p className="text-3xl font-bold text-yellow-700 mt-1">₹{stats.pending.toLocaleString()}</p>
                </Card>
                <Card className="bg-green-50 border-l-4 border-l-green-500">
                    <p className="text-sm text-green-600 font-medium uppercase tracking-wider">Paid Amount</p>
                    <p className="text-3xl font-bold text-green-700 mt-1">₹{stats.paid.toLocaleString()}</p>
                </Card>
            </div>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Invoice History</h3>
                </div>
                {loading ? (
                    <LoadingTable rows={5} />
                ) : bills.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-4 font-medium">Date</th>
                                    <th className="pb-4 font-medium">Description</th>
                                    <th className="pb-4 font-medium">Category</th>
                                    <th className="pb-4 font-medium">Amount</th>
                                    <th className="pb-4 font-medium text-right">Status</th>
                                    <th className="pb-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {bills.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-gray-600">
                                            {new Date(bill.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 font-medium text-gray-900">
                                            {bill.description}
                                        </td>
                                        <td className="py-4">
                                            <Badge variant="outline" size="sm" className="capitalize">{bill.category}</Badge>
                                        </td>
                                        <td className="py-4 font-bold text-gray-900">
                                            ₹{parseFloat(bill.amount).toLocaleString()}
                                        </td>
                                        <td className="py-4 text-right">
                                            <StatusBadge status={bill.status} />
                                        </td>
                                        <td className="py-4 text-right">
                                            {bill.status === 'pending' ? (
                                                <Button variant="primary" size="sm" onClick={() => handlePayBill(bill)}>Pay Now</Button>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={() => handleViewReceipt(bill)}>Receipt</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <NoDataFound type="billing" />
                )}
            </Card>

            {stats.pending > 0 && (
                <div className="bg-blue-600 p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h4 className="text-xl font-bold">Clear your pending dues online</h4>
                        <p className="text-blue-100 mt-1">Quick, secure and hassle-free payments</p>
                    </div>
                    <Button variant="white" className="whitespace-nowrap">Pay Outstanding (₹{stats.pending.toLocaleString()})</Button>
                </div>
            )}

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                bill={selectedBill}
                onSuccess={handlePaymentSuccess}
            />

            <HospitalReceipt
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                bill={selectedBill}
                patient={patient}
            />
        </div>
    )
}

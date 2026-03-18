import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card, StatsCard } from '../../components/ui/Card'
import { Badge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import toast from 'react-hot-toast'
import HospitalReceipt from '../../components/shared/HospitalReceipt'

export default function AdminBilling() {
    const [bills, setBills] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, collected: 0, pending: 0 })
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all') // 'all', 'paid', 'pending'
    const [showAll, setShowAll] = useState(false)

    useEffect(() => {
        fetchBills()
    }, [])

    const fetchBills = async () => {
        try {
            const { data, error } = await supabase
                .from('billing')
                .select('*, patients(full_name, patient_uid)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setBills(data || [])

            const total = data.reduce((sum, b) => sum + parseFloat(b.amount), 0)
            const collected = data.filter(b => b.status === 'paid').reduce((sum, b) => sum + parseFloat(b.amount), 0)
            const pending = data.filter(b => b.status === 'pending').reduce((sum, b) => sum + parseFloat(b.amount), 0)

            setStats({ total, collected, pending })
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const markAsPaid = async (id) => {
        try {
            const { error } = await supabase
                .from('billing')
                .update({ status: 'paid', paid_amount: (bills.find(b => b.id === id).amount) })
                .eq('id', id)

            if (error) throw error
            toast.success('Bill marked as paid')
            fetchBills()
        } catch (error) {
            toast.error('Failed to update bill')
        }
    }

    // Derived State Logic
    const filteredBills = bills.filter(bill => {
        const matchesSearch = bill.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.patients?.patient_uid?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'all' ? true : bill.status === filterStatus
        return matchesSearch && matchesStatus
    })

    const displayedBills = showAll ? filteredBills : filteredBills.slice(0, 5)

    // CSV Export
    const downloadCSV = () => {
        if (!filteredBills.length) return toast.error('No data to export')

        const headers = ['Invoice ID', 'Date', 'Time', 'Patient Name', 'Patient ID', 'Description', 'Category', 'Amount', 'Status']
        const csvContent = [
            headers.join(','),
            ...filteredBills.map(b => [
                b.id,
                new Date(b.created_at).toLocaleDateString(),
                new Date(b.created_at).toLocaleTimeString(),
                `"${b.patients?.full_name || 'N/A'}"`,
                b.patients?.patient_uid || 'N/A',
                `"${b.description}"`,
                b.category,
                b.amount,
                b.status
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.setAttribute('download', `billing_export_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Receipt View
    const [selectedBill, setSelectedBill] = useState(null)
    const [showReceipt, setShowReceipt] = useState(false)

    const handleViewReceipt = (bill) => {
        setSelectedBill(bill)
        setShowReceipt(true)
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Total Revenue" value={`₹${stats.total.toLocaleString()}`} color="purple" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatsCard title="Collected" value={`₹${stats.collected.toLocaleString()}`} color="green" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatsCard title="Outstanding" value={`₹${stats.pending.toLocaleString()}`} color="red" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
            </div>

            <Card>
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Transaction Ledger</h2>
                        <Button variant="outline" size="sm">Export CSV</Button>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <div className="w-full md:w-auto flex-1 max-w-md relative">
                            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <input
                                type="text"
                                placeholder="Search by Patient Name..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                            {['all', 'paid', 'pending'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${filterStatus === status
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {status === 'pending' ? 'Unpaid' : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <LoadingTable rows={5} />
                ) : filteredBills.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-100 uppercase text-[10px] tracking-widest font-black bg-gray-50/80">
                                    <th className="py-3 px-4">Date / Time</th>
                                    <th className="py-3 px-4">Patient Name</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {displayedBills.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="py-4 px-4 text-gray-500 font-mono text-xs">
                                            {new Date(bill.created_at).toLocaleDateString()}
                                            <span className="block text-[10px] text-gray-400">{new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="font-bold text-gray-900 text-sm">{bill.patients?.full_name}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{bill.patients?.patient_uid}</p>
                                        </td>
                                        <td className="py-4 px-4 font-bold text-gray-900">
                                            ₹{parseFloat(bill.amount).toLocaleString()}
                                            <p className="text-[10px] font-normal text-gray-500 truncate max-w-[120px]">{bill.description}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <StatusBadge status={bill.status} />
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            {bill.status === 'pending' && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm font-bold text-xs py-1.5" onClick={() => markAsPaid(bill.id)}>
                                                    Collect Cash
                                                </Button>
                                            )}
                                            {bill.status === 'paid' && (
                                                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-600">
                                                    View Receipt
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Footer */}
                        {!showAll && filteredBills.length > 5 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                <button
                                    onClick={() => setShowAll(true)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all"
                                >
                                    View All Transactions ({filteredBills.length - 5} more)
                                </button>
                            </div>
                        )}

                        {showAll && (
                            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                                <button
                                    onClick={() => setShowAll(false)}
                                    className="text-xs font-bold text-gray-500 hover:text-gray-700 transition-all"
                                >
                                    Show Less
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <NoDataFound type="data" />
                )}
            </Card>
        </div>
    )
}

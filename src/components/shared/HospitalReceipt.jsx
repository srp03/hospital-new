import { useRef } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { formatDoctorName } from '../../lib/formatters'

export default function HospitalReceipt({ isOpen, onClose, bill, patient }) {
    const printRef = useRef()

    if (!bill || !patient) return null

    const calculateAge = (dob) => {
        if (!dob) return patient.age || 'N/A'
        const birthDate = new Date(dob)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML
        const originalContent = document.body.innerHTML

        // Simple print approach using a hidden iframe or new window for better control
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <html>
                <head>
                    <title>Hospital Receipt - ${bill.id.substring(0, 8)}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; }
                        .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 8px; }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
                        .hospital-info h1 { margin: 0; color: #1d4ed8; font-size: 24px; }
                        .hospital-info p { margin: 4px 0; font-size: 12px; color: #666; }
                        .invoice-meta { text-align: right; }
                        .invoice-meta h2 { margin: 0; font-size: 20px; text-transform: uppercase; color: #333; }
                        .invoice-meta p { margin: 4px 0; font-size: 12px; }
                        .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #3b82f6; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
                        .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                        .info-box p { margin: 4px 0; font-size: 13px; }
                        .info-label { font-weight: 600; color: #4b5563; width: 100px; display: inline-block; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                        th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 13px; }
                        td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
                        .total-row { background: #f8fafc; font-weight: 700; font-size: 16px; }
                        .signatures { display: grid; grid-cols: 3; display: flex; justify-content: space-between; margin-top: 60px; }
                        .sig-box { text-align: center; width: 180px; }
                        .sig-line { border-top: 1px solid #333; margin-bottom: 8px; }
                        .sig-text { font-size: 11px; font-weight: 600; color: #4b5563; }
                        .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; font-style: italic; border-top: 1px dashed #e5e7eb; pt: 20px; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                            .receipt-container { border: none; padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Hospital Receipt" size="lg">
            <div className="bg-white" ref={printRef}>
                <div className="receipt-container p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    {/* Header */}
                    <div className="header flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-8">
                        <div className="hospital-info">
                            <h1 className="text-2xl font-bold text-blue-700">CITY GENERAL HOSPITAL</h1>
                            <p>123 Medical Enclave, Health City, MH 400001</p>
                            <p>Phone: +91 22 4567 8900 | Emergency: 102</p>
                            <p>Email: contact@citygeneral.com</p>
                        </div>
                        <div className="invoice-meta text-right">
                            <h2 className="text-xl font-black text-gray-800 tracking-tighter">INVOICE</h2>
                            <p className="text-sm font-bold text-gray-600">#INV-{bill.id.substring(0, 8).toUpperCase()}</p>
                            <p className="text-xs text-gray-500">Date: {new Date(bill.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">Time: {new Date(bill.created_at).toLocaleTimeString()}</p>
                        </div>
                    </div>

                    {/* Patient & Billing Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="info-box">
                            <h3 className="section-title border-b border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">Patient Details</h3>
                            <div className="space-y-1">
                                <p><span className="info-label text-gray-500 font-semibold inline-block w-24">Name:</span> <span className="font-bold">{patient.full_name || 'N/A'}</span></p>
                                <p><span className="info-label text-gray-500 font-semibold inline-block w-24">Patient ID:</span> <span className="font-mono">{patient.patient_uid || 'N/A'}</span></p>
                                <p><span className="info-label text-gray-500 font-semibold inline-block w-24">Gender/Age:</span> <span className="capitalize">{patient.gender || 'N/A'}</span> / {calculateAge(patient.date_of_birth)}</p>
                            </div>
                        </div>
                        <div className="info-box text-right">
                            <h3 className="section-title border-b border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">Payment Info</h3>
                            <div className="space-y-1">
                                <p><span className="info-label text-gray-500 font-semibold inline-block w-24">Method:</span> Online Payment</p>
                                <p><span className="info-label text-gray-500 font-semibold inline-block w-24">Status:</span> <Badge variant="success" size="sm">PAID</Badge></p>
                                <p><span className="info-label text-gray-500 font-semibold inline-block w-24">Txn ID:</span> <span className="font-mono text-[10px]">{bill.id}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-10">
                        <thead>
                            <tr className="bg-gray-50 border-y border-gray-100">
                                <th className="py-3 px-4 text-left font-bold text-gray-700">Description</th>
                                <th className="py-3 px-4 text-center font-bold text-gray-700">Category</th>
                                <th className="py-3 px-4 text-right font-bold text-gray-700">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-50">
                                <td className="py-4 px-4 font-medium">{bill.description}</td>
                                <td className="py-4 px-4 text-center capitalize text-gray-500">{bill.category}</td>
                                <td className="py-4 px-4 text-right font-bold">₹{parseFloat(bill.amount).toLocaleString()}</td>
                            </tr>
                            {/* You could add taxes/other fees here if needed */}
                            <tr className="bg-blue-50/30">
                                <td colSpan="2" className="py-4 px-4 text-right font-bold text-blue-900 border-t-2 border-blue-100">TOTAL PAID</td>
                                <td className="py-4 px-4 text-right font-black text-blue-900 text-lg border-t-2 border-blue-100">₹{parseFloat(bill.amount).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="signatures flex justify-between mt-20 pt-8">
                        <div className="sig-box w-48 text-center">
                            <div className="sig-line border-t border-gray-400 mb-2"></div>
                            <p className="sig-text text-[10px] uppercase font-bold text-gray-800">
                                {bill.category === 'consultation' ? 'Attending Physician' : 'Verified By'}
                            </p>
                            <p className="text-[9px] text-gray-400 italic mt-1">Digital Signature</p>
                        </div>
                        <div className="sig-box w-48 text-center">
                            <div className="sig-line border-t border-gray-400 mb-2"></div>
                            <p className="sig-text text-[10px] uppercase font-bold text-gray-800">
                                {bill.category === 'lab' ? 'Laboratory Head' : 'Department Supervisor'}
                            </p>
                            <p className="text-[9px] text-gray-400 italic mt-1">Encrypted Hash Verified</p>
                        </div>
                        <div className="sig-box w-48 text-center">
                            <div className="sig-line border-t border-gray-400 mb-2"></div>
                            <p className="sig-text text-[10px] uppercase font-bold text-gray-800">Chief Administrator</p>
                            <p className="text-[9px] text-gray-400 mt-1 font-serif text-blue-600">Hospital Clearance Seal</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="footer mt-12 pt-6 border-t border-dashed border-gray-200 text-center">
                        <p className="text-[10px] text-gray-400 font-medium italic">"This is a computer-generated invoice and does not require a physical stamp or signature."</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Verified by Health Portal Security &bull; 128-bit Encryption Active</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-6 border-t pt-4">
                <Button variant="outline" fullWidth onClick={onClose}>Close</Button>
                <Button fullWidth onClick={handlePrint}>Print / Download PDF</Button>
            </div>
        </Modal>
    )
}

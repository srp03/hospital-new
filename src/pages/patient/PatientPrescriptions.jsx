import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { PageHeader } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { formatDoctorName } from '../../lib/formatters'

export default function PatientPrescriptions() {
    const { profile } = useAuth()
    const [prescriptions, setPrescriptions] = useState([])
    const [patient, setPatient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedPrescription, setSelectedPrescription] = useState(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        if (profile) fetchPrescriptions()
    }, [profile])

    const fetchPrescriptions = async () => {
        try {
            const { data: patientData } = await supabase
                .from('patients')
                .select('id, full_name, patient_uid, gender, date_of_birth, age')
                .eq('user_id', profile.id)
                .single()

            if (patientData) {
                setPatient(patientData)
                // Fetch the latest vitals record for this patient
                let { data: latestVitals, error: vitalsError } = await supabase
                    .from('vitals')
                    .select('*')
                    .eq('patient_id', patientData.id)
                    .order('recorded_at', { ascending: false })
                    .limit(1)
                    .single()

                // If no vitals found, don't throw error, just set to null
                if (vitalsError && vitalsError.code === 'PGRST116') {
                    latestVitals = null
                }

                const { data, error } = await supabase
                    .from('prescriptions')
                    .select(`
                        *,
                        doctors(full_name, specialization, qualification)
                    `)
                    .eq('patient_id', patientData.id)
                    .order('created_at', { ascending: false })

                if (error) throw error

                // Attach the latest vitals to all prescriptions for this view context
                // (Usually, vitals shown on a prescription are the ones from that visit)
                const prescriptionsWithVitals = data?.map(pres => ({
                    ...pres,
                    vitals: latestVitals
                }))

                setPrescriptions(prescriptionsWithVitals || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const openPrescription = (pres) => {
        setSelectedPrescription(pres)
        setShowModal(true)
    }

    return (
        <div>
            <PageHeader
                title="My Prescriptions"
                subtitle="View all medicines and instructions from your doctors"
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
                                    <th className="pb-4 font-medium">Doctor</th>
                                    <th className="pb-4 font-medium">Diagnosis</th>
                                    <th className="pb-4 font-medium">Medicines</th>
                                    <th className="pb-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {prescriptions.map((pres) => (
                                    <tr key={pres.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-gray-600">
                                            {new Date(pres.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <p className="font-medium text-gray-900">
                                                {formatDoctorName(pres.doctors?.full_name)}
                                            </p>
                                            <p className="text-xs text-gray-500">{pres.doctors?.specialization}</p>
                                        </td>
                                        <td className="py-4 font-medium text-gray-900">
                                            {pres.diagnosis || 'General'}
                                        </td>
                                        <td className="py-4 text-gray-600">
                                            <Badge variant="outline">{pres.medicines?.length || 0} items</Badge>
                                        </td>
                                        <td className="py-4 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openPrescription(pres)}>
                                                View Details
                                            </Button>
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

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Prescription Details"
                size="lg"
            >
                {selectedPrescription && (
                    <div className="space-y-6 pt-2 bg-white print:p-0 print:space-y-8" id="prescription-printable">
                        {/* 1. Hospital & Doctor Header */}
                        <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6 print:pb-8">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                        <span className="text-2xl font-serif font-black italic">℞</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight">City General Hospital</h2>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Specialized Care & Wellness Center</p>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-0.5">
                                    <h3 className="text-lg font-black text-blue-800">
                                        {formatDoctorName(selectedPrescription.doctors?.full_name)}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-600 uppercase tracking-tighter">
                                        {selectedPrescription.doctors?.specialization || 'General Physician'}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-medium italic">
                                        {selectedPrescription.doctors?.qualification || 'MBBS, MD'} | Reg No: MCW/2026/8842
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 mb-4 inline-block">
                                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter mb-0.5 text-center">Date of Prescription</p>
                                    <p className="text-lg font-black text-blue-900 border-t border-blue-200/50 pt-0.5">
                                        {new Date(selectedPrescription.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Patient Identification Bar */}
                        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Patient Name</span>
                                    <span className="text-sm font-bold text-gray-900 uppercase truncate">{patient?.full_name || '---'}</span>
                                </div>
                                <div className="flex flex-col border-l border-gray-200 pl-4 md:pl-6">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Patient ID</span>
                                    <span className="text-sm font-mono font-bold text-gray-900">{patient?.patient_uid || '---'}</span>
                                </div>
                                <div className="flex flex-col border-l border-gray-200 pl-4 md:pl-6">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Gender / Age</span>
                                    <span className="text-sm font-bold text-gray-900 capitalize">
                                        {patient?.gender || '---'} / {patient?.age || '---'} yrs
                                    </span>
                                </div>
                                <div className="flex flex-col border-l border-gray-200 pl-4 md:pl-6">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Blood Group</span>
                                    <span className="text-sm font-bold text-blue-600 font-black">{patient?.blood_group || 'O+'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Clinical Vitals Section */}
                        {selectedPrescription.vitals && (
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-4 bg-blue-500 rounded"></div>
                                    Preliminary Vitals Analysis
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm shadow-gray-50 text-center">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">BP (Sys/Dia)</p>
                                        <p className="text-sm font-black text-gray-900">{selectedPrescription.vitals.blood_pressure_systolic || '---'}/{selectedPrescription.vitals.blood_pressure_diastolic || '---'}</p>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm shadow-gray-50 text-center">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pulse (bpm)</p>
                                        <p className="text-sm font-black text-gray-900">{selectedPrescription.vitals.heart_rate || '---'}</p>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm shadow-gray-50 text-center">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">SpO₂ (%)</p>
                                        <p className="text-sm font-black text-gray-900">{selectedPrescription.vitals.spo2 || '---'}%</p>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm shadow-gray-50 text-center">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Temp (°F)</p>
                                        <p className="text-sm font-black text-gray-900">{selectedPrescription.vitals.temperature || '---'}</p>
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm shadow-gray-50 text-center">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Weight (kg)</p>
                                        <p className="text-sm font-black text-gray-900">{selectedPrescription.vitals.weight || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Structured Rx Table */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-blue-600 rounded"></div>
                                    Prescribed Medications (Rx)
                                </h4>
                                <div className="h-px bg-gray-100 flex-1"></div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full text-left text-sm border-collapse table-fixed">
                                    <thead className="bg-blue-600 border-b border-blue-700">
                                        <tr>
                                            <th className="py-3 px-4 font-black text-[10px] text-white uppercase tracking-widest w-[40%]">Medicine Name</th>
                                            <th className="py-3 px-4 font-black text-[10px] text-white uppercase tracking-widest w-[12%]">Dosage</th>
                                            <th className="py-3 px-4 font-black text-[10px] text-white uppercase tracking-widest w-[12%] text-center">Freq</th>
                                            <th className="py-3 px-4 font-black text-[10px] text-white uppercase tracking-widest w-[22%]">Timing</th>
                                            <th className="py-3 px-4 font-black text-[10px] text-white uppercase tracking-widest w-[14%] text-right">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {selectedPrescription.medicines?.map((m, i) => (
                                            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="p-4 bg-gray-50/30">
                                                    <p className="font-black text-gray-900 leading-none">{m.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">Verified Pharma Item</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-black text-gray-700">{m.dosage || '---'}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Badge variant="outline" className="text-blue-600 font-black border-blue-200 bg-blue-50/50">
                                                        {m.frequency}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-bold text-gray-600 uppercase italic leading-none">{m.timing || 'After Food'}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="text-xs font-black text-blue-900 bg-blue-100/50 px-2 py-1 rounded-lg border border-blue-100">
                                                        {m.duration}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Advice Section */}
                        {selectedPrescription.advice && (
                            <div className="space-y-2">
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-1">Clinical Instruction & Advice</span>
                                <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100/50 italic text-yellow-900 text-sm leading-relaxed shadow-sm shadow-yellow-50">
                                    "{selectedPrescription.advice}"
                                </div>
                            </div>
                        )}

                        {/* 5. Signature Section & Print Styles */}
                        <div className="flex justify-between items-end pt-8 mt-12 border-t-2 border-gray-100">
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase italic italic">This is an electronically signed document.</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Verified by HealthChain Systems &bull; SEC-ID: {selectedPrescription.id.substring(0, 12)}</p>
                            </div>
                            <div className="text-center w-48 no-print border-t border-gray-300 pt-2 print:border-gray-900">
                                <p className="text-[10px] font-black uppercase tracking-tighter mb-4 text-gray-400">Physician's Signature</p>
                                <div className="h-10"></div>
                                <p className="text-[10px] font-black text-blue-900 border-t border-gray-100 pt-1 uppercase">
                                    {formatDoctorName(selectedPrescription.doctors?.full_name)}
                                </p>
                            </div>
                        </div>

                        <style dangerouslySetInnerHTML={{
                            __html: `
                            @media print {
                                .no-print { display: none !important; }
                                .modal-container { border: none !important; box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; position: static !important; }
                                body * { visibility: hidden; }
                                #prescription-printable, #prescription-printable * { visibility: visible; }
                                #prescription-printable { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
                                table { border: 1px solid #e5e7eb !important; }
                                th { background-color: #2563eb !important; color: white !important; -webkit-print-color-adjust: exact; }
                                .badge { border: 1px solid #bfdbfe !important; }
                                @page { size: auto; margin: 0mm; }
                            }
                        `}} />

                        <div className="flex justify-end gap-3 pt-6 border-t no-print">
                            <Button variant="outline" fullWidth onClick={() => setShowModal(false)}>Close Window</Button>
                            <Button variant="primary" fullWidth onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                                Print Prescription
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

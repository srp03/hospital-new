import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card } from '../ui/Card'
import { Badge, StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { NoDataFound } from './EmptyState'
import { formatDoctorName } from '../../lib/formatters'
import toast from 'react-hot-toast'
import { VitalsList, PrescriptionList, LabList } from './PatientDetailLists'

export default function PatientDetailView({ patient, doctorId, appointmentId, onClose }) {
    const [activeTab, setActiveTab] = useState('vitals')
    const [vitals, setVitals] = useState([])
    const [prescriptions, setPrescriptions] = useState([])
    const [labRequests, setLabRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [doctor, setDoctor] = useState(null)

    // Forms state
    const [showVitalsForm, setShowVitalsForm] = useState(false)
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
    const [showLabRequestForm, setShowLabRequestForm] = useState(false)

    const calculateAge = (dob) => {
        if (!dob) return patient.age || '---'
        const birthDate = new Date(dob)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    useEffect(() => {
        if (patient?.id) {
            fetchPatientDetails()
        }
    }, [patient?.id])

    const fetchPatientDetails = async () => {
        try {
            const queries = [
                supabase.from('vitals').select('*').eq('patient_id', patient.id).order('recorded_at', { ascending: false }).limit(50),
                supabase.from('prescriptions').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }).limit(50),
                supabase.from('lab_requests').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }).limit(50)
            ];

            // Only fetch doctor info if doctorId is provided
            if (doctorId) {
                queries.push(supabase.from('doctors').select('*').eq('id', doctorId).single());
            }

            const results = await Promise.all(queries);
            
            setVitals(results[0].data || [])
            setPrescriptions(results[1].data || [])
            setLabRequests(results[2].data || [])
            
            if (doctorId && results[3]) {
                setDoctor(results[3].data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { id: 'vitals', label: 'Vitals', count: vitals.length },
        { id: 'prescriptions', label: 'Prescriptions', count: prescriptions.length },
        { id: 'labs', label: 'Lab Tests', count: labRequests.length },
    ]

    return (
        <div className="relative isolate flex flex-col min-h-0 bg-white print:p-0">
            {/* Clinical Header - Professional Hospital Grade */}
            <div className="border-b border-gray-100 bg-white pb-6 mb-6 print:mb-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {patient.full_name || '---'}
                            </h2>
                            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100 px-2 py-0.5 font-semibold text-xs rounded uppercase">
                                Clinical Case
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                            <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">ID:</span>
                                <span className="font-mono text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                    {patient.patient_uid || '---'}
                                </span>
                            </div>
                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">Gender:</span>
                                <span className="text-gray-900 capitalize">{patient.gender || '---'}</span>
                            </div>
                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">Age:</span>
                                <span className="text-gray-900">{calculateAge(patient.date_of_birth)} Years</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Medical Record</p>
                        <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/50">
                            <div className="text-left">
                                <p className="text-[10px] text-blue-600 font-bold leading-none uppercase">Blood Group</p>
                                <p className="text-sm font-black text-blue-900">{patient.blood_group || '---'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Only Header Info */}
                <div className="hidden print:block border-t border-gray-200 mt-6 pt-6 mb-4">
                    <div className="grid grid-cols-2 text-[10px] text-gray-500 font-medium">
                        <div>Facility: <span className="text-gray-900 font-bold">City General Hospital</span></div>
                        <div className="text-right">Generated: <span className="text-gray-900 font-bold">{new Date().toLocaleString()}</span></div>
                    </div>
                </div>
            </div>

            {/* Clinical Tabs - High Stacking Priority */}
            <div className="sticky top-0 z-50 flex gap-1 mb-8 bg-white/95 backdrop-blur-sm border-b border-gray-100 print:hidden overflow-x-auto no-scrollbar shadow-sm">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 font-bold text-xs uppercase tracking-widest transition-all relative inline-flex items-center gap-2 pointer-events-auto select-none ${activeTab === tab.id
                            ? 'text-blue-600'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)] z-10"></div>
                        )}
                    </button>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print, .print\\:hidden { display: none !important; }
                    body { background: white !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:mb-8 { margin-bottom: 2rem !important; }
                    .print\\:block { display: block !important; }
                    .print\\:border-none { border: none !important; }
                    .print\\:shadow-none { shadow: none !important; }
                    @page { margin: 2cm; }
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            {/* Tab Content - Isolated Layers */}
            <div className="relative z-0 grow">
                {activeTab === 'vitals' && (
                    <div className="animate-in fade-in duration-200">
                        <VitalsList
                            vitals={vitals}
                            showForm={showVitalsForm}
                            setShowForm={setShowVitalsForm}
                            patientId={patient.id}
                            recordedBy={doctorId}
                            fetchPatientDetails={fetchPatientDetails}
                            VitalsForm={VitalsForm}
                        />
                    </div>
                )}

                {activeTab === 'prescriptions' && (
                    <div className="animate-in fade-in duration-200">
                        <PrescriptionList
                            prescriptions={prescriptions}
                            showForm={showPrescriptionForm}
                            setShowForm={setShowPrescriptionForm}
                            patientId={patient.id}
                            doctorId={doctorId}
                            appointmentId={appointmentId}
                            doctor={doctor}
                            consultationFee={doctor?.consultation_fee}
                            fetchPatientDetails={fetchPatientDetails}
                            PrescriptionForm={PrescriptionForm}
                        />
                    </div>
                )}

                {activeTab === 'labs' && (
                    <div className="animate-in fade-in duration-200">
                        <LabList
                            labRequests={labRequests}
                            showForm={showLabRequestForm}
                            setShowForm={setShowLabRequestForm}
                            patientId={patient.id}
                            doctorId={doctorId}
                            fetchPatientDetails={fetchPatientDetails}
                            LabRequestForm={LabRequestForm}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

function VitalsForm({ patientId, recordedBy, onSuccess }) {
    const [formData, setFormData] = useState({
        systolic: '',
        diastolic: '',
        sugar: '',
        spo2: '',
        heartRate: '',
        temperature: '',
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('vitals').insert({
                patient_id: patientId,
                recorded_by: recordedBy,
                blood_pressure_systolic: parseInt(formData.systolic) || null,
                blood_pressure_diastolic: parseInt(formData.diastolic) || null,
                blood_sugar: parseFloat(formData.sugar) || null,
                spo2: parseFloat(formData.spo2) || null,
                heart_rate: parseInt(formData.heartRate) || null,
                temperature: parseFloat(formData.temperature) || null,
            })
            if (error) throw error
            toast.success('Vitals recorded')
            onSuccess()
        } catch (error) {
            toast.error('Failed to save vitals')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6 px-1">
                {/* BP Section */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Blood Pressure (Systolic/Diastolic)</label>
                    <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all p-3 shadow-sm">
                        <input
                            type="number"
                            placeholder="Systolic (120)"
                            className="w-full h-12 px-4 text-lg font-bold bg-transparent outline-none text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                            value={formData.systolic}
                            onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                        />
                        <span className="text-2xl text-gray-200 font-light mx-2">/</span>
                        <input
                            type="number"
                            placeholder="Diastolic (80)"
                            className="w-full h-12 px-4 text-lg font-bold bg-transparent outline-none text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                            value={formData.diastolic}
                            onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                        />
                    </div>
                </div>

                {/* Pulse Rate */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Pulse Rate (bpm)</label>
                    <div className="bg-white rounded-xl border-2 border-gray-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all p-3 shadow-sm">
                        <input
                            type="number"
                            placeholder="e.g. 72"
                            className="w-full h-12 px-4 text-lg font-bold bg-transparent outline-none text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                            value={formData.heartRate}
                            onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                        />
                    </div>
                </div>

                {/* Blood Sugar */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1 text-blue-700">Blood Sugar (mg/dL)</label>
                    <div className="bg-blue-50/30 rounded-xl border-2 border-blue-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all p-3 shadow-sm">
                        <input
                            type="number"
                            placeholder="e.g. 110"
                            className="w-full h-12 px-4 text-lg font-bold bg-transparent outline-none text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                            value={formData.sugar}
                            onChange={(e) => setFormData({ ...formData, sugar: e.target.value })}
                        />
                    </div>
                </div>

                {/* SpO2 */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">SpO₂ (%)</label>
                    <div className="bg-white rounded-xl border-2 border-gray-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all p-3 shadow-sm">
                        <input
                            type="number"
                            placeholder="e.g. 98"
                            className="w-full h-12 px-4 text-lg font-bold bg-transparent outline-none text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                            value={formData.spo2}
                            onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
                        />
                    </div>
                </div>

                {/* Temperature */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Temperature (°F)</label>
                    <div className="bg-white rounded-xl border-2 border-gray-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all p-3 shadow-sm">
                        <input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 98.6"
                            className="w-full h-12 px-4 text-lg font-bold bg-transparent outline-none text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                            value={formData.temperature}
                            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        />
                    </div>
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700 ml-1">Weight (kg)</label>
                    <div className="bg-white rounded-xl border-2 border-gray-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all p-3 shadow-sm">
                        <input
                            type="number"
                            placeholder="e.g. 70"
                            className="w-full h-12 px-4 text-lg font-bold bg-transparent outline-none text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
                            value={formData.weight || ''}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 print:hidden">
                <Button type="submit" loading={loading} className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm shadow-blue-200">
                    Record Clinical Vitals
                </Button>
            </div>
        </form>
    )
}

function PrescriptionForm({ patientId, doctorId, appointmentId, consultationFee, onSuccess }) {
    const [diagnosis, setDiagnosis] = useState('')
    const [advice, setAdvice] = useState('')
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', timing: 'After Food', duration: '' }])
    const [loading, setLoading] = useState(false)

    const addMedicine = () => setMedicines([...medicines, { name: '', dosage: '', frequency: '', timing: 'After Food', duration: '' }])
    const updateMedicine = (idx, field, val) => {
        const updated = [...medicines]
        updated[idx][field] = val
        setMedicines(updated)
    }
    const removeMedicine = (idx) => {
        if (medicines.length > 1) setMedicines(medicines.filter((_, i) => i !== idx))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (loading) return

        setLoading(true)
        try {
            console.log('[PrescriptionForm] Saving prescription for patient:', patientId)

            // 1. Save the prescription
            const { data, error: presError } = await supabase
                .from('prescriptions')
                .insert({
                    patient_id: patientId,
                    doctor_id: doctorId,
                    diagnosis,
                    advice,
                    medicines: medicines.filter((m) => m.name.trim()),
                })
                .select() // Get the inserted data back

            if (presError) {
                console.error('[PrescriptionForm] Database insert error:', presError)
                throw presError
            }

            const presData = data?.[0]
            if (!presData) {
                console.warn('[PrescriptionForm] No data returned from insert, but no error reported')
            }

            // 2. Success toast for the primary action
            toast.success('Prescription saved successfully')

            // 3. Optional: Auto-generate consultation bill (Isolated Logic)
            if (consultationFee && consultationFee > 0 && presData?.id) {
                try {
                    const { error: billError } = await supabase.from('billing').insert({
                        patient_id: patientId,
                        description: `Doctor Consultation Fee (Ref: ${presData.id.substring(0, 8)})`,
                        category: 'consultation',
                        amount: parseFloat(consultationFee),
                        status: 'pending'
                    })

                    if (billError) {
                        console.error('[PrescriptionForm] Billing auto-gen error:', billError)
                        toast.error('Prescription saved, but failed to generate bill record.')
                    } else {
                        toast(`Consultation fee of ₹${consultationFee} added to bill.`)
                    }
                } catch (billExcept) {
                    console.error('[PrescriptionForm] Billing exception:', billExcept)
                }
            }

            // 4. Mark appointment as completed
            try {
                let targetId = appointmentId
                if (!targetId) {
                    const { data: recentAppt } = await supabase
                        .from('appointments')
                        .select('id')
                        .eq('patient_id', patientId)
                        .eq('doctor_id', doctorId)
                        .in('status', ['scheduled', 'confirmed'])
                        .order('appointment_date', { ascending: false })
                        .limit(1)
                        .single()

                    if (recentAppt) targetId = recentAppt.id
                }

                if (targetId) {
                    await supabase
                        .from('appointments')
                        .update({ status: 'completed' })
                        .eq('id', targetId)
                }
            } catch (apptErr) {
                console.error('[PrescriptionForm] Error completing appointment:', apptErr)
            }

            onSuccess()
        } catch (error) {
            console.error('[PrescriptionForm] Main submission failure:', error)
            toast.error(error.message || 'Failed to save prescription. Please check your connection.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                <div className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-lg shadow-sm shadow-blue-200">
                    <span className="text-xl font-serif font-black italic">℞</span>
                </div>
                <div className="flex-1">
                    <input
                        className="w-full text-lg font-bold text-gray-900 border-none focus:ring-0 placeholder:text-gray-300"
                        placeholder="ENTER PROVISIONAL DIAGNOSIS..."
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
                {/* Header Row */}
                <div className="flex gap-2 px-3 py-3 bg-gray-50/80 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <div className="w-[32%] grow shrink-0">Medicine Name</div>
                    <div className="w-[14%] shrink-0 min-w-[80px]">Dosage</div>
                    <div className="w-[14%] shrink-0 min-w-[80px]">Freq</div>
                    <div className="w-[20%] shrink-0 min-w-[120px]">Timing</div>
                    <div className="w-[12%] shrink-0 min-w-[70px]">Dur</div>
                    <div className="w-[8%] shrink-0 text-center"></div>
                </div>

                {/* Medicine Rows */}
                <div className="divide-y divide-gray-50 bg-white">
                    {medicines.map((m, idx) => (
                        <div key={idx} className="flex gap-2 px-3 py-2 items-center group hover:bg-blue-50/30 transition-colors">
                            {/* Medicine Name - Grows */}
                            <div className="w-[32%] grow shrink-0">
                                <input
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-sm placeholder:font-normal"
                                    placeholder="e.g. Amoxicillin..."
                                    value={m.name}
                                    onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                                />
                            </div>

                            {/* Dosage - Fixed min width */}
                            <div className="w-[14%] shrink-0 min-w-[80px]">
                                <input
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none transition-all placeholder:font-normal"
                                    placeholder="500mg"
                                    value={m.dosage}
                                    onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                                />
                            </div>

                            {/* Frequency - Fixed min width */}
                            <div className="w-[14%] shrink-0 min-w-[80px]">
                                <input
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none transition-all placeholder:font-normal"
                                    placeholder="1-0-1"
                                    value={m.frequency}
                                    onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                                />
                            </div>

                            {/* Timing - Fixed min width */}
                            <div className="w-[20%] shrink-0 min-w-[120px]">
                                <select
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                    value={m.timing}
                                    onChange={(e) => updateMedicine(idx, 'timing', e.target.value)}
                                >
                                    <option value="After Food">After Food</option>
                                    <option value="Before Food">Before Food</option>
                                    <option value="With Food">With Food</option>
                                    <option value="Empty Stomach">Empty Stomach</option>
                                </select>
                            </div>

                            {/* Duration - Fixed min width */}
                            <div className="w-[12%] shrink-0 min-w-[70px]">
                                <input
                                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none transition-all placeholder:font-normal"
                                    placeholder="Days"
                                    value={m.duration}
                                    onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                                />
                            </div>

                            {/* Action */}
                            <div className="w-[8%] shrink-0 text-center flex justify-center">
                                <button
                                    type="button"
                                    className="text-gray-300 hover:text-red-500 p-2 transition-colors disabled:opacity-0"
                                    onClick={() => removeMedicine(idx)}
                                    disabled={medicines.length === 1}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-50/50 p-2 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={addMedicine}
                        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        ADD ANOTHER MEDICINE
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Additional Advice / Instructions</label>
                <textarea
                    className="w-full min-h-[80px] p-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all placeholder:italic"
                    placeholder="Enter patient advice, dietary restrictions, or follow-up instructions here..."
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                />
            </div>

            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100 print:hidden">
                <p className="text-xs text-blue-600 font-medium">Please review the prescription before saving. This will be visible to the patient immediately.</p>
                <Button type="submit" loading={loading} className="px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm shadow-blue-200">
                    Finalize & Save ℞
                </Button>
            </div>
        </form>
    )
}

function LabRequestForm({ patientId, doctorId, onSuccess }) {
    const [testName, setTestName] = useState('')
    const [testType, setTestType] = useState('Blood Test')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.from('lab_requests').insert({
                patient_id: patientId,
                doctor_id: doctorId,
                test_name: testName,
                test_type: testType,
                notes: notes,
                status: 'requested'
            })
            if (error) throw error
            toast.success('Lab test requested')
            onSuccess()
        } catch (error) {
            toast.error('Failed to request test')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Test Name / Investigation</label>
                    <input
                        className="w-full h-10 px-4 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none transition-all placeholder:font-normal"
                        placeholder="e.g. CBC, Lipid Profile..."
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department / Category</label>
                    <select
                        className="w-full h-10 px-4 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                        value={testType}
                        onChange={(e) => setTestType(e.target.value)}
                    >
                        <option>Blood Test</option>
                        <option>Urine Test</option>
                        <option>X-Ray</option>
                        <option>MRI</option>
                        <option>CT Scan</option>
                        <option>Biopsy</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinical Note for Technician</label>
                <textarea
                    className="w-full min-h-[100px] p-4 bg-white border border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none transition-all placeholder:italic"
                    placeholder="Provide specific instructions for the lab technician (e.g. Fasting required, collect sample from right arm...)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 print:hidden">
                <Button type="submit" loading={loading} className="px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm shadow-blue-200">
                    Send to Laboratory
                </Button>
            </div>
        </form>
    )
}

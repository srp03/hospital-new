import React from 'react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { StatusBadge } from '../ui/Badge'
import { NoDataFound } from './EmptyState'
// Note: We need to import the Forms here or ensure they are passed/available.
// For this refactor, let's assume VitalsForm, PrescriptionForm, LabRequestForm are moved here or imported.
// BUT to avoid circular dependencies if they are in PatientDetailView, we will keep them there and export/import appropriately.
// Or better, define them in the same file as sub-components before the main export default.
// Since the tool limits file splitting, I'll insert these directly into PatientDetailView.jsx above the main function.

export const VitalsList = React.memo(({ vitals, showForm, setShowForm, patientId, recordedBy, fetchPatientDetails, VitalsForm }) => (
    <div className="h-full">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white/90 backdrop-blur-[2px] z-10 py-1">
            <h4 className="font-medium">Vital Records</h4>
            <Button size="sm" onClick={() => setShowForm(true)}>
                + Add Vitals
            </Button>
        </div>
        {vitals.length > 0 ? (
            <div className="space-y-2 pr-2 custom-scrollbar pb-4">
                {vitals.slice(0, 50).map((v) => (
                    <div key={v.id} className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-100 transition-all hover:bg-gray-100/50">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">
                                {new Date(v.recorded_at).toLocaleString()}
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <div><span className="text-gray-400 font-bold text-[10px] uppercase mr-1">BP:</span> <span className="font-mono text-gray-900">{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</span></div>
                            <div><span className="text-gray-400 font-bold text-[10px] uppercase mr-1">Sugar:</span> <span className="font-mono text-gray-900">{v.blood_sugar || 'N/A'}</span></div>
                            <div><span className="text-gray-400 font-bold text-[10px] uppercase mr-1">SpO2:</span> <span className="font-mono text-gray-900">{v.spo2 || 'N/A'}%</span></div>
                            <div><span className="text-gray-400 font-bold text-[10px] uppercase mr-1">HR:</span> <span className="font-mono text-gray-900">{v.heart_rate || 'N/A'}</span></div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <NoDataFound type="vitals" />
        )}

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Vitals">
            <VitalsForm
                patientId={patientId}
                recordedBy={recordedBy}
                onSuccess={() => {
                    setShowForm(false)
                    fetchPatientDetails()
                }}
            />
        </Modal>
    </div>
))

export const PrescriptionList = React.memo(({ prescriptions, showForm, setShowForm, patientId, doctorId, appointmentId, consultationFee, fetchPatientDetails, PrescriptionForm }) => (
    <div className="h-full">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white/90 backdrop-blur-[2px] z-10 py-1">
            <h4 className="font-medium">Prescriptions</h4>
            <Button size="sm" onClick={() => setShowForm(true)}>
                + New Prescription
            </Button>
        </div>
        {prescriptions.length > 0 ? (
            <div className="space-y-2 pr-2 custom-scrollbar pb-4">
                {prescriptions.map((p) => (
                    <div key={p.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 transition-all hover:bg-gray-100/50">
                        <div className="flex justify-between">
                            <p className="font-medium text-blue-700">{p.diagnosis || 'General Checkup'}</p>
                            <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-1 rounded-full shadow-sm uppercase">
                                {new Date(p.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        {p.medicines && (
                            <div className="mt-2 space-y-1">
                                {p.medicines.map((m, i) => (
                                    <div key={i} className="text-xs text-gray-600 flex justify-between bg-white/50 p-1.5 rounded border border-gray-100">
                                        <span className="font-medium">{m.name} ({m.dosage})</span>
                                        <span className="text-blue-500 font-bold">{m.frequency} x {m.duration}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {p.advice && <p className="text-[10px] text-gray-500 mt-2 italic border-t pt-2 opacity-75">Advice: {p.advice}</p>}
                    </div>
                ))}
            </div>
        ) : (
            <NoDataFound type="prescriptions" />
        )}

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New Prescription" size="lg">
            <PrescriptionForm
                patientId={patientId}
                doctorId={doctorId}
                appointmentId={appointmentId}
                consultationFee={consultationFee}
                onSuccess={() => {
                    setShowForm(false)
                    fetchPatientDetails()
                }}
            />
        </Modal>
    </div>
))

export const LabList = React.memo(({ labRequests, showForm, setShowForm, patientId, doctorId, fetchPatientDetails, LabRequestForm }) => (
    <div className="h-full">
        <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Lab Tests</h4>
            <Button size="sm" onClick={() => setShowForm(true)}>
                + Request Test
            </Button>
        </div>
        {labRequests.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {labRequests.map((l) => (
                    <div key={l.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="font-medium">{l.test_name}</p>
                            <p className="text-xs text-gray-500">{l.test_type}</p>
                            {l.test_fee && <p className="text-xs text-green-600 font-medium mt-1">Fee: ₹{l.test_fee}</p>}
                        </div>
                        <StatusBadge status={l.status} />
                    </div>
                ))}
            </div>
        ) : (
            <NoDataFound type="reports" />
        )}

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Request Lab Test">
            <LabRequestForm
                patientId={patientId}
                doctorId={doctorId}
                onSuccess={() => {
                    setShowForm(false)
                    fetchPatientDetails()
                }}
            />
        </Modal>
    </div>
))

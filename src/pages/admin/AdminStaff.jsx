import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingTable } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import { formatDoctorName } from '../../lib/formatters'
import toast from 'react-hot-toast'

export default function AdminStaff() {
    const [doctors, setDoctors] = useState([])
    const [labTechs, setLabTechs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        try {
            const [docRes, techRes] = await Promise.all([
                supabase.from('doctors').select('*').order('full_name'),
                supabase.from('lab_technicians').select('*').order('full_name')
            ])
            setDoctors(docRes.data || [])
            setLabTechs(techRes.data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const [showModal, setShowModal] = useState(false)
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'doctor', specialization: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Add Staff Function (Admin Creation via RPC)
    const handleAddStaff = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // 1. Call Secure RPC to create user in Auth & Public tables
            const { data: userId, error: rpcError } = await supabase.rpc('create_user_with_password', {
                email: newStaff.email,
                password: newStaff.password,
                name: newStaff.name,
                role_name: newStaff.role
            })

            if (rpcError) throw rpcError

            // 2. Insert into specific table (doctors or lab_technicians) for extra details
            if (newStaff.role === 'doctor') {
                const { error: docError } = await supabase
                    .from('doctors')
                    .insert({
                        user_id: userId, // Link to the Auth/Profile ID
                        full_name: newStaff.name,
                        specialization: newStaff.specialization || 'General Physician'
                    })
                if (docError) {
                    console.error('Doctor details insert error:', docError)
                    throw docError
                }
            } else if (newStaff.role === 'lab') {
                const { error: labError } = await supabase
                    .from('lab_technicians')
                    .insert({
                        user_id: userId, // Link to the Auth/Profile ID
                        full_name: newStaff.name,
                        specialization: newStaff.specialization || 'Certified Tech'
                    })
                if (labError) {
                    console.error('Lab details insert error:', labError)
                    throw labError
                }
            }

            toast.success(`Account created for ${newStaff.name}`)
            setShowModal(false)
            setNewStaff({ name: '', email: '', password: '', role: 'doctor', specialization: '' })
            fetchStaff()

        } catch (error) {
            console.error(error)
            toast.error(error.message || 'Failed to create account')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-10">
            {/* Header Actions */}
            <div className="flex justify-end">
                <Button onClick={() => setShowModal(true)}>+ Add New Staff</Button>
            </div>

            {/* Doctors Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Registered Doctors</h2>
                    <Badge variant="primary">{doctors.length} Doctors</Badge>
                </div>
                <Card>
                    {loading ? (
                        <LoadingTable rows={4} />
                    ) : doctors.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-gray-500 border-b">
                                        <th className="pb-4 font-medium">Doctor Name</th>
                                        <th className="pb-4 font-medium">Specialization</th>
                                        <th className="pb-4 font-medium">Phone</th>
                                        <th className="pb-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {doctors.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 font-medium text-gray-900">{formatDoctorName(doc.full_name)}</td>
                                            <td className="py-4 text-gray-600">{doc.specialization}</td>
                                            <td className="py-4 text-gray-600">{doc.phone}</td>
                                            <td className="py-4 text-right">
                                                <Button variant="ghost" size="sm">Manage</Button>
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
            </div>

            {/* Lab Technicians Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Lab Technicians</h2>
                    <Badge variant="info">{labTechs.length} Staff</Badge>
                </div>
                <Card>
                    {loading ? (
                        <LoadingTable rows={4} />
                    ) : labTechs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="text-gray-500 border-b">
                                        <th className="pb-4 font-medium">Name</th>
                                        <th className="pb-4 font-medium">Qualification</th>
                                        <th className="pb-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {labTechs.map((tech) => (
                                        <tr key={tech.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 font-medium text-gray-900">{tech.full_name}</td>
                                            <td className="py-4 text-gray-600 font-mono text-xs">{tech.id.substring(0, 8)}...</td>
                                            <td className="py-4 text-right">
                                                <Button variant="ghost" size="sm">Manage</Button>
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
            </div>

            {/* Add Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Add New Staff Member</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                    value={newStaff.role}
                                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                >
                                    <option value="doctor">Doctor</option>
                                    <option value="lab">Lab Technician</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    required
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                    placeholder="e.g. Dr. Sarah Smith"
                                    value={newStaff.name}
                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                    placeholder="email@hospital.com"
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                    placeholder="Set a default password"
                                    value={newStaff.password}
                                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">This user can log in immediately with this password.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {newStaff.role === 'doctor' ? 'Specialization' : 'Qualification'}
                                </label>
                                {newStaff.role === 'doctor' ? (
                                    <select
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                        value={newStaff.specialization}
                                        onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })}
                                    >
                                        <option value="">Select Specialization</option>
                                        <option value="General Medicine">General Medicine</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Orthopedics">Orthopedics</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="Dermatology">Dermatology</option>
                                        <option value="Gynecology">Gynecology</option>
                                        <option value="Oncology">Oncology</option>
                                        <option value="Psychiatry">Psychiatry</option>
                                        <option value="ENT">ENT</option>
                                        <option value="Ophthalmology">Ophthalmology</option>
                                        <option value="Dental">Dental</option>
                                        <option value="Urology">Urology</option>
                                        <option value="Surgery">Surgery</option>
                                    </select>
                                ) : (
                                    <input
                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                                        placeholder="e.g. Certified Phlebotomist"
                                        value={newStaff.specialization}
                                        onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })}
                                    />
                                )}
                            </div>

                            <Button
                                type="submit"
                                fullWidth
                                loading={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Create Account
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

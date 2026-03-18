import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingCard } from '../../components/shared/LoadingSpinner'
import { NoDataFound } from '../../components/shared/EmptyState'
import toast from 'react-hot-toast'

export default function AdminBeds() {
    const [beds, setBeds] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBeds()
    }, [])

    const fetchBeds = async () => {
        try {
            const { data, error } = await supabase
                .from('beds')
                .select('*')
                .order('bed_number')
            if (error) throw error
            setBeds(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const toggleAvailability = async (bed) => {
        try {
            const { error } = await supabase
                .from('beds')
                .update({ is_available: !bed.is_available })
                .eq('id', bed.id)
            if (error) throw error
            toast.success(`Bed ${bed.bed_number} status updated`)
            fetchBeds()
        } catch (error) {
            toast.error('Update failed')
        }
    }

    // Group beds by type
    const bedsByType = beds.reduce((acc, bed) => {
        const type = bed.bed_type || 'General Ward'
        if (!acc[type]) acc[type] = []
        acc[type].push(bed)
        return acc
    }, {})

    // Custom order for bed types
    const typeOrder = ['ICU', 'Private', 'General', 'Emergency']
    const sortedTypes = Object.keys(bedsByType).sort((a, b) => {
        const indexA = typeOrder.indexOf(a)
        const indexB = typeOrder.indexOf(b)
        // If both are in the known order list
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        // If only a is in the list, it comes first
        if (indexA !== -1) return -1
        // If only b is in the list, it comes first
        if (indexB !== -1) return 1
        // Neither in list, sort alphabetically
        return a.localeCompare(b)
    })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Bed Management</h2>
                    <p className="text-sm text-gray-500">Manage ward capacity and availability</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="success">{beds.filter(b => b.is_available).length} Available</Badge>
                    <Badge variant="warning">{beds.filter(b => !b.is_available).length} Occupied</Badge>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <LoadingCard key={i} />)}
                </div>
            ) : beds.length > 0 ? (
                <div className="space-y-10">
                    {sortedTypes.map(type => (
                        <div key={type} className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{type}</h3>
                                <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-500">
                                    {bedsByType[type].length} Beds
                                </Badge>
                                <div className="flex-1"></div>
                                <span className="text-xs text-gray-400 font-medium">
                                    {bedsByType[type].filter(b => b.is_available).length} Free
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {bedsByType[type].map((bed) => (
                                    <Card key={bed.id} className={`border-l-4 ${bed.is_available ? 'border-l-green-500' : 'border-l-red-500'} group hover:shadow-md transition-all`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{bed.ward}</p>
                                                <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">Bed {bed.bed_number}</h3>
                                            </div>
                                            <Badge variant={bed.is_available ? 'success' : 'red'}>
                                                {bed.is_available ? 'Empty' : 'Occupied'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                {bed.is_available ? 'Sanitized & Ready' : 'Patient Admitted'}
                                            </p>
                                            <Button
                                                fullWidth
                                                variant={bed.is_available ? 'outline' : 'danger'}
                                                size="sm"
                                                onClick={() => toggleAvailability(bed)}
                                            >
                                                {bed.is_available ? 'Occupy Bed' : 'Discharge / Free'}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <NoDataFound type="data" />
            )}
        </div>
    )
}

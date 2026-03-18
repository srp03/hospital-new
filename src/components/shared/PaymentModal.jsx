import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import toast from 'react-hot-toast'

export default function PaymentModal({ isOpen, onClose, bill, onSuccess }) {
    const [step, setStep] = useState('options') // options, processing, success
    const [method, setMethod] = useState(null)
    const [countdown, setCountdown] = useState(3)

    useEffect(() => {
        if (!isOpen) {
            setStep('options')
            setMethod(null)
        }
    }, [isOpen])

    const handlePayment = (paymentMethod) => {
        setMethod(paymentMethod)
        setStep('processing')

        // Simulate payment processing delay
        setTimeout(() => {
            setStep('success')
            startSuccessCountdown()
        }, 3000)
    }

    const startSuccessCountdown = () => {
        let count = 3
        const timer = setInterval(() => {
            count -= 1
            setCountdown(count)
            if (count === 0) {
                clearInterval(timer)
                onSuccess()
            }
        }, 1000)
    }

    if (!bill) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={step === 'processing' ? () => { } : onClose}
            title={step === 'success' ? 'Payment Successful' : 'Secure Checkout'}
            size="md"
        >
            <div className="space-y-6">
                {step === 'options' && (
                    <>
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-blue-600 font-medium uppercase tracking-wider">Amount to Pay</p>
                                <p className="text-2xl font-black text-blue-900">₹{parseFloat(bill.amount).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">{bill.description}</p>
                                <p className="text-xs font-mono text-gray-400 capitalize">{bill.category}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-bold text-gray-700">Select Payment Method</p>
                            <button
                                onClick={() => handlePayment('UPI')}
                                className="w-full flex items-center justify-between p-4 border rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">UPI</div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">UPI / Google Pay / PhonePe</p>
                                        <p className="text-xs text-gray-500">Fast & Zero Charges</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>

                            <button
                                onClick={() => handlePayment('CARD')}
                                className="w-full flex items-center justify-between p-4 border rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">Credit / Debit Cards</p>
                                        <p className="text-xs text-gray-500">All Major Cards Supported</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>

                        <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" /></svg>
                            PCI-DSS Secured Payment Gateway
                        </p>
                    </>
                )}

                {step === 'processing' && (
                    <div className="py-12 flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-blue-600 font-bold">₹</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Processing Payment via {method}</h3>
                            <p className="text-gray-500 mt-2">Please do not refresh or close this window.</p>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-8 flex flex-col items-center text-center space-y-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900">Payment Received!</h3>
                            <p className="text-gray-500 mt-2">Bill for <strong>{bill.description}</strong> has been cleared.</p>
                            <p className="text-xs text-gray-400 mt-8">Redirecting back to dashboard in {countdown}s...</p>
                        </div>
                        <Button fullWidth variant="success" onClick={onSuccess}>Done</Button>
                    </div>
                )}
            </div>
        </Modal>
    )
}

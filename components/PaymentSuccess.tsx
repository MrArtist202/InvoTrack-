import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invoicesAPI } from '../api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying payment...');

    useEffect(() => {
        const verifyPayment = async () => {
            const sessionId = searchParams.get('session_id');

            if (!sessionId) {
                setStatus('error');
                setMessage('No pending payment session found.');
                return;
            }

            try {
                const result = await invoicesAPI.verifyPaymentSession(sessionId);

                if (result.success) {
                    setStatus('success');
                    setMessage('Payment confirmed! Redirecting to invoice...');
                    setTimeout(() => {
                        navigate('/invoices');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(`Payment not completed. Status: ${result.status}`);
                }
            } catch (error) {
                console.error('Verification failed:', error);
                setStatus('error');
                setMessage('Failed to verify payment. Please check your invoice status.');
            }
        };

        verifyPayment();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center animate-in fade-in">
                        <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing Payment</h2>
                        <p className="text-slate-500">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={32} className="text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                        <p className="text-slate-500 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/invoices')}
                            className="bg-slate-900 text-white px-6 py-2 rounded-xl font-semibold hover:bg-slate-800 transition-all"
                        >
                            Return to Invoices
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle size={32} className="text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Failed</h2>
                        <p className="text-slate-500 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/invoices')}
                            className="text-slate-600 hover:text-slate-900 font-semibold"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;

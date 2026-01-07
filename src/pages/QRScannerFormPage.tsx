import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { QRScanner } from '../components/QRScanner';

export const QRScannerFormPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string>('');

    const handleScan = async (result: string) => {
        try {
            // Extract form ID from QR code URL
            // Expected format: https://domain.com/f/{formId}
            const url = new URL(result);
            const pathSegments = url.pathname.split('/');

            if (pathSegments[1] === 'f' && pathSegments[2]) {
                const formId = pathSegments[2];
                navigate(`/f/${formId}`);
            } else {
                setError('Invalid form QR code. Please scan a valid form QR code.');
            }
        } catch (err) {
            setError('Invalid QR code format. Please scan a valid form QR code.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <QrCode className="h-8 w-8 text-brand-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Scan Form QR Code</h1>
                        <p className="text-gray-500">
                            Point your camera at a form QR code to access it instantly
                        </p>
                    </div>

                    <div className="mb-6">
                        <QRScanner
                            onScan={handleScan}
                            onClose={() => navigate(-1)}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-600">{error}</p>
                            <button
                                onClick={() => setError('')}
                                className="mt-2 text-sm text-red-600 underline hover:text-red-700"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-3">How to use:</h3>
                        <ol className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start">
                                <span className="bg-brand-100 text-brand-600 rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">1</span>
                                <span>Allow camera access when prompted</span>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-brand-100 text-brand-600 rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">2</span>
                                <span>Point your camera at the form's QR code</span>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-brand-100 text-brand-600 rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">3</span>
                                <span>Wait for automatic detection and redirection</span>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

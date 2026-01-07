import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { XCircle, CheckCircle, Loader } from 'lucide-react';

interface QRScannerProps {
    onScan: (decodedText: string) => Promise<void>;
    onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
    const [message, setMessage] = useState<string>('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = scanner;

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, []);

    const onScanSuccess = async (decodedText: string) => {
        if (processing) return;

        try {
            setProcessing(true);
            scannerRef.current?.pause(true); // Pause scanning while processing

            await onScan(decodedText);

            setScanResult('success');
            setMessage('Ticket verified successfully!');

            // Resume after a delay
            setTimeout(() => {
                setScanResult(null);
                setMessage('');
                setProcessing(false);
                scannerRef.current?.resume();
            }, 2000);

        } catch (error: any) {
            console.error(error);
            setScanResult('error');
            setMessage(error.message || 'Verification failed');

            // Resume after a shorter delay for errors
            setTimeout(() => {
                setScanResult(null);
                setMessage('');
                setProcessing(false);
                scannerRef.current?.resume();
            }, 2000);
        }
    };

    const onScanFailure = (error: any) => {
        // Handle scan failure, usually better to ignore frame errors to avoid log spam
        // console.warn(`Code scan error = ${error}`);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Scan Ticket</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full">
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative bg-black h-80">
                    <div id="reader" className="w-full h-full"></div>

                    {/* Overlay Feedback */}
                    {scanResult && (
                        <div className={`absolute inset-0 flex flex-col items-center justify-center z-10 bg-opacity-90 transition-all duration-300
                            ${scanResult === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {scanResult === 'success' ? (
                                <CheckCircle className="h-20 w-20 text-green-600 mb-4 animate-bounce" />
                            ) : (
                                <XCircle className="h-20 w-20 text-red-600 mb-4 animate-pulse" />
                            )}
                            <p className={`text-xl font-bold ${scanResult === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                {message}
                            </p>
                        </div>
                    )}

                    {/* Processing Spinner */}
                    {processing && !scanResult && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                            <Loader className="h-12 w-12 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {/* Footer Instructions */}
                <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
                    Point camera at the QR code ticket. <br />Ensure code is within the box.
                </div>
            </div>
        </div>
    );
};

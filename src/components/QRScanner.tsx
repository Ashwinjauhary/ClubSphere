import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { XCircle, CheckCircle, Loader } from 'lucide-react';

interface QRScannerProps {
    onScan: (decodedText: string) => Promise<void>;
    onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
    const [message, setMessage] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
        const startScanner = async () => {
            try {
                // Pass formats in constructor config
                const scanner = new Html5Qrcode("reader", {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false
                });
                scannerRef.current = scanner;

                // Try with environment camera first (back camera on mobile)
                try {
                    await scanner.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        onScanSuccess,
                        undefined
                    );
                } catch (envError) {
                    console.warn("Environment camera failed, trying user camera:", envError);

                    // Fallback to user camera (front camera)
                    try {
                        await scanner.start(
                            { facingMode: "user" },
                            {
                                fps: 10,
                                qrbox: { width: 250, height: 250 },
                                aspectRatio: 1.0
                            },
                            onScanSuccess,
                            undefined
                        );
                    } catch (userError) {
                        console.warn("User camera failed, trying any available camera:", userError);

                        // Last fallback: try any available camera
                        const devices = await Html5Qrcode.getCameras();
                        if (devices && devices.length > 0) {
                            await scanner.start(
                                devices[0].id,
                                {
                                    fps: 10,
                                    qrbox: { width: 250, height: 250 },
                                    aspectRatio: 1.0
                                },
                                onScanSuccess,
                                undefined
                            );
                        } else {
                            throw new Error("No cameras found on this device");
                        }
                    }
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                console.error("Error starting scanner:", err);
                let errorMessage = "Failed to access camera. ";

                if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
                    errorMessage += "Please grant camera permissions in your browser settings.";
                } else if (err.name === 'NotFoundError' || err.message?.includes('No cameras')) {
                    errorMessage += "No camera found on this device.";
                } else if (err.name === 'NotReadableError') {
                    errorMessage += "Camera is already in use by another application.";
                } else {
                    errorMessage += "Please ensure camera permissions are granted and try again.";
                }

                setCameraError(errorMessage);
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onScanSuccess = async (decodedText: string) => {
        if (processing) return;

        try {
            setProcessing(true);
            if (scannerRef.current) {
                await scannerRef.current.pause();
            }

            await onScan(decodedText);

            setScanResult('success');
            setMessage('Ticket verified successfully!');

            // Resume after a delay
            setTimeout(async () => {
                setScanResult(null);
                setMessage('');
                setProcessing(false);
                if (scannerRef.current) {
                    await scannerRef.current.resume();
                }
            }, 2000);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            setScanResult('error');
            setMessage(error.message || 'Verification failed');

            // Resume after a shorter delay for errors
            setTimeout(async () => {
                setScanResult(null);
                setMessage('');
                setProcessing(false);
                if (scannerRef.current) {
                    await scannerRef.current.resume();
                }
            }, 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Scan Ticket</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full transition-colors">
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>

                {/* Scanner Area */}
                <div className="relative bg-black h-80 overflow-hidden">
                    <div id="reader" className="w-full h-full"></div>

                    {/* Camera Error */}
                    {cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-black/80">
                            <XCircle className="h-16 w-16 text-red-500 mb-4" />
                            <p className="text-lg font-semibold mb-2">Camera Access Failed</p>
                            <p className="text-sm text-gray-300 mb-6">{cameraError}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Overlay Feedback */}
                    {scanResult && (
                        <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 bg-opacity-95 transition-all duration-300 backdrop-blur-sm
                            ${scanResult === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {scanResult === 'success' ? (
                                <CheckCircle className="h-20 w-20 text-green-600 mb-4 animate-[bounce_1s_infinite]" />
                            ) : (
                                <XCircle className="h-20 w-20 text-red-600 mb-4 animate-pulse" />
                            )}
                            <p className={`text-xl font-bold px-4 text-center ${scanResult === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                {message}
                            </p>
                        </div>
                    )}

                    {/* Processing Spinner */}
                    {processing && !scanResult && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 backdrop-blur-sm">
                            <Loader className="h-12 w-12 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {/* Footer Instructions */}
                <div className="p-4 bg-gray-50 text-center text-sm text-gray-500 border-t border-gray-100">
                    Point camera at the QR code ticket. <br />Keep the code within the frame.
                </div>
            </div>
        </div>
    );
};

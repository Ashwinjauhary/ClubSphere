import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { Button } from './ui/Button';

interface TicketCardProps {
    eventName: string;
    studentName: string;
    studentId: string; // Roll No or Email
    ticketCode: string; // Short code
    qrHash: string; // Full hash
    eventDate: string;
    eventLocation: string;
    status: 'registered' | 'attended' | 'cancelled';
}

export const TicketCard = ({
    eventName,
    studentName,
    studentId,
    ticketCode,
    qrHash,
    eventDate,
    eventLocation,
    status
}: TicketCardProps) => {
    const ticketRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(ticketRef.current, {
                backgroundColor: null,
                scale: 3, // Higher resolution
                logging: false,
                useCORS: true // vital for images if any
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ticket.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Ticket download failed", error);
            alert("Failed to download ticket");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div
                ref={ticketRef}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-sm w-full mx-auto relative group transform transition-all duration-300"
                style={{
                    // Ensure white background for capture even if parent changes
                    backgroundColor: '#ffffff'
                }}
            >
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                    ${status === 'attended' ? 'bg-green-100 text-green-700' :
                        status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-brand-100 text-brand-700'}`}>
                    {status}
                </div>

                {/* Ticket Header (Punch Hole Design) */}
                <div className="bg-brand-600 text-white p-6 relative">
                    <h3 className="text-xl font-bold mb-1 mr-12">{eventName}</h3>
                    <p className="text-brand-100 text-sm">Official Event Pass</p>

                    {/* Punch holes */}
                    <div className="absolute -bottom-3 left-0 w-full flex justify-between px-2">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="w-4 h-4 rounded-full bg-white -mb-2"></div>
                        ))}
                    </div>
                </div>

                {/* Ticket Body */}
                <div className="p-6 pt-8 space-y-6">

                    {/* QR Code Section */}
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="bg-white p-2 rounded-xl border-2 border-dashed border-gray-200 shadow-inner">
                            <QRCodeSVG
                                value={qrHash}
                                size={180}
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-widest">Ticket Code</p>
                            <p className="text-xl font-mono font-bold text-gray-800 tracking-wider font-variant-numeric slashed-zero">{ticketCode}</p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Calendar className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Date & Time</p>
                                <p className="text-sm font-bold text-gray-900">{format(new Date(eventDate), 'BBB p')}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <MapPin className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Venue</p>
                                <p className="text-sm font-bold text-gray-900">{eventLocation}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 -mx-6 -mb-6 p-4 text-center border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            Attendee: <span className="font-bold text-gray-900">{studentName}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{studentId}</p>
                    </div>
                </div>
            </div>

            <Button
                onClick={handleDownload}
                disabled={downloading}
                variant="outline"
                className="w-full max-w-sm flex items-center justify-center gap-2"
            >
                {downloading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Download className="h-4 w-4" />
                        Download Ticket
                    </>
                )}
            </Button>
        </div>
    );
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { QRScanner } from '../components/QRScanner';
import { ArrowLeft, QrCode, User, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceData {
    registration_id: string;
    user_name: string;
    user_email: string;
    event_title: string;
    event_date: string;
    event_location: string;
    status: 'registered' | 'attended' | 'cancelled';
    scanned_at?: string;
    already_attended: boolean;
}

export const AttendanceScannerPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [showScanner, setShowScanner] = useState(false);
    const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
    const [scanHistory, setScanHistory] = useState<AttendanceData[]>([]);

    const handleScan = async (decodedText: string) => {
        console.log("Scanned QR Code:", decodedText);

        try {
            // Step 1: Lookup Registration by QR code hash
            const { data: registration, error: regError } = await supabase
                .from('event_registrations')
                .select(`
                    id,
                    event_id,
                    user_id,
                    status,
                    events (
                        title,
                        start_date,
                        location
                    ),
                    profiles:user_id (
                        full_name,
                        email
                    )
                `)
                .eq('qr_code_hash', decodedText)
                .single();

            if (regError || !registration) {
                throw new Error('Invalid QR Code: Registration not found.');
            }

            const alreadyAttended = registration.status === 'attended';

            // Step 2: Mark as Attended (if not already)
            if (registration.status === 'registered') {
                const { error: updateError } = await supabase
                    .from('event_registrations')
                    .update({ status: 'attended' })
                    .eq('id', registration.id);

                if (updateError) throw updateError;

                // Step 3: Create Attendance Log
                await supabase.from('event_attendance').insert({
                    registration_id: registration.id,
                    scanned_by: user?.id
                });
            }

            if (registration.status === 'cancelled') {
                throw new Error('Cancelled Registration: This ticket was cancelled.');
            }

            // Extract data from query results (Supabase returns arrays for relations)
            const profile = Array.isArray(registration.profiles) ? registration.profiles[0] : registration.profiles;
            const event = Array.isArray(registration.events) ? registration.events[0] : registration.events;

            // Prepare attendance data for display
            const attendanceInfo: AttendanceData = {
                registration_id: registration.id,
                user_name: profile?.full_name || 'Unknown',
                user_email: profile?.email || '',
                event_title: event?.title || 'Unknown Event',
                event_date: event?.start_date || '',
                event_location: event?.location || 'TBA',
                status: alreadyAttended ? 'attended' : 'registered',
                scanned_at: new Date().toISOString(),
                already_attended: alreadyAttended
            };

            setAttendanceData(attendanceInfo);
            setScanHistory(prev => [attendanceInfo, ...prev.slice(0, 9)]); // Keep last 10 scans

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(error);
            throw error; // Pass back to scanner for error UI
        }
    };

    const handleNewScan = () => {
        setAttendanceData(null);
        setShowScanner(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="font-bold text-gray-900 text-lg">Attendance Scanner</h1>
                    <div className="w-10"></div> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Main Scanner Button */}
                {!attendanceData && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <QrCode className="h-12 w-12 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Event QR Code</h2>
                        <p className="text-gray-600 mb-6">
                            Scan participant QR codes to mark attendance and view event participation details
                        </p>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                            Start Scanning
                        </button>
                    </div>
                )}

                {/* Attendance Data Display */}
                {attendanceData && (
                    <div className="space-y-4">
                        {/* Success/Already Attended Banner */}
                        <div className={`rounded-2xl shadow-lg p-6 border-2 ${attendanceData.already_attended
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'bg-green-50 border-green-300'
                            }`}>
                            <div className="flex items-center gap-4">
                                {attendanceData.already_attended ? (
                                    <Clock className="h-12 w-12 text-yellow-600 flex-shrink-0" />
                                ) : (
                                    <CheckCircle className="h-12 w-12 text-green-600 flex-shrink-0" />
                                )}
                                <div>
                                    <h3 className={`text-xl font-bold ${attendanceData.already_attended ? 'text-yellow-800' : 'text-green-800'
                                        }`}>
                                        {attendanceData.already_attended
                                            ? 'Already Checked In'
                                            : 'Check-In Successful!'}
                                    </h3>
                                    <p className={`text-sm ${attendanceData.already_attended ? 'text-yellow-700' : 'text-green-700'
                                        }`}>
                                        {attendanceData.already_attended
                                            ? 'This participant was already marked as attended'
                                            : 'Attendance has been recorded'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Participant Info Card */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                                <h3 className="text-lg font-semibold mb-1">Participant Details</h3>
                                <p className="text-blue-100 text-sm">Event attendance information</p>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* User Info */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-500 font-medium">Participant Name</p>
                                        <p className="text-lg font-bold text-gray-900 truncate">{attendanceData.user_name}</p>
                                        <p className="text-sm text-gray-600 truncate">{attendanceData.user_email}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200"></div>

                                {/* Event Info */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-500 font-medium">Event</p>
                                        <p className="text-lg font-bold text-gray-900">{attendanceData.event_title}</p>
                                        {attendanceData.event_date && (
                                            <p className="text-sm text-gray-600">
                                                {format(new Date(attendanceData.event_date), 'PPP p')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-500 font-medium">Location</p>
                                        <p className="text-base font-semibold text-gray-900">{attendanceData.event_location}</p>
                                    </div>
                                </div>

                                {/* Scan Time */}
                                {attendanceData.scanned_at && (
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <p className="text-xs text-gray-500 font-medium mb-1">Scanned At</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {format(new Date(attendanceData.scanned_at), 'PPP p')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scan Another Button */}
                        <button
                            onClick={handleNewScan}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                            Scan Another QR Code
                        </button>
                    </div>
                )}

                {/* Scan History */}
                {scanHistory.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Recent Scans</h3>
                            <p className="text-sm text-gray-600">Last {scanHistory.length} scanned participants</p>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {scanHistory.map((scan, index) => (
                                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${scan.already_attended ? 'bg-yellow-100' : 'bg-green-100'
                                                }`}>
                                                {scan.already_attended ? (
                                                    <Clock className="h-5 w-5 text-yellow-600" />
                                                ) : (
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 truncate">{scan.user_name}</p>
                                                <p className="text-sm text-gray-600 truncate">{scan.event_title}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${scan.already_attended
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-green-100 text-green-700'
                                            }`}>
                                            {scan.already_attended ? 'Duplicate' : 'New'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Scanner Overlay */}
            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};

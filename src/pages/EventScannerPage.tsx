import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QRScanner } from '../components/QRScanner';
import { ArrowLeft, CheckCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export const EventScannerPage = () => {
    const { id } = useParams<{ id: string }>(); // Event ID
    const navigate = useNavigate();

    // State
    const [eventTitle, setEventTitle] = useState('');
    const [scannedLogs, setScannedLogs] = useState<any[]>([]); // Recent scans
    const [stats, setStats] = useState({ total_registered: 0, checked_in: 0 });
    const [showScanner, setShowScanner] = useState(false);

    // Initial Load
    useEffect(() => {
        if (id) {
            fetchEventInfo();
            fetchRecentLogs();
            fetchStats();
        }
    }, [id]);

    const fetchEventInfo = async () => {
        const { data } = await supabase.from('events').select('title').eq('id', id).single();
        if (data) setEventTitle(data.title);
    };

    const fetchStats = async () => {
        // Total Registered
        const { count: total } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', id)
            .eq('status', 'registered'); // or all? Usually we count all valid registrations

        // Checked In (Attended)
        const { count: attended } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', id)
            .eq('status', 'attended');

        setStats({
            total_registered: (total || 0) + (attended || 0),
            checked_in: attended || 0
        });
    };

    const fetchRecentLogs = async () => {
        try {
            // Step 1: Get attendance records with registration info
            const { data: attendanceRecords, error: attendanceError } = await supabase
                .from('event_attendance')
                .select(`
                    id,
                    scanned_at,
                    registration_id
                `)
                .order('scanned_at', { ascending: false })
                .limit(50); // Get more initially, we'll filter

            if (attendanceError) throw attendanceError;
            if (!attendanceRecords || attendanceRecords.length === 0) {
                setScannedLogs([]);
                return;
            }

            // Step 2: Get registration details from participants table
            const registrationIds = attendanceRecords.map(a => a.registration_id);
            const { data: registrations, error: regError } = await supabase
                .from('participants')
                .select('id, event_id, user_id, full_name')
                .in('id', registrationIds)
                .eq('event_id', id);

            if (regError) throw regError;
            if (!registrations || registrations.length === 0) {
                setScannedLogs([]);
                return;
            }

            // Step 3: Merge data (participants already has full_name)
            const logsWithDetails = attendanceRecords
                .map(attendance => {
                    const registration = registrations.find(r => r.id === attendance.registration_id);
                    if (!registration) return null;

                    return {
                        id: attendance.id,
                        scanned_at: attendance.scanned_at,
                        event_registrations: {
                            profiles: {
                                full_name: registration.full_name || 'Unknown',
                                email: ''
                            }
                        }
                    };
                })
                .filter(log => log !== null)
                .slice(0, 10); // Take only 10 for display

            setScannedLogs(logsWithDetails);
        } catch (error) {
            console.error('Error fetching recent logs:', error);
            setScannedLogs([]);
        }
    };

    const handleScan = async (decodedText: string) => {
        console.log("Scanned:", decodedText);
        // Logic:
        // 1. Find registration by qr_code_hash in participants table
        // 2. Verify it matches this event
        // 3. Mark as attended
        // 4. Log attendance

        try {
            // Step 1: Lookup Registration in participants table
            const { data: registration, error } = await supabase
                .from('participants')
                .select('id, event_id, user_id, qr_code_hash, role')
                .eq('qr_code_hash', decodedText)
                .single();

            if (error || !registration) throw new Error('Invalid Ticket: Not found.');

            if (registration.event_id !== id) throw new Error('Wrong Event: This ticket is for a different event.');

            // Check if already attended by looking in event_attendance table
            const { data: existingAttendance } = await supabase
                .from('event_attendance')
                .select('id')
                .eq('registration_id', registration.id)
                .maybeSingle();

            if (existingAttendance) throw new Error('Already Checked In: This ticket was already used.');

            // Step 2: Log attendance in event_attendance table
            const { error: attendanceError } = await supabase
                .from('event_attendance')
                .insert({
                    registration_id: registration.id,
                    scanned_at: new Date().toISOString()
                });

            if (attendanceError) throw attendanceError;

            // Refresh UI
            fetchStats();
            fetchRecentLogs();

            // Note: The scanner component handles the "Success" UI feedback itself based on promise resolution

        } catch (error: any) {
            console.error(error);
            throw error; // Pass back to scanner for "Error" UI
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="font-bold text-gray-900 truncate flex-1 mx-2 text-center">
                        {eventTitle || 'Event Scanner'}
                    </h1>
                    <div className="w-8"></div> {/* Spacer */}
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6 space-y-6">

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Checked In</p>
                        <p className="text-3xl font-extrabold text-green-600 mt-1">{stats.checked_in}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total</p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.total_registered}</p>
                    </div>
                </div>

                {/* Main Action */}
                <button
                    onClick={() => setShowScanner(true)}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl shadow-lg flex items-center justify-center gap-3 text-lg font-bold hover:bg-gray-800 transition-transform active:scale-95"
                >
                    <Search className="h-6 w-6" />
                    Click to Scan QR Code
                </button>

                {/* Recent Activity */}
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                        {scannedLogs.length > 0 ? (
                            scannedLogs.map((log: any) => {
                                const profile = log.event_registrations?.profiles;
                                const displayName = profile?.full_name || profile?.email || 'Unknown';

                                return (
                                    <div key={log.id || log.scanned_at} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    {displayName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(log.scanned_at), 'h:mm:ss a')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                            Verified
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No scans yet today.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scanner Overlay */}
            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => {
                        setShowScanner(false);
                        fetchStats(); // Update stats on close just in case
                    }}
                />
            )}
        </div>
    );
};

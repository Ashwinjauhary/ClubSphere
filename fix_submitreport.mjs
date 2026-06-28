import fs from 'fs';

const filePath = 'src/pages/SubmitReportPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace any types
content = content.replace(/const \[events, setEvents\] = useState<any\[\]>\(\[\]\);/g, 'const [events, setEvents] = useState<Record<string, unknown>[]>([]);');
content = content.replace(/const onSubmit = async \(data: any\) => {/g, 'const onSubmit = async (data: Record<string, unknown>) => {');
content = content.replace(/const eventDetails = events.find\(e => e.id === selectedEvent\);/, 'const eventDetails = events.find(e => e.id === selectedEvent) as Record<string, unknown>;');
content = content.replace(/const eventDetails = events.find\(e => e.id === selectedEvent\) as Record<string, any>;/, 'const eventDetails = events.find(e => e.id === selectedEvent) as Record<string, unknown>;');

// Fix exhaustive-deps by moving fetchPendingReportEvents inside
const useEffectBlock = `    useEffect(() => {
        if (!user) return;
        fetchPendingReportEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, managedClubId]);

    const fetchPendingReportEvents = async () => {`;

const newUseEffectBlock = `    useEffect(() => {
        const fetchPendingReportEvents = async () => {
            let query = supabase
                .from('events')
                .select('id, title, start_time, club_id')
                .in('status', ['approved', 'completed'])
                .lt('end_time', new Date().toISOString())
                .order('start_time', { ascending: false });

            if (managedClubId) {
                query = query.eq('club_id', managedClubId);
            }

            const { data, error } = await query;
            if (!error) setEvents(data || []);
        };
        if (!user) return;
        fetchPendingReportEvents();
    }, [user, managedClubId]);

    const _deleted_fetch = async () => {`;

content = content.replace(useEffectBlock, newUseEffectBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed SubmitReportPage');

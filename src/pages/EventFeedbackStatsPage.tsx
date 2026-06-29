import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Loader2, ArrowLeft, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const EventFeedbackStatsPage = () => {
    const { id: eventId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
     
    const [form, setForm] = useState<any>(null);
     
    const [responses, setResponses] = useState<any[]>([]);
     
    const [aggregates, setAggregates] = useState<any>({});

    useEffect(() => {
        if (eventId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    const loadData = async () => {
        try {
            // 1. Get Form Definition
            const { data: formData, error: formError } = await supabase
                .from('feedback_forms')
                .select('*')
                .eq('event_id', eventId)
                .eq('is_active', true)
                .maybeSingle();

            if (formError) throw formError;
            if (!formData) {
                setLoading(false);
                return; // No form to show stats for
            }
            setForm(formData);

            // 2. Get Responses
            const { data: responseData, error: respError } = await supabase
                .from('feedback_responses')
                .select('*')
                .eq('form_id', formData.id)
                .order('created_at', { ascending: false });

            if (respError) throw respError;
            setResponses(responseData || []);
            processStats(formData.questions, responseData || []);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load statistics.");
        } finally {
            setLoading(false);
        }
    };

     
    const processStats = (questions: any[], responseList: any[]) => {
         
        const stats: any = {};

        questions.forEach(q => {
            if (q.type === 'rating') {
                // Calculate distribution 1-5
                const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                let sum = 0;
                let count = 0;

                responseList.forEach(r => {
                    const val = r.responses[q.id];
                    if (val) {
                        dist[val as keyof typeof dist]++;
                        sum += Number(val);
                        count++;
                    }
                });

                stats[q.id] = {
                    type: 'rating',
                    avg: count ? (sum / count).toFixed(1) : 0,
                    distribution: Object.entries(dist).map(([k, v]) => ({ name: `${k} Stars`, value: v }))
                };
            } else if (q.type === 'single_choice' || q.type === 'multiple_choice') {
                 
                const counts: any = {};
                q.options?.forEach((opt: string) => counts[opt] = 0);

                responseList.forEach(r => {
                    const val = r.responses[q.id];
                    if (Array.isArray(val)) {
                        val.forEach(v => counts[v] = (counts[v] || 0) + 1);
                    } else if (val) {
                        counts[val] = (counts[val] || 0) + 1;
                    }
                });

                stats[q.id] = {
                    type: 'choice',
                    data: Object.entries(counts).map(([k, v]) => ({ name: k, value: v }))
                };
            } else if (q.type === 'text') {
                stats[q.id] = {
                    type: 'text',
                    answers: responseList.map(r => r.responses[q.id]).filter(Boolean)
                };
            }
        });

        setAggregates(stats);
    };

    const exportToExcel = () => {
        if (!responses.length) return;

        // Flatten data for CSV
        const flatData = responses.map(r => {
             
            const row: any = { Date: new Date(r.created_at).toLocaleDateString() };
             
            form.questions.forEach((q: any) => {
                row[q.label] = Array.isArray(r.responses[q.id]) ? r.responses[q.id].join(', ') : r.responses[q.id];
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
        XLSX.writeFile(workbook, `${form.title}_Responses.xlsx`);
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-600" /></div>;

    if (!form) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold">No Published Form Found</h2>
            <p className="text-gray-500">Create and publish a form to see statistics.</p>
            <Button className="mt-4" onClick={() => navigate(`/events/${eventId}/feedback-builder`)}>Create Form</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/events/${eventId}`)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{form.title} - Analytics</h1>
                            <p className="text-gray-500">{responses.length} Responses collected</p>
                        </div>
                    </div>
                    {responses.length > 0 && (
                        <Button onClick={exportToExcel} variant="outline">
                            <Download className="h-4 w-4 mr-2" /> Export Data
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {form.questions.map((q: any) => {
                        const data = aggregates[q.id];
                        if (!data) return null;

                        return (
                            <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm break-inside-avoid">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">{q.label}</h3>

                                {q.type === 'rating' && (
                                    <>
                                        <div className="flex items-end gap-2 mb-4">
                                            <span className="text-4xl font-bold text-brand-600">{data.avg}</span>
                                            <span className="text-gray-400 mb-1">/ 5 Average</span>
                                        </div>
                                        <div className="h-48 w-full" style={{ minHeight: '192px' }}>
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                <BarChart data={data.distribution}>
                                                    <XAxis dataKey="name" fontSize={12} />
                                                    <YAxis allowDecimals={false} fontSize={12} />
                                                    <Tooltip />
                                                    <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </>
                                )}

                                {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                                    <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={data.data}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {data.data.map((_: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {q.type === 'text' && (
                                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                                        {data.answers.length > 0 ? (
                                            data.answers.map((ans: string, i: number) => (
                                                <div key={i} className="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                                                    "{ans}"
                                                </div>
                                            ))
                                        ) : <p className="text-gray-400 italic">No text responses yet.</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {responses.length >= 5 && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-indigo-900 flex items-center mb-2">
                            <span className="mr-2">🧠</span> AI Summary Analysis
                        </h3>
                        <p className="text-indigo-700">
                            (AI Analysis Feature would go here: "Most students appreciated the hands-on session but found the pace slightly fast...")
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

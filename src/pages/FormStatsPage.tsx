import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Loader2, ArrowLeft, Download, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const FormStatsPage = () => {
    const { id: formId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<any>(null);
    const [responses, setResponses] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'analytics' | 'responses'>('analytics');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (formId) loadData();
    }, [formId]);

    const loadData = async () => {
        try {
            const { data: formData, error: formError } = await supabase
                .from('forms')
                .select('*')
                .eq('id', formId)
                .single();
            if (formError) throw formError;
            setForm(formData);

            const { data: respData, error: respError } = await supabase
                .from('form_responses')
                .select('*')
                .eq('form_id', formId)
                .order('submitted_at', { ascending: false });
            if (respError) throw respError;

            setResponses(respData || []);
            calculateStats(formData.questions, respData || []);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (questions: any[], resps: any[]) => {
        const result: any = {};

        questions.forEach(q => {
            if (q.type === 'rating' || q.type === 'single_choice' || q.type === 'multiple_choice') {
                const counts: any = {};
                // Initialize counts from options if available
                if (q.options) q.options.forEach((opt: string) => counts[opt] = 0);
                if (q.type === 'rating') [1, 2, 3, 4, 5].forEach(i => counts[i] = 0);

                resps.forEach(r => {
                    const ans = r.answers[q.id];
                    if (Array.isArray(ans)) {
                        ans.forEach((a: string) => counts[a] = (counts[a] || 0) + 1);
                    } else if (ans) {
                        counts[ans] = (counts[ans] || 0) + 1;
                    }
                });

                result[q.id] = {
                    type: q.type,
                    chartData: Object.entries(counts).map(([name, value]) => ({ name, value }))
                };
            } else {
                result[q.id] = {
                    type: 'text',
                    answers: resps.map(r => r.answers[q.id]).filter(Boolean)
                };
            }
        });
        setStats(result);
    };

    const exportToExcel = () => {
        if (!responses.length) return;
        const flatData = responses.map(r => {
            const row: any = {
                Submitted: new Date(r.submitted_at).toLocaleString(),
                Email: r.respondent_email || 'Anonymous'
            };
            form.questions.forEach((q: any) => {
                row[q.label] = Array.isArray(r.answers[q.id]) ? r.answers[q.id].join(', ') : r.answers[q.id];
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(flatData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Responses");
        XLSX.writeFile(wb, `${form.title}_Responses.xlsx`);
    };

    const filteredResponses = responses.filter(r => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            r.respondent_email?.toLowerCase().includes(searchLower) ||
            Object.values(r.answers).some((ans: any) =>
                String(ans).toLowerCase().includes(searchLower)
            )
        );
    });

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-brand-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/forms')} className="self-start sm:self-auto">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 break-words leading-tight">{form.title}</h1>
                            <p className="text-gray-500 flex items-center gap-2 mt-1">
                                <Users className="h-4 w-4" />
                                {responses.length} Responses
                            </p>
                        </div>
                    </div>
                    {responses.length > 0 && (
                        <div className="mt-2 md:mt-0">
                            <Button onClick={exportToExcel} variant="outline" className="w-full sm:w-auto">
                                <Download className="h-4 w-4 mr-2" /> Export to Excel
                            </Button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex gap-8">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analytics'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            📊 Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('responses')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'responses'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            📋 All Responses ({responses.length})
                        </button>
                    </nav>
                </div>

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {form.questions.map((q: any) => {
                            const data = stats[q.id];
                            if (!data) return null;

                            return (
                                <div key={q.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm break-inside-avoid">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">{q.label}</h3>

                                    {data.type === 'text' || data.type === 'textarea' || data.type === 'email' ? (
                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                            {data.answers.length ? data.answers.map((ans: string, i: number) => (
                                                <div key={i} className="bg-gray-50 p-3 rounded text-sm text-gray-700 border border-gray-100">
                                                    {ans}
                                                </div>
                                            )) : <p className="text-gray-400 italic">No responses.</p>}
                                        </div>
                                    ) : (
                                        <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                                {data.type === 'rating' ? (
                                                    <BarChart data={data.chartData}>
                                                        <XAxis dataKey="name" />
                                                        <YAxis allowDecimals={false} />
                                                        <Tooltip />
                                                        <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                ) : (
                                                    <RePieChart>
                                                        <Pie
                                                            data={data.chartData}
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {data.chartData.map((_: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </RePieChart>
                                                )}
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Responses Tab */}
                {activeTab === 'responses' && (
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <input
                                type="text"
                                placeholder="Search responses by email or answers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            />
                        </div>

                        {filteredResponses.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                                <p className="text-gray-500">No responses found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredResponses.map((response, idx) => (
                                    <div key={response.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Response #{responses.length - idx}</h3>
                                                <p className="text-sm text-gray-500">{response.respondent_email || 'Anonymous'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {format(new Date(response.submitted_at), 'MMM d, yyyy')}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {format(new Date(response.submitted_at), 'h:mm a')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {form.questions.map((q: any) => {
                                                const answer = response.answers[q.id];
                                                if (!answer) return null;

                                                return (
                                                    <div key={q.id}>
                                                        <p className="text-sm font-medium text-gray-700 mb-1">{q.label}</p>
                                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-100">
                                                            {Array.isArray(answer) ? answer.join(', ') : answer}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

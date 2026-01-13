import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

const ATTENDANCE_DATA = [
    { name: 'Sep', attendance: 120 },
    { name: 'Oct', attendance: 300 },
    { name: 'Nov', attendance: 250 },
    { name: 'Dec', attendance: 80 }, // Exam season
    { name: 'Jan', attendance: 400 }, // Fest
    { name: 'Feb', attendance: 180 },
];

const BUDGET_DATA = [
    { name: 'Coding Club', allocated: 50000, spent: 35000 },
    { name: 'Dance', allocated: 30000, spent: 28000 },
    { name: 'Music', allocated: 40000, spent: 15000 },
    { name: 'Literature', allocated: 15000, spent: 5000 },
];

import { Button } from '../components/ui/Button';
import { Download } from 'lucide-react';

export const AnalyticsPage = () => {

    const downloadReport = () => {
        // Simple CSV generation from local constant data (could be replaced with real data fetch)
        const headers = ["Month", "Attendance"];
        const rows = ATTENDANCE_DATA.map(d => `${d.name},${d.attendance}`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "clubsphere_analytics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 sm:p-8">
            <PageHeader
                title="Program Analytics"
                description="Insights into campus engagement and resource allocation."
                action={
                    <Button onClick={downloadReport} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Events', value: '42', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Attendance', value: '1,350', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Budget Utilized', value: '65%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Grants Approved', value: '₹1.8L', icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Attendance Trends */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Participation</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <LineChart data={ATTENDANCE_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="attendance"
                                    stroke="#4F46E5"
                                    strokeWidth={3}
                                    dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Budget Comparison */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Budget Allocation vs Spent</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={BUDGET_DATA} layout="vertical" barGap={0} barSize={20}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="allocated" name="Allocated" fill="#E5E7EB" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="spent" name="Spent" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

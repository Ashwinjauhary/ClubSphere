import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Medal, Crown, Zap } from 'lucide-react';

export const LeaderboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<Record<string, unknown>[]>([]);
    const [period, setPeriod] = useState<'weekly' | 'all_time'>('weekly');

    useEffect(() => {
        fetchLeaderboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const orderBy = period === 'weekly' ? 'weekly_xp' : 'xp';

            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, xp, level, weekly_xp')
                .order(orderBy, { ascending: false })
                .limit(50); // Top 50

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Top Performers</h1>
                    <p className="text-gray-500">Compete for glory and rewards!</p>
                </div>

                <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                    <button
                        onClick={() => setPeriod('weekly')}
                        className={`px-4 py-2 rounded-md transition-all ${period === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setPeriod('all_time')}
                        className={`px-4 py-2 rounded-md transition-all ${period === 'all_time' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        All Time
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-600" /></div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                                <tr>
                                    <th className="px-3 sm:px-6 py-4 w-10 sm:w-16 text-center text-[10px] sm:text-xs">Rank</th>
                                    <th className="px-3 sm:px-6 py-4 text-[10px] sm:text-xs">Student</th>
                                    <th className="hidden sm:table-cell px-6 py-4 text-center">Level</th>
                                    <th className="px-3 sm:px-6 py-4 text-right text-[10px] sm:text-xs">XP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user, index) => (
                                    <tr key={user.id} className={`group hover:bg-gray-50 transition-colors ${index < 3 ? 'bg-yellow-50/30' : ''}`}>
                                        <td className="px-3 sm:px-6 py-4 text-center">
                                            {index === 0 && <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mx-auto fill-yellow-500" />}
                                            {index === 1 && <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mx-auto" />}
                                            {index === 2 && <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700 mx-auto" />}
                                            {index > 2 && <span className="text-gray-400 font-bold block w-5 sm:w-6 mx-auto text-sm sm:text-base">#{index + 1}</span>}
                                        </td>
                                        <td className="px-3 sm:px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold mr-2 sm:mr-4 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                                    {user.avatar_url ? (
                                                        <img loading="lazy" decoding="async" src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        user.full_name?.charAt(0) || 'U'
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-gray-900 text-sm sm:text-base truncate">{user.full_name || 'Anonymous'}</div>
                                                    {index === 0 && <div className="text-[10px] sm:text-xs text-yellow-600 font-medium truncate">Champion</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                                                Lvl {user.level || 1}
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-4 text-right">
                                            <div className="flex items-center justify-end font-mono font-bold text-gray-900 text-sm sm:text-base">
                                                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mr-1 fill-yellow-500" />
                                                {period === 'weekly' ? user.weekly_xp || 0 : user.xp || 0}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {users.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            No data available yet. Be the first to take a quiz!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

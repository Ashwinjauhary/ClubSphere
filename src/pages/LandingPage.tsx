import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Calendar, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ParticlesBackground } from '../components/ui/ParticlesBackground';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        // Don't auto-redirect if there is any hash (potential auth flow)
        if (window.location.hash && window.location.hash.length > 1) return;

        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-brand-600 selection:text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b-2 border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-brand-600 tracking-tighter uppercase">ClubSphere</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-base font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wide"
                        >
                            Log in
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-base font-bold hover:bg-brand-700 transition-all shadow-[0_4px_0_0_#0369a1] hover:shadow-[0_2px_0_0_#0369a1] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="pt-40 pb-24 px-6 max-w-7xl mx-auto text-center relative">
                {/* Particles Layer */}
                <div className="absolute inset-0 z-0">
                    <ParticlesBackground />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative z-10"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border-2 border-blue-100 text-blue-700 text-sm font-extrabold uppercase tracking-wide mb-10">
                        <span className="flex h-3 w-3 rounded-full bg-blue-600 shadow-sm animate-pulse"></span>
                        v4.0 Platform Live
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.9]">
                        Manage your club <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-500">like a pro.</span>
                    </h1>

                    <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-500 mb-12 leading-relaxed font-medium">
                        The definitive platform for student organizations. <br />
                        Streamline memberships, events, and approvals with <span className="text-slate-900 font-bold underline decoration-brand-400 decoration-4 underline-offset-4">power & precision.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <button
                            onClick={() => navigate('/register')}
                            className="px-10 py-5 bg-brand-600 text-white text-lg font-bold rounded-2xl hover:bg-brand-700 transition-all shadow-[0_6px_0_0_#0369a1] hover:shadow-[0_3px_0_0_#0369a1] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px] flex items-center gap-3"
                        >
                            Start Free Trial <ArrowRight className="h-6 w-6" />
                        </button>
                        <button
                            className="px-10 py-5 bg-white text-slate-700 border-2 border-slate-200 text-lg font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            View Demo
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Features Grid */}
            <div className="py-32 bg-slate-50 border-t-2 border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">Everything you need. <span className="text-brand-600">Nothing you don't.</span></h2>
                        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">Built for high-performance student organizations that demand speed and reliability.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            {
                                icon: Users,
                                title: "Member Directory",
                                description: "Centralize your roster. Track roles, status, and join dates with zero friction.",
                                color: "text-blue-600 bg-blue-100",
                                border: "border-blue-100 hover:border-blue-300"
                            },
                            {
                                icon: Calendar,
                                title: "Event Management",
                                description: "Schedule, approve, and launch events faster than ever with automated workflows.",
                                color: "text-purple-600 bg-purple-100",
                                border: "border-purple-100 hover:border-purple-300"
                            },
                            {
                                icon: TrendingUp,
                                title: "Analytics",
                                description: "Data-driven decisions. Visualize growth, engagement, and retention in real-time.",
                                color: "text-green-600 bg-green-100",
                                border: "border-green-100 hover:border-green-300"
                            }
                        ].map((feature, i) => (
                            <div key={i} className={`bg-white p-10 rounded-[2rem] border-2 ${feature.border} shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-2`}>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t-2 border-slate-100 py-16">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">ClubSphere</span>
                    </div>
                    <p className="text-slate-500 font-medium">
                        © 2026 ClubSphere. Crafted for leaders.
                    </p>
                </div>
            </footer>
        </div>
    );
};

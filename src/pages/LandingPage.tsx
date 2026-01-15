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
                        Streamline memberships, events, and approvals with <span className="text-slate-900 font-bold">power & precision.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <button
                            onClick={() => navigate('/register')}
                            className="px-10 py-5 bg-brand-600 text-white text-lg font-bold rounded-2xl hover:bg-brand-700 transition-all shadow-[0_6px_0_0_#0369a1] hover:shadow-[0_3px_0_0_#0369a1] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px] flex items-center gap-3"
                        >
                            Start Free Trial <ArrowRight className="h-6 w-6" />
                        </button>
                        <a
                            href="#mobile-app"
                            className="px-10 py-5 bg-white text-slate-700 border-2 border-slate-200 text-lg font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
                        >
                            <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.523 15.3414C17.523 15.3414 17.5605 15.3414 17.5605 15.3414C17.5605 15.3414 17.5605 15.3414 17.523 15.3414ZM6.47698 15.3414C6.43841 15.3414 6.43841 15.3414 6.47698 15.3414ZM12.0005 24C12.0005 24 12.0005 24 12.0005 24C12.0005 24 12.0005 24 12.0005 24ZM3.53503 12.2731L6.77253 14.1378L2.06203 16.8528L2.03953 16.8143L2.02953 16.8293L2.00203 9.61528L3.53503 12.2731ZM17.2275 14.1378L20.465 12.2731L21.998 9.61528L21.9705 16.8373L21.9605 16.8223L21.938 16.8598L17.2275 14.1378ZM12.0005 17.1423L7.75053 14.6938L12.0005 22.0526L16.2505 14.6938L12.0005 17.1423ZM4.06203 8.70528L10.7415 12.5533L12.0005 14.7333L13.2595 12.5533L19.939 8.70528L12.0005 0L4.06203 8.70528Z" />
                            </svg>
                            Get App
                        </a>
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

            {/* Mobile App Section */}
            <div id="mobile-app" className="py-24 bg-white border-t-2 border-slate-100 overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border-2 border-brand-100 text-brand-700 text-sm font-extrabold uppercase tracking-wide mb-6">
                            <span className="flex h-3 w-3 rounded-full bg-brand-600 shadow-sm animate-pulse"></span>
                            Now on Android
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">
                            Club management <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">in your pocket.</span>
                        </h2>
                        <p className="text-xl text-slate-500 font-medium mb-10 leading-relaxed">
                            Stay connected with your club wherever you go. Get real-time notifications, approve requests, and manage events directly from your phone.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a
                                href="https://xmufhhfsaqtidszsrgfm.supabase.co/storage/v1/object/public/apk-releases/application-02529e79-9288-485c-b3ea-8b95ed13632a.apk"
                                download="ClubSphere.apk"
                                className="px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-xl hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3"
                            >
                                <svg className="w-8 h-8 text-brand-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm14.25 6.75a.75.75 0 01-.75.75h-.9a.75.75 0 01-.75-.75v-.9a.75.75 0 01.75-.75h.9a.75.75 0 01.75.75v.9zm-8.25-.75a.75.75 0 00-.75.75v.9c0 .414.336.75.75.75h.9a.75.75 0 00.75-.75v-.9a.75.75 0 00-.75-.75h-.9zM6 16.5a.75.75 0 01.75-.75h.9a.75.75 0 01.75.75v.9a.75.75 0 01-.75.75h-.9a.75.75 0 01-.75-.75v-.9z" clipRule="evenodd" />
                                </svg>
                                <div className="text-left leading-none">
                                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Download for</div>
                                    <span className="text-xl">Android</span>
                                </div>
                            </a>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand-600/10 blur-[100px] rounded-full"></div>
                        <div className="relative z-10 aspect-video bg-slate-900 rounded-3xl shadow-2xl border-4 border-slate-900 flex items-center justify-center overflow-hidden transform md:rotate-3 md:hover:rotate-0 transition-all duration-500">
                            {/* Mockup Content */}
                            <div className="text-center p-10">
                                <Users className="h-20 w-20 text-brand-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-2">ClubSphere Mobile</h3>
                                <p className="text-slate-400">Experience the power of V4.0</p>
                            </div>
                        </div>
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

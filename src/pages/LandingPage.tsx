import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Calendar, TrendingUp, Shield, Download, Smartphone, Zap, Bell, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

import mobileMockup from '../assets/mobile_mockup.png';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const features = [
        {
            icon: Users,
            title: "Club Management",
            description: "Easily manage club members, roles, and activities from a centralized dashboard.",
            color: "text-blue-500",
            bg: "bg-blue-50"
        },
        {
            icon: Calendar,
            title: "Event Planning",
            description: "Create, manage, and track events with approval workflows and attendance tracking.",
            color: "text-purple-500",
            bg: "bg-purple-50"
        },
        {
            icon: TrendingUp,
            title: "Analytics & Reports",
            description: "Generate insights and reports to measure club performance and engagement.",
            color: "text-emerald-500",
            bg: "bg-emerald-50"
        }
    ];

    const mobileFeatures = [
        { icon: Bell, text: "Real-time Push Notifications" },
        { icon: Smartphone, text: "Native Android Experience" },
        { icon: Zap, text: "Instant Offline Access" },
        { icon: CheckCircle2, text: "Quick QR Check-ins" }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar */}
            <nav className="fixed w-full z-50 glass border-b border-white/20 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-brand-600 p-2 rounded-xl">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-purple-600">
                            ClubSphere
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl -z-10 animate-pulse" />
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl -z-10 animate-float" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-semibold mb-6">
                            🚀 The Future of Campus Management
                        </span>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
                            Manage Clubs <br className="hidden sm:block" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600">
                                Like a Pro
                            </span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                            ClubSphere allows you to streamline operations, approve events instantly, and engage students with a beautifully designed platform.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate('/register')}
                                className="px-8 py-4 bg-brand-600 text-white rounded-xl font-semibold shadow-xl shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Get Started Free <ArrowRight className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="h-5 w-5" /> Download App
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Features Grid (Bento Style) */}
            <div className="py-20 px-4 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all"
                        >
                            <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-6`}>
                                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Download App Section */}
            <div id="download" className="py-24 bg-gray-900 text-white relative overflow-hidden mt-auto">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="text-brand-400 font-bold tracking-wider uppercase text-sm">Mobile First</span>
                            <h2 className="text-3xl sm:text-5xl font-bold mt-2 mb-6">
                                Experience ClubSphere <br /> on the Go
                            </h2>
                            <p className="text-gray-400 text-lg mb-8">
                                Download our native Android application for the best experience. receive instant notifications, check-in to events with QR codes, and manage your club from anywhere.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                {mobileFeatures.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg">
                                            <item.icon className="h-5 w-5 text-brand-400" />
                                        </div>
                                        <span className="font-medium">{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
                                onClick={() => window.open('https://xmufhhfsaqtidszsrgfm.supabase.co/storage/v1/object/public/apk-releases/application-02529e79-9288-485c-b3ea-8b95ed13632a.apk', '_blank')}
                            >
                                <Download className="h-6 w-6" />
                                <span>Download APK (v1.0)</span>
                            </button>
                            <p className="mt-4 text-xs text-gray-500">
                                * Requires Android 8.0 or higher.
                            </p>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/30 to-purple-500/30 blur-3xl rounded-full" />
                            {/* Placeholder for Phone Mockup - You can replace this with an Image later */}
                            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                                <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
                                <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                                <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                                <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                                <div className="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white dark:bg-gray-800">
                                    <img src={mobileMockup} className="w-full h-full object-cover" alt="App Screen" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200 pt-12 pb-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <Shield className="h-6 w-6 text-brand-600" />
                        <span className="text-lg font-bold text-gray-900">ClubSphere</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © 2026 ClubSphere. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};


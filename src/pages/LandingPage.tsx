import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Calendar, TrendingUp, Shield } from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Shield className="h-8 w-8 text-brand-600" />
                            <span className="text-2xl font-bold text-brand-600">ClubSphere</span>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-4 py-2 text-brand-600 hover:text-brand-700 font-medium"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Manage Your Campus Clubs
                        <span className="block text-brand-600 mt-2">All in One Place</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        ClubSphere is the ultimate platform for managing student clubs, events, and activities.
                        Streamline operations, engage members, and grow your community.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => navigate('/register')}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium text-lg"
                        >
                            Get Started
                            <ArrowRight className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-3 border-2 border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 font-medium text-lg"
                        >
                            Sign In
                        </button>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                        <div className="h-12 w-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                            <Users className="h-6 w-6 text-brand-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Club Management</h3>
                        <p className="text-gray-600">
                            Easily manage club members, roles, and activities from a centralized dashboard.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                        <div className="h-12 w-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                            <Calendar className="h-6 w-6 text-brand-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Event Planning</h3>
                        <p className="text-gray-600">
                            Create, manage, and track events with approval workflows and attendance tracking.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                        <div className="h-12 w-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                            <TrendingUp className="h-6 w-6 text-brand-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics & Reports</h3>
                        <p className="text-gray-600">
                            Generate insights and reports to measure club performance and engagement.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Shield className="h-6 w-6" />
                            <span className="text-xl font-bold">ClubSphere</span>
                        </div>
                        <p className="text-gray-400">
                            © 2026 ClubSphere. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

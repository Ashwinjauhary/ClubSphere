import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/Button';
import { ArrowRight, Calendar, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-brand-100 selection:text-brand-900">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100 via-gray-50 to-white opacity-70"></div>
                <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4 transform">
                    <div className="h-[40rem] w-[40rem] rounded-full bg-brand-400/20 blur-[100px]"></div>
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800 mb-8 animate-fade-in-up">
                        <span className="flex h-2 w-2 rounded-full bg-brand-600 mr-2"></span>
                        Now Live for Spring 2026 Semester
                    </div>

                    <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl mb-6">
                        Extracurriculars, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Reimagined.</span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg text-gray-600 mb-10 leading-relaxed">
                        ClubSphere is the centralized platform for managing college clubs, streamlining approvals, and supercharging student engagement with AI-driven insights.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login">
                            <Button size="lg" className="rounded-full px-8 shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40 transition-all">
                                Get Started <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="lg" className="rounded-full px-8 border-gray-300 hover:bg-white hover:border-gray-400">
                            View Demo
                        </Button>
                    </div>

                    {/* Hero Visual Mockup */}
                    <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white/50 p-2 shadow-2xl backdrop-blur-sm lg:rounded-3xl lg:p-4">
                        <div className="rounded-xl overflow-hidden bg-gray-900 border border-gray-800 shadow-inner">
                            <img
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                                alt="App Dashboard"
                                className="w-full h-auto opacity-90"
                            />
                            {/* Overlay Mock UI */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                                {/* Placeholder for actual dashboard screenshot */}
                                {/* <p className="text-sm font-mono text-gray-400">Dashboard Preview</p> */}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-semibold leading-7 text-brand-600">Everything you need</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Powering the next generation of student leaders
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="h-6 w-6 text-brand-600" />}
                            title="Role-Based Access"
                            description="Secure workflows for Students, Club Admins, and Deans, ensuring everyone sees exactly what they need."
                        />
                        <FeatureCard
                            icon={<Zap className="h-6 w-6 text-indigo-600" />}
                            title="AI-Powered Reports"
                            description="Our Gemini-powered AI analyzes event reports instantly, offering suggestions and calculating impact scores."
                        />
                        <FeatureCard
                            icon={<Calendar className="h-6 w-6 text-purple-600" />}
                            title="Seamless Approvals"
                            description="From event proposal to final report, track every step of the approval process in real-time."
                        />
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="py-24 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-semibold leading-7 text-brand-600">Simple Process</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            How ClubSphere Works
                        </p>
                        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                            From club creation to event execution, we've streamlined every step
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <StepCard
                            number="01"
                            title="Create Your Club"
                            description="Admins register their clubs with details, logos, and member information"
                        />
                        <StepCard
                            number="02"
                            title="Plan Events"
                            description="Submit event proposals with all details and get instant AI-powered suggestions"
                        />
                        <StepCard
                            number="03"
                            title="Get Approved"
                            description="Dean reviews and approves events in real-time with transparent tracking"
                        />
                        <StepCard
                            number="04"
                            title="Execute & Report"
                            description="Host your event, submit reports, and let AI analyze the impact automatically"
                        />
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section id="impact" className="py-24 bg-gradient-to-br from-brand-600 to-indigo-700 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-base font-semibold leading-7 text-brand-200">Real Results</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            The ClubSphere Impact
                        </p>
                        <p className="mt-4 text-lg text-brand-100 max-w-2xl mx-auto">
                            Transforming campus life, one event at a time
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ImpactCard
                            stat="85%"
                            label="Faster Approvals"
                            description="Events get approved in hours, not days"
                        />
                        <ImpactCard
                            stat="3x"
                            label="More Engagement"
                            description="Students participate in more club activities"
                        />
                        <ImpactCard
                            stat="100%"
                            label="Transparency"
                            description="Complete visibility into every process"
                        />
                    </div>

                    <div className="mt-16 text-center">
                        <Link to="/login">
                            <Button size="lg" className="bg-white text-brand-600 hover:bg-gray-100 rounded-full px-8 shadow-xl">
                                Join ClubSphere Today <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:shadow-xl hover:-translate-y-1">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
);

const StepCard = ({ number, title, description }: { number: string, title: string, description: string }) => (
    <div className="relative">
        <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-600">
                {number}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
        {number !== "04" && (
            <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-brand-200 to-transparent"></div>
        )}
    </div>
);

const ImpactCard = ({ stat, label, description }: { stat: string, label: string, description: string }) => (
    <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
        <div className="text-5xl font-bold mb-2">{stat}</div>
        <div className="text-xl font-semibold text-brand-100 mb-2">{label}</div>
        <p className="text-brand-200 text-sm">{description}</p>
    </div>
);

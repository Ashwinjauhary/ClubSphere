import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Panel: Branding & Visuals */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between bg-brand-900 p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                        <ShieldCheck className="h-8 w-8 text-brand-300" />
                        <span>ClubSphere</span>
                    </div>
                </div>
                <div className="relative z-10 max-w-md">
                    <blockquote className="space-y-2">
                        <p className="text-xl font-medium leading-relaxed">
                            &ldquo;ClubSphere has completely transformed how we manage our events and approvals. It's not just a tool; it's the heartbeat of our campus activities.&rdquo;
                        </p>
                        <footer className="text-sm font-medium text-brand-200">
                            — Dean of Student Affairs
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Panel: Form Content */}
            <div className="flex w-full lg:w-1/2 flex-col justify-center items-center bg-white p-8 sm:p-12 lg:p-24">
                <div className="w-full max-w-sm space-y-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
};

import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-brand-500/50 shadow-lg">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-gray-900">ClubSphere</span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">How it works</a>
                        <a href="#stats" className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">Impact</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
                        </Link>
                        <Link to="/register">
                            <Button size="sm" className="shadow-lg shadow-brand-500/30">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

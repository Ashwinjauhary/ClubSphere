import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { ParticlesBackground } from '../components/ui/ParticlesBackground';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
    const { resetPassword } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordForm) => {
        setIsLoading(true);
        try {
            await resetPassword(data.email);
            setIsSent(true);
            toast.success('Password reset link sent!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white font-sans">
            {/* Left Side - Brand / Visual */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 relative overflow-hidden">
                {/* Global Particles Background (Brand Side) */}
                <div className="absolute inset-0 z-0">
                    <ParticlesBackground />
                </div>

                {/* Abstract Visuals */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-600/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8 shadow-2xl">
                        <Shield className="text-white h-6 w-6" />
                    </div>
                </div>

                <div className="relative z-10 mb-20">
                    <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-6 leading-tight">
                        Secure.<br />
                        Reliable.<br />
                        <span className="text-brand-400">Recovery.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-md leading-relaxed font-medium">
                        Regain access to your account and continue managing your club activities seamlessly.
                    </p>
                </div>

                <div className="relative z-10 text-sm font-medium text-slate-500">
                    © 2026 ClubSphere Inc.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center px-6 py-12 lg:px-24 xl:px-32 bg-white relative">
                <div className="absolute top-8 left-6 lg:left-12">
                    <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
                    </Link>
                </div>

                <div className="w-full max-w-sm mx-auto">
                    <div className="mb-10">
                        {/* Mobile Logo */}
                        <div className="lg:hidden w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-brand-600/20">
                            <Shield className="text-white h-5 w-5" />
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Forgot Password?</h2>
                        <p className="text-slate-500 font-medium">
                            {isSent
                                ? "Check your email for the reset link."
                                : "Enter your email to receive a reset link."}
                        </p>
                    </div>

                    {isSent ? (
                        <div className="bg-green-50 rounded-2xl p-8 border border-green-100 text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-green-900 mb-2">Check your inbox</h3>
                            <p className="text-green-700 mb-6">
                                We've sent a password reset link to <span className="font-bold">{getValues().email}</span>.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                                onClick={() => setIsSent(false)}
                            >
                                Send another link
                            </Button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            <Input
                                label="Email"
                                type="email"
                                placeholder="name@university.edu"
                                error={errors.email?.message}
                                icon={<Mail className="h-5 w-5" />}
                                {...register('email')}
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full h-12 text-base shadow-[0_4px_0_0_#0369a1] active:shadow-none active:translate-y-1 hover:bg-brand-700 transition-all font-bold tracking-wide rounded-xl"
                                isLoading={isLoading}
                            >
                                Send Reset Link
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

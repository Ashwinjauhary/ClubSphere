import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, Lock, CheckCircle } from 'lucide-react';
import { ParticlesBackground } from '../components/ui/ParticlesBackground';
import toast from 'react-hot-toast';

const resetPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage = () => {
    const { updatePassword } = useAuthStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
    });

    // Supabase will automatically handle the session from the URL hash.
    // If the user lands here without a session (e.g., direct visit), they can't change password.

    const onSubmit = async (data: ResetPasswordForm) => {
        setIsLoading(true);
        try {
            await updatePassword(data.password);
            toast.success('Password updated successfully!');
            navigate('/login');
        } catch (error) {
            console.error(error);
            toast.error('Failed to update password. Link may be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white font-sans">
            {/* Left Side - Brand / Visual */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 relative overflow-hidden">
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
                        <span className="text-brand-400">Restored.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-md leading-relaxed font-medium">
                        Set a new password to regain access to your ClubSphere account.
                    </p>
                </div>

                <div className="relative z-10 text-sm font-medium text-slate-500">
                    © 2026 ClubSphere Inc.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center px-6 py-12 lg:px-24 xl:px-32 bg-white relative">
                <div className="w-full max-w-sm mx-auto">
                    <div className="mb-10">
                        {/* Mobile Logo */}
                        <div className="lg:hidden w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-brand-600/20">
                            <Shield className="text-white h-5 w-5" />
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Reset Password</h2>
                        <p className="text-slate-500 font-medium">
                            Enter your new password below.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            label="New Password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            icon={<Lock className="h-5 w-5" />}
                            {...register('password')}
                        />

                        <Input
                            label="Confirm New Password"
                            type="password"
                            placeholder="••••••••"
                            error={errors.confirmPassword?.message}
                            icon={<CheckCircle className="h-5 w-5" />}
                            {...register('confirmPassword')}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full h-12 text-base shadow-[0_4px_0_0_#0369a1] active:shadow-none active:translate-y-1 hover:bg-brand-700 transition-all font-bold tracking-wide rounded-xl"
                            isLoading={isLoading}
                        >
                            Update Password
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

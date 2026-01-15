import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Shield, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { ParticlesBackground } from '../components/ui/ParticlesBackground';

const registerSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { signUp } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        try {
            await signUp(data.email, data.password, data.full_name);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error('Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
            {/* Left Side - Brand / Visual */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 relative overflow-hidden">
                {/* Particles Layer */}
                <ParticlesBackground />

                {/* Abstract Visuals */}
                <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>

                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8">
                        <Shield className="text-white h-6 w-6" />
                    </div>
                </div>

                <div className="relative z-10 mb-20">
                    <h1 className="text-6xl font-black text-white tracking-tighter mb-6 leading-tight">
                        Start your <br />
                        leadership <br />
                        <span className="text-brand-400">journey here.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-md leading-relaxed font-medium">
                        Create an account to join clubs, attend exclusive events, and manage your campus life.
                    </p>
                </div>

                <div className="relative z-10 text-sm font-medium text-slate-500">
                    © 2026 ClubSphere Inc.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center px-6 py-12 lg:px-24 xl:px-32 bg-white">
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-8">
                        {/* Mobile Logo */}
                        <div className="lg:hidden w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-brand-600/20">
                            <Shield className="text-white h-5 w-5" />
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Create Account</h2>
                        <p className="text-slate-500 font-medium">Join thousands of students on ClubSphere.</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            error={errors.full_name?.message}
                            icon={<User className="h-5 w-5" />}
                            {...register('full_name')}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@university.edu"
                            error={errors.email?.message}
                            icon={<Mail className="h-5 w-5" />}
                            {...register('email')}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                error={errors.password?.message}
                                icon={<Lock className="h-5 w-5" />}
                                {...register('password')}
                            />
                            <Input
                                label="Confirm"
                                type="password"
                                placeholder="••••••••"
                                error={errors.confirmPassword?.message}
                                icon={<Lock className="h-5 w-5" />}
                                {...register('confirmPassword')}
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full h-12 text-base shadow-xl shadow-brand-500/20 hover:bg-brand-700"
                                isLoading={isLoading}
                                rightIcon={<ArrowRight className="h-5 w-5" />}
                            >
                                Get Started
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-brand-600 font-bold hover:text-brand-700 hover:underline transition-all">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

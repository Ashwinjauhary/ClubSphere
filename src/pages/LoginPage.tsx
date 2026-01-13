import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '../layouts/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';

import { toast } from 'sonner';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                console.error('Login error:', error.message);
                toast.error(error.message); // Simple error feedback
                return;
            }

            // Auth state change will be picked up by the store listener (if we add one) or we force a check
            await useAuthStore.getState().checkUser();
            const role = useAuthStore.getState().role;

            if (role === 'admin') navigate('/proposals'); // Admin landing
            else if (role === 'dean') navigate('/approvals'); // Dean landing
            else navigate('/dashboard'); // Student landing

        } catch (err) {
            console.error('Unexpected error:', err);
        }
    };

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Enter your credentials to access your account"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Email"
                    type="email"
                    placeholder="student@college.edu"
                    error={errors.email?.message}
                    {...register('email')}
                />
                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...register('password')}
                />

                <Button
                    type="submit"
                    className="w-full"
                    loading={isSubmitting}
                >
                    Sign In
                </Button>
            </form>

            <div className="mt-4 text-center">
                <Link to="/register" className="text-sm font-medium text-brand-600 hover:text-brand-500">
                    Create an account
                </Link>
            </div>


        </AuthLayout>
    );
};

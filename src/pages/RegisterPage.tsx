import { supabase } from '../lib/supabase';


import { toast } from 'sonner';
import { AuthLayout } from '../layouts/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.fullName,
                    },
                },
            });

            if (error) {
                console.error('Signup error:', error.message);
                toast.error(error.message);
                return;
            }

            toast.success('Registration successful! Please check your email for verification (if enabled) or log in.');
            navigate('/login');

        } catch (err: any) {
            console.error('Unexpected error:', err);
            toast.error(err.message || 'An unexpected error occurred during registration.');
        }
    };

    return (
        <AuthLayout
            title="Create an account"
            subtitle="Join ClubSphere to manage clubs and events"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Full Name"
                    placeholder="John Doe"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                />
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
                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

                <Button
                    type="submit"
                    className="w-full"
                    loading={isSubmitting}
                >
                    Sign Up
                </Button>
            </form>

            <div className="text-center text-sm text-gray-500 mt-4">
                <p>Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500">Sign in</Link></p>
            </div>
        </AuthLayout>
    );
};

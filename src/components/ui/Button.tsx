import { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';
import { motion, type HTMLMotionProps } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'neon' | 'cyber';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    loading,
    leftIcon,
    rightIcon,
    children,
    ...props
}, ref) => {
    const isButtonLoading = isLoading || loading;

    const variants = {
        primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg border border-transparent',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-transparent',
        outline: 'bg-transparent text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
        neon: '', // Deprecated
        cyber: '', // Deprecated
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10 p-2',
    };

    return (
        <motion.button
            ref={ref}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            className={cn(
                'relative inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isButtonLoading || props.disabled}
            {...props}
        >
            {isButtonLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <>
                    {leftIcon && <span className="mr-2">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="ml-2">{rightIcon}</span>}
                </>
            )}
        </motion.button>
    );
});

Button.displayName = 'Button';

export { Button };

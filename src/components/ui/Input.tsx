import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-600 transition-colors duration-200">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'block w-full rounded-xl border-2 border-gray-200 bg-white py-3 text-gray-900 shadow-sm transition-all duration-200',
                            'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none',
                            'placeholder:text-gray-400 sm:text-sm font-medium',
                            'hover:border-gray-300',
                            icon ? 'pl-11 pr-4' : 'px-4',
                            error && 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/50 text-red-900 placeholder:text-red-300',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-xs text-red-600 font-bold ml-1 flex items-center gap-1.5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" /> {error}
                    </motion.p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

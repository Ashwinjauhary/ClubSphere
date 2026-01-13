import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
    gradient?: string;
}

export const PageHeader = ({
    title,
    description,
    action,
    gradient = "from-purple-600 to-indigo-600"
}: PageHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
            >
                <div className="absolute -left-8 -top-8 opacity-20 pointer-events-none">
                    <div className="w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
                </div>

                <h1 className={`text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${gradient} flex items-center gap-3`}>
                    {title}
                    <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                </h1>

                {description && (
                    <p className="text-gray-500 mt-2 text-lg max-w-2xl relative z-10">
                        {description}
                    </p>
                )}
            </motion.div>

            {action && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10"
                >
                    {action}
                </motion.div>
            )}
        </div>
    );
};

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    gradient?: string;
    action?: React.ReactNode;
}

export const PageHeader = ({
    title,
    description,
    gradient = "from-blue-600 to-purple-600",
    action
}: PageHeaderProps) => {
    return (
        <div className="relative mb-8 p-1">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative z-10"
            >
                <div className="flex items-center gap-3 mb-2">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                        <Sparkles className="h-6 w-6 text-yellow-500" />
                    </motion.div>
                    <h1 className={`text-3xl md:text-5xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r ${gradient}`}>
                        {title}
                    </h1>
                </div>
                {description && (
                    <p className="max-w-3xl text-gray-500 text-lg font-medium tracking-wide border-l-4 border-blue-500/30 pl-4 bg-gray-50/50 py-2 rounded-r-lg">
                        {description}
                    </p>
                )}
            </motion.div>

            {action && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="absolute top-0 right-0 z-20"
                >
                    {action}
                </motion.div>
            )}
        </div>
    );
};

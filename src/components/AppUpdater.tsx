import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Button } from './ui/Button';
import { X, Download, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AppVersion {
    version: string;
    download_url: string;
    force_update: boolean;
    release_notes?: string;
}

export const AppUpdater = () => {
    const [updateAvailable, setUpdateAvailable] = useState<AppVersion | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkForUpdates = async () => {
            // Only run on native platforms (Android/iOS)
            if (!Capacitor.isNativePlatform()) return;

            try {
                // 1. Get current app info
                const appInfo = await App.getInfo();
                const currentVersion = appInfo.version; // e.g., "1.0.0"

                // 2. Get latest version from Supabase
                const { data, error } = await supabase
                    .from('app_versions')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (error || !data) return;

                const latestVersion = data.version;

                // 3. Simple version comparison (strings)
                // Note: For robust semver, use a library like 'semver-compare'
                // Here we assume simple incrementing versions or lexicographical order works for now
                if (compareVersions(currentVersion, latestVersion) < 0) {
                    setUpdateAvailable(data);
                    setIsOpen(true);
                }

            } catch (err) {
                console.error('Failed to check for updates:', err);
            }
        };

        checkForUpdates();
    }, []);

    // Returns -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
    const compareVersions = (v1: string, v2: string) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    };

    const handleUpdate = () => {
        if (updateAvailable?.download_url) {
            window.open(updateAvailable.download_url, '_system');
        }
    };

    const handleClose = () => {
        if (!updateAvailable?.force_update) {
            setIsOpen(false);
        }
    };

    if (!updateAvailable || !isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-white/20"
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-brand-100 dark:bg-brand-900/50 rounded-full">
                                    <Download className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Update Available
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Version {updateAvailable.version} is ready
                                    </p>
                                </div>
                            </div>
                            {!updateAvailable.force_update && (
                                <button
                                    onClick={handleClose}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>

                        {updateAvailable.release_notes && (
                            <div className="mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    What's New
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                    {updateAvailable.release_notes}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            {!updateAvailable.force_update && (
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    className="flex-1"
                                >
                                    Later
                                </Button>
                            )}
                            <Button
                                onClick={handleUpdate}
                                className="flex-1"
                            >
                                Update Now
                            </Button>
                        </div>

                        {updateAvailable.force_update && (
                            <div className="mt-4 flex items-center justify-center text-xs text-amber-600 dark:text-amber-500">
                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                                This update is required to continue.
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

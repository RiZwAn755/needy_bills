import React, { useState, useEffect } from 'react';
import { subscribeToLoading } from '../utils/fetchInterceptor';

export default function GlobalLoader() {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Subscribe to global fetch events
        const unsubscribe = subscribeToLoading((loadingState) => {
            setIsLoading(loadingState);
        });
        return () => unsubscribe();
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
                 <div className="relative w-16 h-16">
                     {/* Outer spinning ring */}
                     <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-indigo-600 dark:border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                     
                     {/* Inner icon/pulse */}
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50"></div>
                     </div>
                 </div>
                 <p className="text-gray-700 dark:text-gray-300 font-medium tracking-wide text-sm animate-pulse">Loading data...</p>
            </div>
        </div>
    );
}

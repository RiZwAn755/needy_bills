import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
    const { user, isAdmin } = useAuth();
    
    // If user is already logged in, redirect them based on their role
    if (user) {
        return <Navigate to={isAdmin ? "/admin" : "/app"} replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-950">
            <div className="max-w-4xl text-center space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 mb-4 shadow-inner">
                    <span className="text-4xl sm:text-5xl">⚡</span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    Smart Billing for <br className="hidden sm:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        Modern Businesses
                    </span>
                </h1>
                
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Streamline your invoicing, manage inventory effortlessly, and track your business growth with Needy Bills. The all-in-one platform built for speed and simplicity.
                </p>
                
                <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center gap-4">
                    <Link
                        to="/login"
                        className="w-full flex items-center justify-center px-8 py-3.5 border border-transparent text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg px-10 transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-0.5"
                    >
                        Login to Dashboard
                        <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Link>
                </div>
                
                <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-5xl mx-auto pt-8 border-t border-gray-200 dark:border-gray-800">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">Lightning Fast</div>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Generate professional bills in seconds.</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">Smart Tracking</div>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Monitor expenses and inventory in real-time.</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">Secure Data</div>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your business metrics are safely encrypted.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    BarChart3,
    UserPlus,
    Package,
    Receipt,
    FilePlus2,
    Wallet,
    TrendingUp,
    Settings,
    UserRound
} from 'lucide-react';

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dark, setDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('billflow_theme') === 'dark';
        }
        return false;
    });
    const location = useLocation();
    const { user, isAdmin, logout } = useAuth();

    const navLinks = isAdmin ? [
        { to: '/admin', label: 'Admin Dashboard', icon: BarChart3 },
        { to: '/signup', label: 'Register User', icon: UserPlus }
    ] : [
        { to: '/products', label: 'Products', icon: Package },
        { to: '/all-bills', label: 'All Bills', icon: Receipt },
        { to: '/bill', label: 'New Bill', icon: FilePlus2 },
        { to: '/expenses', label: 'Expenses', icon: Wallet },
        { to: '/analytics', label: 'Analytics', icon: TrendingUp },
        { to: '/settings', label: 'Settings', icon: Settings },
        { to: '/profile', label: 'Profile', icon: UserRound }
    ];

    const renderNavIcon = (link) => {
        const IconComponent = link.icon;
        return <IconComponent className="w-4 h-4" strokeWidth={2.2} />;
    };

    const toggleDark = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('billflow_theme', next ? 'dark' : 'light');
    };

    // Apply on mount
    if (dark) document.documentElement.classList.add('dark');

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to={isAdmin ? '/admin' : (user ? '/app' : '/')} className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
                                <span className="text-white font-bold text-xs tracking-tighter">NB</span>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Needy Bills
                            </span>
                        </Link>

                        {/* Desktop Links - Only show if user is logged in */}
                        {user && (
                            <div className="hidden md:flex items-center gap-1">
                                {navLinks.map((link) => {
                                    const isActive = location.pathname === link.to;
                                    return (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className={`group px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <span
                                                className={`inline-flex items-center justify-center w-6 h-6 mr-1.5 rounded-md transition-colors ${isActive
                                                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                                                    }`}
                                            >
                                                {renderNavIcon(link)}
                                            </span>
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            {/* Dark mode toggle */}
                            <button
                                onClick={toggleDark}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Toggle dark mode"
                            >
                                {dark ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                           
                            {user && (
                                <button
                                    onClick={() => setMobileOpen(!mobileOpen)}
                                    className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    aria-label="Toggle menu"
                                >
                                    {mobileOpen ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && user && (
                    <div className="md:hidden border-t border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-950 animate-fade-in">
                        <div className="px-4 py-3 space-y-1">
                            {navLinks.map((link) => {
                                const isActive = location.pathname === link.to;
                                return (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMobileOpen(false)}
                                        className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <span
                                            className={`inline-flex items-center justify-center w-6 h-6 mr-2 rounded-md transition-colors ${isActive
                                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                                : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            {renderNavIcon(link)}
                                        </span>
                                        {link.label}
                                    </Link>
                                );
                            })}

                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}

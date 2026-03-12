import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStats, getBills } from '../utils/storage';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function Dashboard() {
    const [stats, setStats] = useState({ totalProducts: 0, totalBills: 0, totalRevenue: 0, totalExpenses: 0, totalProfit: 0 });
    const [recentBills, setRecentBills] = useState([]);
    const { isInstalled, canInstall, isInstalling, install } = usePWAInstall();

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const statsData = await getStats();
                setStats(statsData);
                const billsData = await getBills();
                setRecentBills(billsData.slice(0, 10));
            } catch(e) {
                console.error("Dashboard load error", e);
            }
        };
        loadDashboard();
    }, []);

    return (
        <div className="min-h-screen">
            {/* ═══════ HERO SECTION — Mochan-D inspired ═══════ */}
            <section className="relative overflow-hidden bg-white dark:bg-gray-950">
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                    backgroundSize: '32px 32px'
                }} />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[70vh] py-16 lg:py-20">
                        {/* Left: Typography */}
                        <div className="animate-fade-in">
                            {/* PWA Install / Installed Banner */}
                            {isInstalled ? (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-8">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    You're tracking on Needy Bills
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 mb-8 animate-fade-in">
                                    <button
                                        onClick={install}
                                        disabled={!canInstall}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${canInstall
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 cursor-pointer shadow-sm'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        {canInstall ? 'Install Needy Bills' : 'Install App (Not Available)'}
                                    </button>
                                    {!canInstall && !isInstalled && (
                                        <p className="text-xs text-gray-500 mt-2 max-w-xs">
                                            If disabled: check the address bar for the install icon <span className="inline-block align-middle"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></span> or menu options.
                                        </p>
                                    )}
                                </div>
                            )}

                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.05]" style={{ animation: 'fadeIn 0.7s ease-out 0.1s both' }}>
                                Manage
                                <br />
                                billing
                                <br />
                                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                    with
                                </span>
                                <br />
                                Needy Bills.
                            </h1>

                            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 mt-6 max-w-md leading-relaxed font-light" style={{ animation: 'fadeIn 0.7s ease-out 0.3s both' }}>
                                Smart billing software built for small businesses. Manage products, generate invoices, track expenses — all offline.
                            </p>

                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-3 font-medium" style={{ animation: 'fadeIn 0.7s ease-out 0.35s both' }}>
                                Built with ❤️ by{' '}
                                <a
                                    href="https://needysolutions.info"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                                >
                                    Needy Solutions
                                </a>
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-wrap gap-3 mt-8" style={{ animation: 'fadeIn 0.7s ease-out 0.5s both' }}>
                                <Link
                                    to="/bill"
                                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl shadow-gray-900/10 dark:shadow-white/10 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                                >
                                    Generate Bill
                                </Link>
                                <Link
                                    to="/products"
                                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                                >
                                    Manage Products
                                </Link>
                            </div>
                        </div>

                        {/* Right: Floating UI Cards */}
                        <div className="relative hidden lg:block" style={{ animation: 'fadeIn 0.8s ease-out 0.4s both' }}>
                            <div className="relative w-full h-[500px]">
                                {/* Main card — Billing Terminal */}
                                <div className="absolute top-8 left-8 right-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-200/60 dark:border-gray-800/60 overflow-hidden" style={{ animation: 'fadeIn 0.6s ease-out 0.5s both' }}>
                                    {/* Window dots */}
                                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                        <span className="ml-3 text-xs text-gray-400 font-mono">needybills</span>
                                    </div>
                                    <div className="p-5 font-mono text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                                        <p><span className="text-indigo-500">import</span> {'{ '}Bill{' }'} <span className="text-indigo-500">from</span> <span className="text-emerald-600 dark:text-emerald-400">'@needybills'</span></p>
                                        <p><span className="text-purple-500">const</span> invoice = <span className="text-amber-600 dark:text-amber-400">NeedyBills</span>.<span className="text-blue-500">generate</span>();</p>
                                        <p className="text-gray-400">// Track every rupee</p>
                                        <p>invoice.<span className="text-blue-500">export</span>(<span className="text-emerald-600 dark:text-emerald-400">'pdf'</span>);</p>
                                    </div>
                                </div>

                                {/* Stats card — floating */}
                                <div className="absolute top-48 right-4 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl shadow-gray-200/40 dark:shadow-black/20 border border-gray-200/60 dark:border-gray-800/60 p-4" style={{ animation: 'fadeIn 0.6s ease-out 0.7s both' }}>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs font-semibold text-emerald-500">
                                            {stats.totalProfit >= 0 ? '+' : ''}{stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%
                                        </span>
                                        <span className="text-xs text-gray-400">profit</span>
                                    </div>
                                    {/* Mini bar chart */}
                                    <div className="flex items-end gap-1 mt-3 h-10">
                                        {[35, 55, 40, 70, 50, 80, 65, 90, 75].map((h, i) => (
                                            <div key={i} className="flex-1 rounded-sm bg-indigo-100 dark:bg-indigo-500/20" style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </div>

                                {/* Success badge — floating */}
                                <div className="absolute bottom-16 left-0 bg-white dark:bg-gray-900 rounded-xl shadow-lg shadow-gray-200/40 dark:shadow-black/20 border border-gray-200/60 dark:border-gray-800/60 p-3 flex items-center gap-3" style={{ animation: 'fadeIn 0.6s ease-out 0.9s both' }}>
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">Bill Generated</p>
                                        <p className="text-[11px] text-gray-400">Just now</p>
                                    </div>
                                    <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">✓</span>
                                </div>

                                {/* Needy Solutions badge */}
                                <div className="absolute bottom-2 right-12 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200/60 dark:border-gray-800/60 px-3 py-2 flex items-center gap-2" style={{ animation: 'fadeIn 0.6s ease-out 1.1s both' }}>
                                    <img
                                        src="https://www.needysolutions.info/assets/logo1-removebg-preview-CgBxH4Kp.png"
                                        alt="Needy Solutions"
                                        className="w-5 h-5 object-contain"
                                    />
                                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">needysolutions.info</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ STATS SECTION ═══════ */}
            <section className="bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200/60 dark:border-gray-800/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                        {[
                            { label: 'Products', value: stats.totalProducts, icon: '📦' },
                            { label: 'Bills', value: stats.totalBills, icon: '🧾' },
                            { label: 'Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰' },
                            { label: 'Expenses', value: `₹${(stats.totalExpenses || 0).toLocaleString('en-IN')}`, icon: '💸' },
                            { label: 'Profit', value: `₹${(stats.totalProfit || 0).toLocaleString('en-IN')}`, icon: '📈', highlight: true },
                        ].map((card, i) => (
                            <div
                                key={card.label}
                                className={`rounded-2xl p-5 text-center transition-all duration-300 hover:scale-[1.03] animate-fade-in ${card.highlight
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-sm'
                                    }`}
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                <span className="text-2xl">{card.icon}</span>
                                <p className={`text-2xl font-bold mt-2 ${card.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                    {card.value}
                                </p>
                                <p className={`text-xs font-medium mt-1 uppercase tracking-wider ${card.highlight ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {card.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ QUICK ACTIONS ═══════ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Quick Actions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Jump to any section</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { to: '/products', label: 'Manage Products', desc: 'Add, edit, or remove products', icon: '📦', border: 'hover:border-indigo-300 dark:hover:border-indigo-800' },
                        { to: '/bill', label: 'Generate Bill', desc: 'Create a customer invoice', icon: '🧾', border: 'hover:border-emerald-300 dark:hover:border-emerald-800' },
                        { to: '/expenses', label: 'Track Expenses', desc: 'Log purchase costs', icon: '💸', border: 'hover:border-rose-300 dark:hover:border-rose-800' },
                        { to: '/analytics', label: 'Profit Analytics', desc: 'Charts & profit breakdown', icon: '📈', border: 'hover:border-amber-300 dark:hover:border-amber-800' },
                    ].map((action, i) => (
                        <Link
                            key={action.to}
                            to={action.to}
                            className={`group flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 ${action.border} shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in`}
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{action.label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{action.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ═══════ RECENT BILLS ═══════ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bills</h2>
                        <Link to="/bill" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                            New Bill →
                        </Link>
                    </div>
                    {recentBills.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-gray-400 dark:text-gray-500 text-sm">No bills generated yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bill #</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {recentBills.map((bill) => (
                                        <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-3.5 font-mono text-xs font-semibold text-gray-900 dark:text-white">
                                                #{bill.billNumber != null ? String(bill.billNumber).padStart(4, '0') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-3.5 text-gray-600 dark:text-gray-400">{bill.customerName}</td>
                                            <td className="px-6 py-3.5 font-semibold text-gray-900 dark:text-white">
                                                ₹{(bill.grandTotal || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400 text-xs">
                                                {new Date(bill.date || bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <Link
                                                    to={`/bill/preview/${bill.id}`}
                                                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

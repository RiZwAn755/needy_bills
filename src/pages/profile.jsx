import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loadingStats, setLoadingStats] = useState(false);
    const [error, setError] = useState('');

    const businessName = user?.businessName || 'Business Name';
    const dueDateStr = user?.dueDate ? new Date(user.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
    const isExpired = user?.dueDate ? new Date(user.dueDate) < new Date() : false;

    const handleDownloadAllData = async () => {
        setLoadingStats(true);
        setError('');
        try {
            // Fetch stats and all bills to create a comprehensive report
            const statsResponse = await fetch(`${import.meta.env.VITE_BASE_URL}api/stats/overall`, {
                method: 'GET',
                credentials: 'include'
            });
            const billsResponse = await fetch(`${import.meta.env.VITE_BASE_URL}api/bills`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!statsResponse.ok || !billsResponse.ok) {
                throw new Error('Failed to fetch data for download');
            }

            const stats = await statsResponse.json();
            const billsResponseData = await billsResponse.json();
            const bills = billsResponseData.bills || [];

            // Initialize PDF
            const doc = new jsPDF();
            
            // Add Title
            doc.setFontSize(20);
            doc.setTextColor(79, 70, 229); // Indigo 600
            doc.text(`${businessName} - Business Data Report`, 14, 22);
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

            // Add Stats Table
            doc.setFontSize(14);
            doc.setTextColor(30, 30, 30);
            doc.text("Overall Statistics", 14, 42);

            autoTable(doc, {
                startY: 46,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Revenue', `Rs. ${stats.totalRevenue.toLocaleString()}`],
                    ['Total Expenses', `Rs. ${stats.totalExpenses.toLocaleString()}`],
                    ['Total Profit', `Rs. ${stats.totalProfit.toLocaleString()}`],
                    ['Total Bills Generated', stats.totalBills]
                ],
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] },
                alternateRowStyles: { fillColor: [249, 250, 251] }
            });

            // Add Bills Table
            const finalY = doc.lastAutoTable.finalY || 46;
            
            doc.setFontSize(14);
            doc.text("Bill History", 14, finalY + 14);

            const billRows = bills.map(bill => [
                new Date(bill.date).toLocaleDateString(),
                bill.billNumber,
                bill.customerName || 'N/A',
                bill.phoneNumber || 'N/A',
                `Rs. ${bill.grandTotal.toLocaleString()}`,
                bill.paymentMethod || 'N/A'
            ]);

            autoTable(doc, {
                startY: finalY + 18,
                head: [['Date', 'Bill No.', 'Customer', 'Phone', 'Total', 'Payment']],
                body: billRows,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9 }
            });

            // Save PDF
            doc.save(`${businessName.replace(/\s+/g, '_')}_Business_Report.pdf`);

        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download data. Please try again.');
        } finally {
            setLoadingStats(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    return (
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="max-w-4xl mx-auto space-y-5">
                <div className="rounded-3xl overflow-hidden border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 shadow-sm">
                    <div className="h-32 sm:h-36 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative" />
                    <div className="px-5 sm:px-7 pb-6 -mt-12 sm:-mt-14 relative z-10">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-gray-900 rounded-2xl p-2 shadow-lg border border-gray-100 dark:border-gray-800 flex items-center justify-center">
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <span className="text-3xl sm:text-4xl">🏢</span>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-5">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{businessName}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Business Profile & Account Actions</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Plan Details</h2>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Your subscription validity and account status.</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isExpired ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50'}`}>
                                {isExpired ? 'Expired' : 'Active'}
                            </span>
                        </div>

                        <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 p-4">
                            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan Expiry Date</p>
                                    <p className={`font-semibold text-base mt-0.5 ${isExpired ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{dueDateStr}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-6">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Export business data or safely logout.</p>

                        <div className="space-y-3">
                            <button
                                onClick={handleDownloadAllData}
                                disabled={loadingStats}
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loadingStats ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download Report (PDF)
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3.5 bg-white dark:bg-transparent text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

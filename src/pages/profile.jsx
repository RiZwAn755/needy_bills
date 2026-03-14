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
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Header Banner */}
                <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white dark:bg-gray-900 rounded-full p-2 shadow-lg flex items-center justify-center">
                         <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400">
                           <span className="text-3xl">🏢</span>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="pt-16 pb-8 px-6 text-center space-y-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">
                            {businessName}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Business Profile</p>
                    </div>

                    {/* Plan Details */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <div className="text-left">
                                     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan Expiry</p>
                                     <p className={`font-medium ${isExpired ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                        {dueDateStr}
                                     </p>
                                </div>
                            </div>
                            {isExpired && (
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">
                                    Expired
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {error && (
                         <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/10 py-2 rounded-md">
                           {error}
                         </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3 pt-4">
                        <button
                            onClick={handleDownloadAllData}
                            disabled={loadingStats}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg shadow-gray-900/20 dark:shadow-white/10"
                        >
                            {loadingStats ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Report (PDF)
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

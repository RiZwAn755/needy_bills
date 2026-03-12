import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBills, deleteBill } from '../utils/storage';

export default function AllBills() {
    const [bills, setBills] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterName, setFilterName] = useState('');

    const loadBills = async () => {
        const data = await getBills();
        setBills(data);
    };

    useEffect(() => {
        loadBills();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this bill?')) {
            try {
                await deleteBill(id);
                loadBills();
            } catch(err) {
                alert("Failed to delete bill: " + err.message);
            }
        }
    };

    const filteredBills = bills.filter((bill) => {
        // Safe Date Parsing
        let billDateObj;
        try {
            billDateObj = new Date(bill.createdAt || bill.date);
            if (isNaN(billDateObj.getTime())) throw new Error("Invalid date");
        } catch (e) {
            billDateObj = new Date(); // Fallback to avoid crashes
        }

        // Match Name
        const matchesName = bill.customerName?.toLowerCase().includes(filterName.toLowerCase());

        // Match Date (YYYY-MM-DD)
        const billDateStr = billDateObj.toISOString().split('T')[0];
        const matchesDate = filterDate ? billDateStr === filterDate : true;

        // Match Month (YYYY-MM)
        const billMonthStr = billDateStr.substring(0, 7);
        const matchesMonth = filterMonth ? billMonthStr === filterMonth : true;

        return matchesName && matchesDate && matchesMonth;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Bills</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View and filter all generated bills</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Billed To Name</label>
                        <input
                            type="text"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            placeholder="Customer name..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Filter by Date</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => {
                                setFilterDate(e.target.value);
                                if (e.target.value) setFilterMonth(''); // Clear month filter if date is selected
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Filter by Month</label>
                        <input
                            type="month"
                            value={filterMonth}
                            onChange={(e) => {
                                setFilterMonth(e.target.value);
                                if (e.target.value) setFilterDate(''); // Clear date filter if month is selected
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Bills Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bill No.</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No bills found matching the filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => {
                                    let safeDate;
                                    try {
                                        safeDate = new Date(bill.createdAt || bill.date);
                                        if (isNaN(safeDate.getTime())) safeDate = new Date();
                                    } catch (e) {
                                        safeDate = new Date();
                                    }

                                    return (
                                        <tr key={bill.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                #{bill.billNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {safeDate.toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                                {bill.customerName || 'Walk-in Customer'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white text-right">
                                                ₹{(bill.grandTotal || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-3">
                                                <Link
                                                    to={`/bill/preview/${bill.id}`}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
                                                >
                                                    View
                                                </Link>
                                                <Link
                                                    to={`/bill/edit/${bill.id}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(bill.id)}
                                                    className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-medium transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

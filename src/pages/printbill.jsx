import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBillById, getCompanySettings } from '../utils/storage';

export default function PrintBill() {
    const { id } = useParams();
    const [bill, setBill] = useState(null);
    const [settings] = useState(getCompanySettings());

    useEffect(() => {
        const found = getBillById(id);
        setBill(found);
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (!bill) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Bill not found</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">The bill you're looking for doesn't exist or was deleted.</p>
                <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow">
                    ← Back to Dashboard
                </Link>
            </div>
        );
    }

    const billDate = new Date(bill.date);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Action Bar – hidden on print */}
            <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 animate-fade-in">
                <div>
                    <Link to="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Invoice Preview</h1>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/bill"
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        + New Bill
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print / Save PDF
                    </button>
                </div>
            </div>

            {/* Invoice Card – this is the printable area */}
            <div id="print-area" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-lg overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
                {/* Invoice Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                {settings.logo ? (
                                    <img src={settings.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                        NB
                                    </div>
                                )}
                                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {settings.name}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 leading-relaxed max-w-xs">
                                {settings.address && <p className="whitespace-pre-line">{settings.address}</p>}
                                {(settings.phone || settings.email) && (
                                    <p>
                                        {settings.phone}
                                        {settings.phone && settings.email && ' • '}
                                        {settings.email}
                                    </p>
                                )}
                                {settings.gstin && <p className="font-medium">GSTIN: {settings.gstin}</p>}
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                #{String(bill.billNumber).padStart(4, '0')}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {billDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                {billDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="px-8 py-4 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium mb-1">Billed To</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{bill.customerName}</p>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                                <th className="px-8 py-3">#</th>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-right">Rate</th>
                                <th className="px-8 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {bill.items.map((item, i) => (
                                <tr key={i} className="text-sm">
                                    <td className="px-8 py-3.5 text-gray-400 dark:text-gray-500">{i + 1}</td>
                                    <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white">{item.name}</td>
                                    <td className="px-4 py-3.5 text-center text-gray-600 dark:text-gray-400">
                                        {item.qty} {item.unit}
                                    </td>
                                    <td className="px-4 py-3.5 text-right text-gray-600 dark:text-gray-400">₹{item.price.toLocaleString('en-IN')}</td>
                                    <td className="px-8 py-3.5 text-right font-semibold text-gray-900 dark:text-white">₹{item.amount.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="max-w-xs ml-auto space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                            <span className="font-medium text-gray-900 dark:text-white">₹{bill.subtotal.toLocaleString('en-IN')}</span>
                        </div>

                        {bill.discountAmount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Discount
                                    {bill.discountType === 'percent' && ` (${bill.discountValue}%)`}
                                </span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    − ₹{bill.discountAmount.toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                            <div className="flex justify-between">
                                <span className="text-base font-bold text-gray-900 dark:text-white">Grand Total</span>
                                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    ₹{bill.grandTotal.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {settings.footerMessage}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                        Software generated by <span className="font-semibold">Needy Solutions</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

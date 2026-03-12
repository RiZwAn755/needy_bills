import { useState, useEffect } from 'react';
import { getExpenses, addExpense, updateExpense, deleteExpense, getProducts } from '../utils/storage';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({
        productName: '',
        units: '',
        costPerUnit: '',
        totalCost: '',
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const loadData = async () => {
        const fetchedExpenses = await getExpenses();
        setExpenses(fetchedExpenses);
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
    };

    useEffect(() => {
        loadData();
    }, []);

    const refresh = () => loadData();

    const filtered = expenses.filter(
        (e) =>
            e.productName?.toLowerCase().includes(search.toLowerCase()) ||
            e.supplier?.toLowerCase().includes(search.toLowerCase())
    );

    const totalSpent = expenses.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const thisMonth = expenses
        .filter((e) => {
            const d = new Date(e.date);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, e) => sum + (e.totalCost || 0), 0);

    const openAdd = () => {
        setForm({
            productName: '',
            units: '',
            costPerUnit: '',
            totalCost: '',
            supplier: '',
            date: new Date().toISOString().split('T')[0],
            notes: '',
        });
        setEditingExpense(null);
        setShowModal(true);
    };

    const openEdit = (expense) => {
        setForm({
            productName: expense.productName || '',
            units: String(expense.units || ''),
            costPerUnit: String(expense.costPerUnit || ''),
            totalCost: String(expense.totalCost || ''),
            supplier: expense.supplier || '',
            date: expense.date || new Date().toISOString().split('T')[0],
            notes: expense.notes || '',
        });
        setEditingExpense(expense);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.productName.trim() || !form.totalCost) return;

        const data = {
            productName: form.productName.trim(),
            units: parseFloat(form.units) || 0,
            costPerUnit: parseFloat(form.costPerUnit) || 0,
            totalCost: parseFloat(form.totalCost) || 0,
            supplier: form.supplier.trim(),
            date: form.date,
            notes: form.notes.trim(),
        };

        try {
            if (editingExpense) {
                await updateExpense(editingExpense.id, data);
            } else {
                await addExpense(data);
            }
            setShowModal(false);
            refresh();
        } catch(err) {
            console.error("Expense saving error:", err);
            alert("Error saving expense: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteExpense(id);
            setDeleteConfirm(null);
            refresh();
        } catch(err) {
            alert("Failed deleting expense: " + err.message);
        }
    };

    // Auto-calculate total cost when units/costPerUnit change
    const handleUnitsChange = (val) => {
        const newForm = { ...form, units: val };
        if (val && form.costPerUnit) {
            newForm.totalCost = String((parseFloat(val) * parseFloat(form.costPerUnit)).toFixed(2));
        }
        setForm(newForm);
    };

    const handleCostPerUnitChange = (val) => {
        const newForm = { ...form, costPerUnit: val };
        if (val && form.units) {
            newForm.totalCost = String((parseFloat(form.units) * parseFloat(val)).toFixed(2));
        }
        setForm(newForm);
    };

    // Product name suggestions
    const productNames = [...new Set(products.map((p) => p.name))];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track your purchase costs and spending</p>
                </div>
                <button
                    onClick={openAdd}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-medium shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm animate-fade-in">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Entries</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{expenses.length}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm animate-fade-in" style={{ animationDelay: '60ms' }}>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">This Month</p>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">₹{thisMonth.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm animate-fade-in" style={{ animationDelay: '120ms' }}>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">All-Time Spent</p>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">₹{totalSpent.toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '80ms' }}>
                <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by product or supplier..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>

            {/* Expenses Table */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 animate-fade-in">
                    <div className="text-5xl mb-4">💰</div>
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                        {search ? 'No expenses match your search' : 'No expenses recorded yet'}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {search ? 'Try a different keyword' : 'Add your first expense to start tracking'}
                    </p>
                    {!search && (
                        <button onClick={openAdd} className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-medium shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-shadow">
                            Add Expense
                        </button>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Units</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost/Unit</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-gray-900 dark:text-white">{expense.productName}</p>
                                            {expense.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{expense.notes}</p>}
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{expense.units || '—'}</td>
                                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{expense.costPerUnit ? `₹${expense.costPerUnit.toLocaleString('en-IN')}` : '—'}</td>
                                        <td className="px-5 py-3.5 font-semibold text-rose-600 dark:text-rose-400">₹{(expense.totalCost || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{expense.supplier || '—'}</td>
                                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                                            {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openEdit(expense)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(expense.id)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Overlay */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-2xl p-6 max-w-sm w-full animate-fade-in text-center">
                        <div className="text-4xl mb-3">🗑️</div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Delete Expense?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">This action cannot be undone</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingExpense ? 'Edit Expense' : 'Add Expense'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Product Name with autocomplete */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Product Name</label>
                                <input
                                    list="product-suggestions"
                                    type="text"
                                    value={form.productName}
                                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                                    placeholder="e.g. Basmati Rice"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                />
                                <datalist id="product-suggestions">
                                    {productNames.map((name) => (
                                        <option key={name} value={name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Units Bought</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.units}
                                        onChange={(e) => handleUnitsChange(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cost / Unit (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.costPerUnit}
                                        onChange={(e) => handleCostPerUnitChange(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Total Paid (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.totalCost}
                                        onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
                                        placeholder="0.00"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Supplier <span className="text-gray-400">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={form.supplier}
                                        onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                                        placeholder="e.g. ABC Traders"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes <span className="text-gray-400">(optional)</span></label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Any additional details..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {editingExpense ? 'Save Changes' : 'Add Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

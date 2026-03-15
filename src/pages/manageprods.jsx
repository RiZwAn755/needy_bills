import { useState, useEffect, useRef, useMemo, useDeferredValue } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../utils/storage';
import * as XLSX from 'xlsx';

function getExpiryStatus(expiryDate) {
    if (!expiryDate) return { status: 'none', label: 'No expiry', color: 'gray' };
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { status: 'expired', label: 'Expired', color: 'red', days: 0 };
    if (diffDays <= 7) return { status: 'critical', label: `${diffDays}d left`, color: 'red', days: diffDays };
    if (diffDays <= 14) return { status: 'warning', label: `${diffDays}d left`, color: 'yellow', days: diffDays };
    return { status: 'safe', label: `${diffDays}d left`, color: 'green', days: diffDays };
}

const expiryStyles = {
    red: {
        border: 'border-l-4 border-l-rose-500',
        badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
        dot: 'bg-rose-500',
    },
    yellow: {
        border: 'border-l-4 border-l-amber-400',
        badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-400',
    },
    green: {
        border: 'border-l-4 border-l-emerald-500',
        badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-500',
    },
    gray: {
        border: '',
        badge: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
        dot: 'bg-gray-400',
    },
};

export default function ManageProducts() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [form, setForm] = useState({ name: '', price: '', unit: 'pcs', category: '', expiryDate: '', quantity: '' });
    const [filterType, setFilterType] = useState('all'); // 'all', 'low_stock', 'expiring'
    const [showImportModal, setShowImportModal] = useState(false);
    const [importPreview, setImportPreview] = useState([]);
    const [importError, setImportError] = useState('');
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);

    const loadProducts = async () => {
        const data = await getProducts();
        setProducts(data);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const refresh = () => loadProducts();

    const deferredSearch = useDeferredValue(search);
    const filtered = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                p.category?.toLowerCase().includes(deferredSearch.toLowerCase());

            if (!matchesSearch) return false;

            const expiryStatus = getExpiryStatus(p.expiryDate).status;
            const isExpired = expiryStatus === 'expired';

            if (filterType === 'expired') {
                return isExpired;
            }

            if (filterType === 'low_stock') {
                return !isExpired && (p.quantity || 0) <= 10;
            }

            if (filterType === 'expiring') {
                return expiryStatus === 'critical' || expiryStatus === 'warning';
            }

            // 'all' — hide expired products
            return !isExpired;
        });
    }, [products, deferredSearch, filterType]);

    const openAdd = () => {
        setForm({ name: '', price: '', unit: 'pcs', category: '', expiryDate: '', quantity: '' });
        setEditingProduct(null);
        setShowModal(true);
    };

    const openEdit = (product) => {
        setForm({
            name: product.name,
            price: String(product.price),
            unit: product.unit || 'pcs',
            category: product.category || '',
            expiryDate: product.expiryDate || '',
            quantity: product.quantity !== undefined ? String(product.quantity) : ''
        });
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.price) return;

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, {
                    name: form.name.trim(),
                    price: parseFloat(form.price),
                    unit: form.unit,
                    category: form.category.trim(),
                    expiryDate: form.expiryDate || '',
                    quantity: form.quantity ? parseInt(form.quantity, 10) : 0
                });
            } else {
                await addProduct({
                    name: form.name.trim(),
                    price: parseFloat(form.price),
                    unit: form.unit,
                    category: form.category.trim(),
                    expiryDate: form.expiryDate || '',
                    quantity: form.quantity ? parseInt(form.quantity, 10) : 0
                });
            }
            setShowModal(false);
            refresh();
        } catch(error) {
            console.error("Failed saving product:", error);
            alert("Error saving product: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteProduct(id);
            setDeleteConfirm(null);
            refresh();
        } catch(err) {
            alert('Failed deleting product: ' + err.message);
        }
    };

    // ── Import from Excel / CSV ──
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportError('');
        setImportPreview([]);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                if (rows.length === 0) {
                    setImportError('The file appears to be empty.');
                    return;
                }

                // Smart column mapping (case-insensitive, partial match)
                const mapCol = (row, keys) => {
                    for (const key of Object.keys(row)) {
                        const k = key.toLowerCase().trim();
                        if (keys.some((target) => k.includes(target))) return row[key];
                    }
                    return '';
                };

                const parsed = rows
                    .map((row) => {
                        const name = String(mapCol(row, ['name', 'product', 'item']) || '').trim();
                        const priceRaw = mapCol(row, ['price', 'rate', 'cost', 'mrp']);
                        const price = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ''));
                        const unit = String(mapCol(row, ['unit', 'uom']) || 'pcs').trim() || 'pcs';
                        const category = String(mapCol(row, ['category', 'cat', 'type', 'group']) || '').trim();
                        const quantityRaw = mapCol(row, ['quantity', 'qty', 'stock']);
                        const quantity = quantityRaw ? parseInt(String(quantityRaw).replace(/[^0-9]/g, ''), 10) : 0;
                        const expiryRaw = mapCol(row, ['expiry', 'expire', 'exp', 'best before']);
                        let expiryDate = '';
                        if (expiryRaw) {
                            const d = new Date(expiryRaw);
                            if (!isNaN(d.getTime())) expiryDate = d.toISOString().split('T')[0];
                        }
                        return { name, price, unit, category, quantity, expiryDate };
                    })
                    .filter((p) => p.name && !isNaN(p.price) && p.price > 0);

                if (parsed.length === 0) {
                    setImportError('No valid products found. Make sure your file has columns: Name, Price. Optional: Unit, Category, Expiry Date.');
                    return;
                }

                setImportPreview(parsed);
                setShowImportModal(true);
            } catch (err) {
                setImportError('Failed to parse file. Please use a valid Excel (.xlsx/.xls) or CSV file.');
            }
        };
        reader.readAsArrayBuffer(file);
        // Reset so same file can be re-selected
        e.target.value = '';
    };

    const confirmImport = async () => {
        setImporting(true);
        try {
            for (const p of importPreview) {
                await addProduct(p);
            }
        } catch(err) {
            alert("Some products failed to import.");
        }
        setImporting(false);
        setShowImportModal(false);
        setImportPreview([]);
        refresh();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{products.length} product{products.length !== 1 ? 's' : ''} in inventory</p>
                </div>
                <div className="flex items-center gap-2.5">
                    {/* Import Button */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import
                    </button>
                    {/* Add Product Button */}
                    <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Product
                    </button>
                </div>
            </div>

            {/* Import Error Toast */}
            {importError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <span className="text-rose-500 text-lg">⚠️</span>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{importError}</p>
                            <p className="text-xs text-rose-500 dark:text-rose-500 mt-1">Expected columns: <strong>Name</strong>, <strong>Price</strong>. Optional: Unit, Category, Expiry Date</p>
                        </div>
                        <button onClick={() => setImportError('')} className="text-rose-400 hover:text-rose-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Filters & Search */}
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '80ms' }}>
                <div className="flex flex-col gap-3">
                    <div className="relative w-full">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === 'all'
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            All Products
                        </button>
                        <button
                            onClick={() => setFilterType('low_stock')}
                            className={`whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === 'low_stock'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-500 border border-gray-200 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Low Stock
                        </button>
                        <button
                            onClick={() => setFilterType('expiring')}
                            className={`whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === 'expiring'
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-500 border border-gray-200 dark:border-gray-700 hover:bg-rose-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Expiring Soon
                        </button>
                        <button
                            onClick={() => setFilterType('expired')}
                            className={`whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === 'expired'
                                ? 'bg-red-700 text-white shadow-sm'
                                : 'bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Expired
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 animate-fade-in">
                    <div className="text-5xl mb-4">📦</div>
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                        {search ? 'No products match your search' : 'No products yet'}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {search ? 'Try a different keyword' : 'Add your first product to get started'}
                    </p>
                    {!search && (
                        <button onClick={openAdd} className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow">
                            Add Product
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((product, i) => {
                        const expiry = getExpiryStatus(product.expiryDate);
                        const style = expiryStyles[expiry.color];
                        return (
                            <div
                                key={product.id}
                                className={`group relative rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300 animate-fade-in ${style.border}`}
                                style={{ animationDelay: `${i * 40}ms` }}
                            >
                                {/* Badges row */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    {product.category && (
                                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                            {product.category}
                                        </span>
                                    )}
                                    {/* Expiry badge */}
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${style.badge}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${expiry.status === 'critical' || expiry.status === 'expired' ? 'animate-pulse' : ''}`} />
                                        {expiry.status === 'expired' ? '⚠ Expired' : expiry.status === 'none' ? 'No expiry' : expiry.label}
                                    </span>
                                </div>

                                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate mt-1">{product.name}</h3>

                                <div className="flex items-baseline justify-between mt-2">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{product.price.toLocaleString('en-IN')}</span>
                                        <span className="text-sm text-gray-400 dark:text-gray-500">/ {product.unit}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-sm font-semibold ${(product.quantity || 0) <= 10 ? 'text-amber-500' : 'text-gray-600 dark:text-gray-400'}`}>
                                            Qty: {product.quantity || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Expiry date display */}
                                {product.expiryDate && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                        Exp: {new Date(product.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => openEdit(product)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(product.id)}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>

                                {/* Delete Confirmation */}
                                {deleteConfirm === product.id && (
                                    <div className="absolute inset-0 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-5 animate-fade-in">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Delete "{product.name}"?</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">This action cannot be undone</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />

                    {/* Modal */}
                    <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-2xl p-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingProduct ? 'Edit Product' : 'Add Product'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Product Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Basmati Rice"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        placeholder="0.00"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unit</label>
                                    <select
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    >
                                        <option value="pcs">Pieces</option>
                                        <option value="kg">Kilogram</option>
                                        <option value="g">Gram</option>
                                        <option value="l">Litre</option>
                                        <option value="ml">Millilitre</option>
                                        <option value="m">Meter</option>
                                        <option value="box">Box</option>
                                        <option value="pack">Pack</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category <span className="text-gray-400">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        placeholder="e.g. Groceries"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quantity <span className="text-gray-400">(optional)</span></label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Expiry Date <span className="text-gray-400">(optional)</span></label>
                                <input
                                    type="date"
                                    value={form.expiryDate}
                                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
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
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {editingProduct ? 'Save Changes' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Preview Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowImportModal(false); setImportPreview([]); }} />

                    <div className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-2xl flex flex-col animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Preview</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{importPreview.length}</span> product{importPreview.length !== 1 ? 's' : ''} found in file
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Table Preview */}
                        <div className="flex-1 overflow-auto p-4 no-scrollbar">
                            <table className="w-full text-sm min-w-[600px]">
                                <thead>
                                    <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <th className="px-3 py-2">#</th>
                                        <th className="px-3 py-2">Name</th>
                                        <th className="px-3 py-2">Price</th>
                                        <th className="px-3 py-2">Unit</th>
                                        <th className="px-3 py-2">Category</th>
                                        <th className="px-3 py-2 text-right">Qty</th>
                                        <th className="px-3 py-2">Expiry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {importPreview.map((p, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-3 py-2.5 text-gray-400">{i + 1}</td>
                                            <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{p.name}</td>
                                            <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">₹{p.price.toLocaleString('en-IN')}</td>
                                            <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{p.unit}</td>
                                            <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">{p.category || '—'}</td>
                                            <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 text-right font-medium">{p.quantity || 0}</td>
                                            <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400">
                                                {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-2xl">
                            <p className="text-xs text-gray-400 dark:text-gray-500">Review the products above before importing</p>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmImport}
                                    disabled={importing}
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Import {importPreview.length} Product{importPreview.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

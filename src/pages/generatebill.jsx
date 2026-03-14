import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, saveBill } from '../utils/storage';

export default function GenerateBill() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cart, setCart] = useState([]);
    
    // Checkout states
    const [showCheckout, setShowCheckout] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'flat'
    const [discountValue, setDiscountValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadProducts = async () => {
            const data = await getProducts();
            setProducts(data);
        };
        loadProducts();
    }, []);

    const categories = useMemo(() => {
        const cats = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
        return cats;
    }, [products]);

    const deferredSearch = useDeferredValue(search);
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                p.category?.toLowerCase().includes(deferredSearch.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, deferredSearch, selectedCategory]);

    const addToCart = (product) => {
        const existing = cart.find((c) => c.id === product.id);
        if (existing) {
            setCart(cart.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c)));
        } else {
            setCart([...cart, { ...product, qty: 1, discountType: 'flat', discountValue: 0 }]);
        }
    };

    const updateQty = (id, qty) => {
        if (qty <= 0) {
            setCart(cart.filter((c) => c.id !== id));
        } else {
            setCart(cart.map((c) => (c.id === id ? { ...c, qty } : c)));
        }
    };

    const updateDiscount = (id, field, value) => {
        setCart(cart.map((c) => {
            if (c.id === id) {
                const updates = { ...c, [field]: field === 'discountValue' ? (parseFloat(value) || 0) : value };
                return updates;
            }
            return c;
        }));
    };

    const getItemQty = (id) => cart.find(c => c.id === id)?.qty || 0;

    const subtotal = useMemo(() => cart.reduce((sum, item) => {
        const unitPriceAfterDiscount = item.discountType === 'percent' 
            ? item.price * (1 - (item.discountValue || 0) / 100)
            : item.price - (item.discountValue || 0);
        return sum + (unitPriceAfterDiscount * item.qty);
    }, 0), [cart]);

    const discountAmount = useMemo(() => {
        return discountType === 'percent'
            ? (subtotal * (parseFloat(discountValue) || 0)) / 100
            : parseFloat(discountValue) || 0;
    }, [subtotal, discountType, discountValue]);

    const grandTotal = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

    const handleConfirmBill = async () => {
        if (cart.length === 0 || isSaving) return;
        setIsSaving(true);
        try {
            const bill = await saveBill({
                customerName: customerName.trim() || 'Walk-in Customer',
                items: cart.map((c) => {
                    const unitPriceAfterDiscount = c.discountType === 'percent' 
                        ? c.price * (1 - (c.discountValue || 0) / 100)
                        : c.price - (c.discountValue || 0);
                    const totalLineDiscount = (c.price * c.qty) - (unitPriceAfterDiscount * c.qty);
                    
                    return {
                        id: c.id,
                        name: c.name,
                        price: c.price,
                        qty: c.qty,
                        unit: c.unit,
                        discountType: c.discountType || 'flat',
                        discountValue: c.discountValue || 0,
                        discountAmount: totalLineDiscount,
                        amount: unitPriceAfterDiscount * c.qty,
                    };
                }),
                subtotal,
                discountType,
                discountValue: parseFloat(discountValue) || 0,
                discountAmount,
                grandTotal,
            });
            navigate(`/bill/preview/${bill.id}`);
        } catch(err) {
            console.error(err);
            alert("Failed to generate bill: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Bill</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Select products to add to cart</p>
                    </div>
                    
                    <div className="relative w-full md:w-96">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                selectedCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                        <span className="text-4xl">🔍</span>
                        <p className="text-gray-500 dark:text-gray-400 mt-4">No products found matching your criteria</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {filteredProducts.map((p, i) => {
                            const qty = getItemQty(p.id);
                            return (
                                <div
                                    key={p.id}
                                    className={`group relative bg-white dark:bg-gray-900 rounded-[1.5rem] border transition-all duration-300 overflow-hidden animate-fade-in ${
                                        qty > 0 
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/5 shadow-md shadow-indigo-500/5' 
                                            : 'border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm hover:shadow-lg'
                                    }`}
                                    style={{ animationDelay: `${i * 20}ms` }}
                                >
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                {p.category || 'General'}
                                            </span>
                                            {qty > 0 && (
                                                <span className="flex h-5 w-5 rounded-full bg-indigo-600 text-white text-[9px] font-black items-center justify-center">
                                                    {qty}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {p.name}
                                        </h3>
                                        
                                        <div className="flex items-baseline gap-1 mb-3">
                                            <span className="text-sm font-black text-gray-900 dark:text-white">
                                                ₹{p.price.toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-[9px] font-medium text-gray-400">/ {p.unit}</span>
                                        </div>

                                        <div className="relative z-10">
                                            {qty > 0 ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border border-indigo-100 dark:border-indigo-500/20">
                                                        <button
                                                            onClick={() => updateQty(p.id, qty - 1)}
                                                            className="w-7 h-7 rounded-lg bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center justify-center font-black hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition-all text-xs"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="text-xs font-black text-gray-900 dark:text-white">{qty}</span>
                                                        <button
                                                            onClick={() => updateQty(p.id, qty + 1)}
                                                            className="w-7 h-7 rounded-lg bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm flex items-center justify-center font-black hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all text-xs"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <select
                                                            value={cart.find(c => c.id === p.id)?.discountType || 'flat'}
                                                            onChange={(e) => updateDiscount(p.id, 'discountType', e.target.value)}
                                                            className="px-1 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-[10px] font-bold text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                                        >
                                                            <option value="flat">₹</option>
                                                            <option value="percent">%</option>
                                                        </select>
                                                        <input
                                                            type="number"
                                                            value={cart.find(c => c.id === p.id)?.discountValue || ''}
                                                            onChange={(e) => updateDiscount(p.id, 'discountValue', e.target.value)}
                                                            placeholder="Disc"
                                                            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart(p)}
                                                    className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black hover:bg-indigo-600 dark:hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating Checkout Bar */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50 animate-slide-up">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="hidden sm:block">
                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Total Items</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{cart.length}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold mb-0.5">Total Amount</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <button 
                                onClick={() => setCart([])}
                                className="hidden sm:inline-flex items-center justify-center w-12 h-12 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                title="Clear Cart"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setShowCheckout(true)}
                                className="px-8 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                            >
                                Next Step
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckout && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowCheckout(false)} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-zoom-in">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout Details</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Finalize customer info and discounts</p>
                                </div>
                                <button onClick={() => setShowCheckout(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Customer Name</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Full Name (Optional)"
                                        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Apply Discount</label>
                                    <div className="flex gap-3">
                                        <select
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value)}
                                            className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                        >
                                            <option value="percent">% Off</option>
                                            <option value="flat">₹ Off</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                            placeholder="0"
                                            className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/40 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Subtotal ({cart.length} items)</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                                        <span>Discount</span>
                                        <span className="font-bold">− ₹{discountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">Payable</span>
                                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirmBill}
                                    disabled={isSaving}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving ? 'Processing...' : 'Confirm & Print Bill'}
                                    {!isSaving && (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, saveBill } from '../utils/storage';

export default function GenerateBill() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'flat'
    const [discountValue, setDiscountValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        setProducts(getProducts());
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const searchResults = search.trim()
        ? products.filter(
            (p) =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.category?.toLowerCase().includes(search.toLowerCase())
        )
        : products;

    const addToCart = (product) => {
        setSearch('');
        setShowDropdown(false);
        const existing = cart.find((c) => c.id === product.id);
        if (existing) {
            setCart(cart.map((c) => (c.id === product.id ? { ...c, qty: c.qty + 1 } : c)));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const updateQty = (id, qty) => {
        if (qty <= 0) {
            setCart(cart.filter((c) => c.id !== id));
        } else {
            setCart(cart.map((c) => (c.id === id ? { ...c, qty } : c)));
        }
    };

    const removeFromCart = (id) => setCart(cart.filter((c) => c.id !== id));

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const discountAmount =
        discountType === 'percent'
            ? (subtotal * (parseFloat(discountValue) || 0)) / 100
            : parseFloat(discountValue) || 0;

    const grandTotal = Math.max(0, subtotal - discountAmount);

    const handleGenerateBill = () => {
        if (cart.length === 0) return;
        const bill = saveBill({
            customerName: customerName.trim() || 'Walk-in Customer',
            items: cart.map((c) => ({
                id: c.id,
                name: c.name,
                price: c.price,
                qty: c.qty,
                unit: c.unit,
                amount: c.price * c.qty,
            })),
            subtotal,
            discountType,
            discountValue: parseFloat(discountValue) || 0,
            discountAmount,
            grandTotal,
        });
        navigate(`/bill/preview/${bill.id}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Generate Bill</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Search products, add to cart, and create an invoice</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Search & Cart */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Customer Name */}
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Customer Name</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Walk-in Customer"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Product Search */}
                    <div className="relative" ref={searchRef} style={{ zIndex: 50 }}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Search Products</label>
                        <div className="relative">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                placeholder="Type product name to search..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        {/* Search Dropdown */}
                        {showDropdown && (
                            <div className="absolute mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl" style={{ zIndex: 9999 }}>
                                {searchResults.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-gray-400">No products found</div>
                                ) : (
                                    searchResults.map((product) => (
                                        <button
                                            key={product.id}
                                            onMouseDown={(e) => { e.preventDefault(); addToCart(product); }}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                                                {product.category && (
                                                    <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{product.price.toLocaleString('en-IN')}</span>
                                                <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cart Items */}
                    <div className="animate-fade-in" style={{ animationDelay: '160ms' }}>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Cart
                                {cart.length > 0 && (
                                    <span className="ml-2 text-sm font-normal text-gray-400">({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
                                )}
                            </h2>
                            {cart.length > 0 && (
                                <button onClick={() => setCart([])} className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors">
                                    Clear All
                                </button>
                            )}
                        </div>

                        {cart.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-8 text-center">
                                <div className="text-3xl mb-2">🛒</div>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Search and add products to the cart</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow transition-shadow"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">₹{item.price.toLocaleString('en-IN')} / {item.unit}</p>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => updateQty(item.id, item.qty - 1)}
                                                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors text-sm font-bold"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.qty}
                                                onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)}
                                                className="w-12 text-center py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                            />
                                            <button
                                                onClick={() => updateQty(item.id, item.qty + 1)}
                                                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors text-sm font-bold"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Amount */}
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white w-20 text-right">
                                            ₹{(item.price * item.qty).toLocaleString('en-IN')}
                                        </p>

                                        {/* Remove */}
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Bill Summary */}
                <div className="lg:col-span-2">
                    <div className="sticky top-24 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 shadow-lg overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bill Summary</h2>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Subtotal */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Discount</label>
                                <div className="flex gap-2">
                                    <select
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                    >
                                        <option value="percent">%</option>
                                        <option value="flat">₹</option>
                                    </select>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        placeholder="0"
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                    />
                                </div>
                                {discountAmount > 0 && (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                                        − ₹{discountAmount.toLocaleString('en-IN')} discount applied
                                    </p>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100 dark:border-gray-800" />

                            {/* Grand Total */}
                            <div className="flex items-center justify-between">
                                <span className="text-base font-semibold text-gray-900 dark:text-white">Grand Total</span>
                                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    ₹{grandTotal.toLocaleString('en-IN')}
                                </span>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateBill}
                                disabled={cart.length === 0}
                                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${cart.length > 0
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {cart.length > 0 ? '🧾 Generate Bill' : 'Add items to generate bill'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

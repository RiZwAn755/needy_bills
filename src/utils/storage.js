// ── API wrappers for offline-to-online billing data ──
const API_BASE = 'http://localhost:3000/api';

// Helper to handle API responses centrally
async function fetchAPI(endpoint, options = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        credentials: 'include' // Crucial for sending JWT cookies
    });
    
    if (!res.ok) {
        let errMessage = 'API Request Failed';
        try {
            const data = await res.json();
            errMessage = data.error || errMessage;
        } catch(e) {}
        throw new Error(errMessage);
    }
    
    // For DELETE routes, there might be no content
    if (res.status === 204) return null;
    
    return res.json();
}

// ── Products ──
export async function getProducts() {
    try {
        return await fetchAPI('/products');
    } catch(err) {
        console.error("Failed fetching products:", err);
        return [];
    }
}

export async function addProduct(product) {
    return await fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(product)
    });
}

export async function updateProduct(id, updates) {
    return await fetchAPI(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

export async function deleteProduct(id) {
    await fetchAPI(`/products/${id}`, {
        method: 'DELETE'
    });
}

// ── Bills ──
export async function getBills() {
    try {
        return await fetchAPI('/bills');
    } catch(err) {
        console.error("Failed fetching bills:", err);
        return [];
    }
}

// Keep a local counter for UI optimistic updates, but the true billNumber comes from backend
const BILL_COUNTER_KEY = 'billflow_bill_counter';
export function getNextBillNumber() {
    const current = parseInt(localStorage.getItem(BILL_COUNTER_KEY) || '0', 10);
    const next = current + 1;
    localStorage.setItem(BILL_COUNTER_KEY, String(next));
    return next;
}

export async function saveBill(bill) {
    return await fetchAPI('/bills', {
        method: 'POST',
        body: JSON.stringify(bill)
    });
}

export async function deleteBill(id) {
    await fetchAPI(`/bills/${id}`, {
        method: 'DELETE'
    });
}

export async function updateBill(id, updates) {
    return await fetchAPI(`/bills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

export async function getBillById(id) {
    try {
        return await fetchAPI(`/bills/${id}`);
    } catch(err) {
         console.error("Failed fetching bill:", err);
         return null;
    }
}

// ── Expenses ──
export async function getExpenses() {
    try {
        return await fetchAPI('/expenses');
    } catch(err) {
        console.error("Failed fetching expenses:", err);
        return [];
    }
}

// ── Company Settings ──
const SETTINGS_KEY = 'billflow_settings';

export function getCompanySettings() {
    try {
        const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        return {
            name: 'Needy Bills',
            address: '',
            email: '',
            phone: '',
            gstin: '',
            footerMessage: 'Thank you for your business!',
            logo: '', // Base64 or URL
            ...stored
        };
    } catch {
        return {
            name: 'Needy Bills',
            address: '',
            email: '',
            phone: '',
            gstin: '',
            footerMessage: 'Thank you for your business!',
            logo: ''
        };
    }
}

export function saveCompanySettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function addExpense(expense) {
    return await fetchAPI('/expenses', {
        method: 'POST',
        body: JSON.stringify(expense)
    });
}

export async function updateExpense(id, updates) {
    return await fetchAPI(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

export async function deleteExpense(id) {
    await fetchAPI(`/expenses/${id}`, {
        method: 'DELETE'
    });
}

// ── Stats ──
export async function getStats() {
    const products = await getProducts();
    const bills = await getBills();
    const expenses = await getExpenses();
    const totalRevenue = bills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    return {
        totalProducts: products.length,
        totalBills: bills.length,
        totalRevenue,
        totalExpenses,
        totalProfit: totalRevenue - totalExpenses,
    };
}

// ── Profit Analytics ──
export async function getProfitAnalytics(period = 'monthly') {
    const bills = await getBills();
    const expenses = await getExpenses();

    const getKey = (dateStr) => {
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = d.getMonth(); // 0-11
        if (period === 'yearly') return `${y}`;
        if (period === 'half-yearly') return m < 6 ? `${y} H1` : `${y} H2`;
        // monthly
        return `${y}-${String(m + 1).padStart(2, '0')}`;
    };

    const revenueMap = {};
    const expenseMap = {};

    bills.forEach((b) => {
        const key = getKey(b.createdAt || b.date);
        revenueMap[key] = (revenueMap[key] || 0) + (b.grandTotal || 0);
    });

    expenses.forEach((e) => {
        const key = getKey(e.date);
        expenseMap[key] = (expenseMap[key] || 0) + (e.totalCost || 0);
    });

    // Merge all keys and sort
    const allKeys = [...new Set([...Object.keys(revenueMap), ...Object.keys(expenseMap)])].sort();

    return allKeys.map((key) => ({
        label: key,
        revenue: revenueMap[key] || 0,
        expenses: expenseMap[key] || 0,
        profit: (revenueMap[key] || 0) - (expenseMap[key] || 0),
    }));
}

export async function getProductProfitAnalytics(productName) {
    const bills = await getBills();
    const expenses = await getExpenses();

    // Revenue from this product across all bills
    let totalRevenue = 0;
    const revenueByMonth = {};
    bills.forEach((b) => {
        const key = new Date(b.createdAt || b.date).toISOString().slice(0, 7);
        (b.items || []).forEach((item) => {
            if (item.name.toLowerCase() === productName.toLowerCase()) {
                totalRevenue += item.amount || item.price * item.qty;
                revenueByMonth[key] = (revenueByMonth[key] || 0) + (item.amount || item.price * item.qty);
            }
        });
    });

    // Expenses for this product
    let totalExpense = 0;
    const expenseByMonth = {};
    expenses.forEach((e) => {
        if (e.productName?.toLowerCase() === productName.toLowerCase()) {
            totalExpense += e.totalCost || 0;
            const key = new Date(e.date).toISOString().slice(0, 7);
            expenseByMonth[key] = (expenseByMonth[key] || 0) + (e.totalCost || 0);
        }
    });

    const allKeys = [...new Set([...Object.keys(revenueByMonth), ...Object.keys(expenseByMonth)])].sort();

    return {
        totalRevenue,
        totalExpense,
        totalProfit: totalRevenue - totalExpense,
        monthly: allKeys.map((key) => ({
            label: key,
            revenue: revenueByMonth[key] || 0,
            expenses: expenseByMonth[key] || 0,
            profit: (revenueByMonth[key] || 0) - (expenseByMonth[key] || 0),
        })),
    };
}

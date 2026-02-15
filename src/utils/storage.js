// ── localStorage wrapper for offline billing data ──

const PRODUCTS_KEY = 'billflow_products';
const BILLS_KEY = 'billflow_bills';
const BILL_COUNTER_KEY = 'billflow_bill_counter';

// ── Products ──
export function getProducts() {
    try {
        return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
    } catch {
        return [];
    }
}

export function saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function addProduct(product) {
    const products = getProducts();
    const newProduct = {
        ...product,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    saveProducts(products);
    return newProduct;
}

export function updateProduct(id, updates) {
    const products = getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
    saveProducts(products);
    return products[idx];
}

export function deleteProduct(id) {
    const products = getProducts().filter((p) => p.id !== id);
    saveProducts(products);
}

// ── Bills ──
export function getBills() {
    try {
        return JSON.parse(localStorage.getItem(BILLS_KEY)) || [];
    } catch {
        return [];
    }
}

export function saveBills(bills) {
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

export function getNextBillNumber() {
    const current = parseInt(localStorage.getItem(BILL_COUNTER_KEY) || '0', 10);
    const next = current + 1;
    localStorage.setItem(BILL_COUNTER_KEY, String(next));
    return next;
}

export function saveBill(bill) {
    const bills = getBills();
    const newBill = {
        ...bill,
        id: crypto.randomUUID(),
        billNumber: getNextBillNumber(),
        date: new Date().toISOString(),
    };
    bills.unshift(newBill); // newest first
    saveBills(bills);
    return newBill;
}

export function deleteBill(id) {
    const bills = getBills().filter((b) => b.id !== id);
    saveBills(bills);
}

export function getBillById(id) {
    return getBills().find((b) => b.id === id) || null;
}

// ── Expenses ──
const EXPENSES_KEY = 'billflow_expenses';

export function getExpenses() {
    try {
        return JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
    } catch {
        return [];
    }
}

export function saveExpenses(expenses) {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
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

export function addExpense(expense) {
    const expenses = getExpenses();
    const newExpense = {
        ...expense,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    expenses.unshift(newExpense);
    saveExpenses(expenses);
    return newExpense;
}

export function updateExpense(id, updates) {
    const expenses = getExpenses();
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    expenses[idx] = { ...expenses[idx], ...updates, updatedAt: new Date().toISOString() };
    saveExpenses(expenses);
    return expenses[idx];
}

export function deleteExpense(id) {
    const expenses = getExpenses().filter((e) => e.id !== id);
    saveExpenses(expenses);
}

// ── Stats ──
export function getStats() {
    const products = getProducts();
    const bills = getBills();
    const expenses = getExpenses();
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
export function getProfitAnalytics(period = 'monthly') {
    const bills = getBills();
    const expenses = getExpenses();

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
        const key = getKey(b.date);
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

export function getProductProfitAnalytics(productName) {
    const bills = getBills();
    const expenses = getExpenses();

    // Revenue from this product across all bills
    let totalRevenue = 0;
    const revenueByMonth = {};
    bills.forEach((b) => {
        const key = new Date(b.date).toISOString().slice(0, 7);
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

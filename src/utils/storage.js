// ── API wrappers for offline-to-online billing data ──
const API_BASE = `${import.meta.env.VITE_BASE_URL}api`;

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
        // Handle session expiry
        if ((res.status === 401 || res.status === 403) && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
            return;
        }

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
export async function getBills(limit = 50, skip = 0) {
    try {
        return await fetchAPI(`/bills?limit=${limit}&skip=${skip}`);
    } catch(err) {
        console.error("Failed fetching bills:", err);
        return { bills: [], total: 0 };
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
export async function getExpenses(limit = 50, skip = 0) {
    try {
        return await fetchAPI(`/expenses?limit=${limit}&skip=${skip}`);
    } catch(err) {
        console.error("Failed fetching expenses:", err);
        return { expenses: [], total: 0 };
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
    try {
        return await fetchAPI('/stats/overall');
    } catch (err) {
        console.error("Failed fetching stats:", err);
        // Fallback or re-throw
        throw err;
    }
}

// ── Profit Analytics ──
export async function getProfitAnalytics(period = 'monthly') {
    return await fetchAPI(`/stats/profit-trend?period=${period}`);
}

export async function getProductProfitAnalytics(productName) {
    return await fetchAPI(`/stats/product?productName=${encodeURIComponent(productName)}`);
}

import { useState, useEffect, useMemo } from 'react';
import { getProfitAnalytics, getProductProfitAnalytics, getStats, getProducts, getExpenses } from '../utils/storage';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler, ArcElement);

const periods = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'half-yearly', label: 'Half-Yearly' },
    { key: 'yearly', label: 'Yearly' },
];

export default function ProfitAnalytics() {
    const [period, setPeriod] = useState('monthly');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [stats, setStats] = useState({});
    const [products, setProducts] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [productNames, setProductNames] = useState([]);
    const [overallData, setOverallData] = useState([]);
    const [productData, setProductData] = useState(null);

    // Initial Load
    useEffect(() => {
        const loadInitialData = async () => {
            const fetchedStats = await getStats();
            setStats(fetchedStats);

            const fetchedProducts = await getProducts();
            setProducts(fetchedProducts);

            const fetchedExpenses = await getExpenses();
            setExpenses(fetchedExpenses || []);

            const names = new Set();
            (fetchedProducts || []).forEach((p) => names.add(p.name));
            (fetchedExpenses || []).forEach((e) => names.add(e.productName));
            setProductNames([...names].sort());
        };
        loadInitialData();
    }, []);

    // Load Overall Analytics on Period Change
    useEffect(() => {
        const loadOverall = async () => {
            const data = await getProfitAnalytics(period);
            setOverallData(data);
        };
        loadOverall();
    }, [period]);

    // Load Per-product Analytics on Product Change
    useEffect(() => {
        const loadProduct = async () => {
            if (selectedProduct) {
                const data = await getProductProfitAnalytics(selectedProduct);
                setProductData(data);
            } else {
                setProductData(null);
            }
        };
        loadProduct();
    }, [selectedProduct]);

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#9ca3af' : '#6b7280';

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: textColor, font: { size: 12 } } },
            tooltip: {
                backgroundColor: isDark ? '#1f2937' : '#fff',
                titleColor: isDark ? '#f9fafb' : '#111827',
                bodyColor: isDark ? '#d1d5db' : '#4b5563',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`,
                },
            },
        },
        scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: {
                ticks: {
                    color: textColor,
                    callback: (v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`,
                },
                grid: { color: gridColor },
            },
        },
    };

    // Overall chart data
    const overallChartData = {
        labels: overallData.map((d) => d.label),
        datasets: [
            {
                label: 'Revenue',
                data: overallData.map((d) => d.revenue),
                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 2,
                borderRadius: 8,
            },
            {
                label: 'Expenses',
                data: overallData.map((d) => d.expenses),
                backgroundColor: 'rgba(244, 63, 94, 0.7)',
                borderColor: 'rgb(244, 63, 94)',
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };

    // Profit trend line
    const profitLineData = {
        labels: overallData.map((d) => d.label),
        datasets: [
            {
                label: 'Profit',
                data: overallData.map((d) => d.profit),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: 'rgb(16, 185, 129)',
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 2.5,
            },
        ],
    };

    // Doughnut: revenue vs expense split
    const doughnutData = {
        labels: ['Revenue', 'Expenses'],
        datasets: [
            {
                data: [stats.totalRevenue || 0, stats.totalExpenses || 0],
                backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(244, 63, 94, 0.8)'],
                borderColor: [isDark ? '#111827' : '#fff', isDark ? '#111827' : '#fff'],
                borderWidth: 3,
                hoverOffset: 8,
            },
        ],
    };

    // Per product chart
    const productChartData = productData
        ? {
            labels: productData.monthly.map((d) => d.label),
            datasets: [
                {
                    label: 'Revenue',
                    data: productData.monthly.map((d) => d.revenue),
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 2,
                    borderRadius: 8,
                },
                {
                    label: 'Expenses',
                    data: productData.monthly.map((d) => d.expenses),
                    backgroundColor: 'rgba(244, 63, 94, 0.7)',
                    borderColor: 'rgb(244, 63, 94)',
                    borderWidth: 2,
                    borderRadius: 8,
                },
            ],
        }
        : null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profit Analytics</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Revenue, expenses, and profit insights</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Revenue', value: stats.totalRevenue || 0, color: 'indigo', prefix: '₹' },
                    { label: 'Total Expenses', value: stats.totalExpenses || 0, color: 'rose', prefix: '₹' },
                    { label: 'Net Profit', value: stats.totalProfit || 0, color: (stats.totalProfit || 0) >= 0 ? 'emerald' : 'rose', prefix: '₹' },
                    { label: 'Profit Margin', value: stats.totalRevenue ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0, color: 'amber', suffix: '%' },
                ].map((card, i) => (
                    <div
                        key={card.label}
                        className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm animate-fade-in"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{card.label}</p>
                        <p className={`text-2xl font-bold mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>
                            {card.prefix || ''}{typeof card.value === 'number' && !card.suffix ? card.value.toLocaleString('en-IN') : card.value}{card.suffix || ''}
                        </p>
                    </div>
                ))}
            </div>

            {/* Period Selector */}
            <div className="flex flex-wrap items-center gap-2 mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-1">Period:</span>
                {periods.map((p) => (
                    <button
                        key={p.key}
                        onClick={() => setPeriod(p.key)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p.key
                            ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Revenue vs Expenses Bar */}
                <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-sm animate-fade-in" style={{ animationDelay: '250ms' }}>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Revenue vs Expenses</h3>
                    <div className="h-72">
                        {overallData.length > 0 ? (
                            <Bar data={overallChartData} options={commonOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No data to display yet</div>
                        )}
                    </div>
                </div>

                {/* Doughnut */}
                <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-sm animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Revenue Split</h3>
                    <div className="h-72 flex items-center justify-center">
                        {(stats.totalRevenue || stats.totalExpenses) ? (
                            <Doughnut
                                data={doughnutData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    cutout: '65%',
                                    plugins: {
                                        legend: { position: 'bottom', labels: { color: textColor, padding: 16, font: { size: 12 } } },
                                        tooltip: {
                                            callbacks: {
                                                label: (ctx) => `${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}`,
                                            },
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <div className="text-gray-400 dark:text-gray-500 text-sm">No data yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profit Trend */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-sm mb-10 animate-fade-in" style={{ animationDelay: '350ms' }}>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profit Trend</h3>
                <div className="h-72">
                    {overallData.length > 0 ? (
                        <Line data={profitLineData} options={commonOptions} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No data to display yet</div>
                    )}
                </div>
            </div>

            {/* Per-Product Analytics */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-sm animate-fade-in" style={{ animationDelay: '400ms' }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Product-Level Profit</h3>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all max-w-xs"
                    >
                        <option value="">Select a product...</option>
                        {productNames.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                {selectedProduct && productData ? (
                    <div>
                        {/* Product summary */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-4">
                                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Revenue</p>
                                <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">₹{productData.totalRevenue.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 p-4">
                                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">Expenses</p>
                                <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">₹{productData.totalExpense.toLocaleString('en-IN')}</p>
                            </div>
                            <div className={`rounded-xl p-4 ${productData.totalProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
                                <p className={`text-xs font-medium uppercase tracking-wide ${productData.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>Profit</p>
                                <p className={`text-xl font-bold mt-1 ${productData.totalProfit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>₹{productData.totalProfit.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        {/* Product chart */}
                        <div className="h-72">
                            {productData.monthly.length > 0 ? (
                                <Bar data={productChartData} options={commonOptions} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                                    No monthly data for this product yet
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                        Select a product to see its profit breakdown
                    </div>
                )}
            </div>
        </div>
    );
}

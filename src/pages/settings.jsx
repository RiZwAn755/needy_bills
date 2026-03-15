import { useState, useEffect } from 'react';
import { getCompanySettings, saveCompanySettings } from '../utils/storage';

export default function Settings() {
    const [settings, setSettings] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstin: '',
        footerMessage: '',
        logo: ''
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSettings(getCompanySettings());
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
        setSaved(false);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500 * 1024) { // 500KB limit
                alert("Logo file is too large! Please use an image under 500KB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({ ...prev, logo: reader.result }));
                setSaved(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setSettings(prev => ({ ...prev, logo: '' }));
        setSaved(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveCompanySettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const inputClass = "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-4 py-2.5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Company Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your business details used across invoices and bill previews.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Branding</h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Upload your logo for invoice headers and exports.</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">Optional</span>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                            {settings.logo ? (
                                <img src={settings.logo} alt="Logo Preview" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-3xl text-gray-300 dark:text-gray-600">🏢</span>
                            )}
                        </div>

                        <div className="flex-1">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-500/10 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-500/20 transition-colors"
                            />
                            <p className="mt-2 text-xs text-gray-400">Recommended: Square PNG/JPG, max 500KB.</p>
                            {settings.logo && (
                                <button
                                    type="button"
                                    onClick={handleRemoveLogo}
                                    className="text-xs text-red-500 hover:text-red-600 mt-2 font-medium"
                                >
                                    Remove Logo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Company Information</h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">These details appear on your bills and printed invoices.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="sm:col-span-2">
                            <label className={labelClass}>Company Name</label>
                            <input
                                type="text"
                                name="name"
                                value={settings.name}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Your Business Name"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={settings.phone}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="+91 98765 43210"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={settings.email}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="contact@example.com"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>GSTIN / Tax ID</label>
                            <input
                                type="text"
                                name="gstin"
                                value={settings.gstin}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Optional"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className={labelClass}>Address</label>
                            <textarea
                                name="address"
                                value={settings.address}
                                onChange={handleChange}
                                rows={3}
                                className={`${inputClass} resize-none`}
                                placeholder="Full business address..."
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Invoice Preferences</h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">Set footer text shown at the bottom of generated invoices.</p>

                    <div>
                        <label className={labelClass}>Footer Message (on Invoice)</label>
                        <input
                            type="text"
                            name="footerMessage"
                            value={settings.footerMessage}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="Thank you for your business!"
                        />
                    </div>
                </div>

                <div className="sticky bottom-3 z-10">
                    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white/90 dark:bg-gray-900/90 backdrop-blur p-3 sm:p-4 shadow-lg flex items-center justify-between gap-3">
                        <div className="min-h-5">
                            {saved && (
                                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
                                    Settings saved successfully! ✓
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

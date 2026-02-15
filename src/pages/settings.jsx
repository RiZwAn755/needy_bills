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

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Company Settings</h1>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm p-6 sm:p-8 space-y-6">

                {/* Logo Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
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
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 transition-colors"
                            />
                            <p className="mt-1 text-xs text-gray-400">Recommended: Square PNG/JPG, max 500KB.</p>
                            {settings.logo && (
                                <button type="button" onClick={handleRemoveLogo} className="text-xs text-red-500 hover:text-red-600 mt-2 font-medium">
                                    Remove Logo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                        <input
                            type="text"
                            name="name"
                            value={settings.name}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            placeholder="Your Business Name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GSTIN / Tax ID</label>
                        <input
                            type="text"
                            name="gstin"
                            value={settings.gstin}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={settings.phone}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            placeholder="+91 98765 43210"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={settings.email}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            placeholder="contact@example.com"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                        <textarea
                            name="address"
                            value={settings.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
                            placeholder="Full business address..."
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Footer Message (on Invoice)</label>
                        <input
                            type="text"
                            name="footerMessage"
                            value={settings.footerMessage}
                            onChange={handleChange}
                            className="w-full rounded-xl border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            placeholder="Thank you for your business!"
                        />
                    </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-4">
                    {saved && (
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
                            Settings saved successfully! ✓
                        </span>
                    )}
                    <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold shadow-lg shadow-gray-900/10 dark:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

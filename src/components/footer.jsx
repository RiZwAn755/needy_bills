export default function Footer() {
    return (
        <footer className="no-print border-t border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Left: NeedyBills logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-[10px]">B</span>
                        </div>
                        <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            NeedyBills
                        </span>
                    </div>

                    {/* Center: Made with love */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span>Made with</span>
                        <span className="text-red-500 text-base animate-pulse">❤️</span>
                        <span>by</span>
                        <a
                            href="https://needysolutions.info"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <img
                                src="https://www.needysolutions.info/assets/logo1-removebg-preview-CgBxH4Kp.png"
                                alt="Needy Solutions"
                                className="w-5 h-5 object-contain"
                            />
                            needysolutions.info
                        </a>
                    </div>

                    {/* Right: Copyright */}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        © {new Date().getFullYear()} All rights reserved to needysolutions.info.
                    </p>
                </div>
            </div>
        </footer>
    );
}

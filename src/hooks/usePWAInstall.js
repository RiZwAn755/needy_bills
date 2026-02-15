import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        // Check if already installed (running as standalone)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        setIsInstalled(isStandalone);

        // Listen for install prompt
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        // Listen for app installed
        const installedHandler = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) return false;

        try {
            deferredPrompt.prompt();
            // Removed intermediate state to prevent UI re-renders interfering with prompt

            const { outcome } = await deferredPrompt.userChoice;
            console.log('User response to install prompt:', outcome);

            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
        } catch (error) {
            console.error('Install failed:', error);
        } finally {
            setDeferredPrompt(null);
        }
    };

    return {
        isInstalled,
        canInstall: !!deferredPrompt,
        isInstalling,
        install,
    };
}

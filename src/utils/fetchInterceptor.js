// src/utils/fetchInterceptor.js

let requestsCount = 0;
const subscribers = new Set();

const triggerUpdate = () => {
    const isLoading = requestsCount > 0;
    subscribers.forEach(callback => callback(isLoading));
};

export const subscribeToLoading = (callback) => {
    subscribers.add(callback);
    callback(requestsCount > 0);
    return () => subscribers.delete(callback);
};

// Monkey patch window.fetch
const originalFetch = window.fetch;

window.fetch = async function (...args) {
    requestsCount++;
    triggerUpdate();
    
    try {
        const response = await originalFetch.apply(this, args);
        return response;
    } finally {
        requestsCount = Math.max(0, requestsCount - 1);
        triggerUpdate();
    }
};

// export const CONVEX_DEPLOYMENT = import.meta.env.VITE_CONVEX_DEPLOYMENT;
export const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
export const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
export const PAYOS_LISTS_BANK_URL = import.meta.env.VITE_PAYOS_LISTS_BANK_URL;
export const PAYOS_APP_SCRIPT = import.meta.env.VITE_PAYOS_APP_SCRIPT;
export const PAYOS_API_KEY = import.meta.env.VITE_PAYOS_API_KEY;
export const PAYOS_CLIENT_KEY = import.meta.env.VITE_PAYOS_CLIENT_KEY;
export const PAYOS_CHECKSUM_KEY = import.meta.env.VITE_PAYOS_CHECKSUM_KEY;
export const PAYOS_CHECKOUT_URL = import.meta.env.VITE_PAYOS_CHECKOUT_URL;
export const PAYOS_RETURN_URL = `${getCurrentDomain()}${import.meta.env.VITE_PAYOS_RETURN_URL}`;
export const PAYOS_CANCEL_URL = `${getCurrentDomain()}${import.meta.env.VITE_PAYOS_CANCEL_URL}?selected=`;

// if (!CONVEX_DEPLOYMENT) {
//     throw new Error('Missing VITE_CONVEX_DEPLOYMENT environment variable');
// }
if (!CONVEX_URL) {
    throw new Error("Missing VITE_CONVEX_URL environment variable");
}
if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}
if (!PAYOS_API_KEY) {
    throw new Error("Missing VITE_PAYOS_API_KEY environment variable");
}
if (!PAYOS_CLIENT_KEY) {
    throw new Error("Missing VITE_PAYOS_CLIENT_KEY environment variable");
}
if (!PAYOS_CHECKSUM_KEY) {
    throw new Error("Missing VITE_PAYOS_CHECKSUM_KEY environment variable");
}
if (!PAYOS_CHECKOUT_URL) {
    throw new Error("Missing VITE_PAYOS_CHECKOUT_URL environment variable");
}
if (!PAYOS_RETURN_URL) {
    throw new Error("Missing VITE_PAYOS_RETURN_URL environment variable");
}
if (!PAYOS_CANCEL_URL) {
    throw new Error("Missing VITE_PAYOS_CANCEL_URL environment variable");
}

function getCurrentDomain() {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }
    return "http://localhost:5173";
}

// export const CONVEX_DEPLOYMENT = import.meta.env.VITE_CONVEX_DEPLOYMENT;
export const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// if (!CONVEX_DEPLOYMENT) {
//     throw new Error('Missing VITE_CONVEX_DEPLOYMENT environment variable');
// }
if (!CONVEX_URL) {
    throw new Error("Missing VITE_CONVEX_URL environment variable");
}
if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

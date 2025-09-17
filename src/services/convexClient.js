// src/services/convexClient.js
// Lightweight Convex client helpers for queries and mutations from the frontend
import { ConvexHttpClient } from "convex/browser";

let client;

export function getConvexClient() {
  if (!client) {
    const url = import.meta.env.VITE_CONVEX_URL;
    if (!url) throw new Error("VITE_CONVEX_URL is not set");
    client = new ConvexHttpClient(url);
  }
  return client;
}

export async function convexQuery(func, args) {
  const c = getConvexClient();
  return await c.query(func, args);
}

export async function convexMutation(func, args) {
  const c = getConvexClient();
  return await c.mutation(func, args);
}

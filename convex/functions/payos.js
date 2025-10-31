"use node";
import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { createHmac } from "crypto";
import { internal } from "../_generated/api";

export const createPayOSCheckoutUrl = action({
    args: {
        orderData: v.object({
            tier: v.string(),
            price: v.number(),
            returnUrl: v.string(),
            cancelUrl: v.string(),
        }),
    },
    handler: async (ctx, { orderData }) => {
        // Call PayOS API to create checkout session
        const PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";
        const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
        const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
        // PayOS expects an integer order code; use a timestamp-based integer
        const ORDER_CODE = Date.now();

        // Ensure the return/cancel URLs carry the selected tier so the result page can read it
        const selectedId = (orderData.tier || "").toLowerCase() === "pro" ? "professional" : "basic";
        const returnUrlWithTier = appendQueryParam(orderData.returnUrl || "", "selected", selectedId);
        const cancelUrlWithTier = appendQueryParam(orderData.cancelUrl || "", "selected", selectedId);
        const response = await fetch(PAYOS_API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                // Authorization: `Bearer ${PAYOS_API_KEY}`,
                // "x-client-id": PAYOS_CLIENT_ID,
                "x-client-id": "",
                // "x-api-key": PAYOS_API_KEY,
                "x-api-key": "",
            },
            body: JSON.stringify({
                orderCode: ORDER_CODE,
                amount: orderData.price,
                description: `Subscription pack: ${orderData.tier}`,
                returnUrl: returnUrlWithTier,
                cancelUrl: cancelUrlWithTier,
                // Build HMAC signature with correct parameter mapping
                signature: buildSignature(
                    orderData.price,
                    cancelUrlWithTier,
                    `Subscription pack: ${orderData.tier}`,
                    ORDER_CODE,
                    returnUrlWithTier,
                ),
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`PayOS API error: ${errorData.message || "Unknown error"}`);
        }
        const json = await normalizeResponseStream(response.body.getReader());
        console.log("check", json);
        console.log("check url", orderData.returnUrl);

        return json.data.checkoutUrl;
    },
});

export const verifyPayOSPayment = action({
    args: {
        orderCode: v.string(),
        tier: v.string(),
        landlordId: v.id("landlords"),
    },
    handler: async (ctx, { orderCode, tier, landlordId }) => {
        try {
            const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}/invoices`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-client-id": "",
                    "x-api-key": "",
                },
            });

            if (!response.ok) {
                let detail = null;
                try {
                    detail = await response.json();
                } catch (e) {
                    try {
                        detail = await response.text();
                    } catch (_) {
                        detail = null;
                    }
                }
                return {
                    success: false,
                    paid: false,
                    code: response.status,
                    message: (detail && (detail.message || detail.desc)) || "PayOS verify failed",
                    detail,
                };
            }

            let data;
            try {
                if (response.body && response.body.getReader) {
                    data = await normalizeResponseStream(response.body.getReader());
                } else {
                    data = await response.json();
                }
            } catch (e) {
                return { success: false, paid: false, message: "Unable to parse PayOS response" };
            }

            // Determine payment status; PayOS often returns code=="00" and desc=="success"
            const desc = (data?.desc || data?.message || "").toString().toLowerCase();
            const codeOk = String(data?.code || "").toString() === "00";
            const invoiceStatus = (Array.isArray(data?.data) && data?.data?.[0]?.status) || data?.status || "";
            const statusOk = ["paid", "succeeded", "success"].includes(String(invoiceStatus).toLowerCase());
            const paid = (codeOk && desc === "success") || statusOk;

            console.log("verifyPayOSPayment", { codeOk, desc, invoiceStatus, statusOk, paid });

            if (paid) {
                // Update landlord subscription tier upon successful payment
                console.log("data", landlordId, tier);
                await ctx.runMutation(internal.functions.payosMutations.updateLandlordTier, {
                    landlordId,
                    tier,
                });

                return { success: true, paid: true, message: "Payment verified and subscription updated." };
            }

            // Not paid: do not update tier; return informative payload
            return {
                success: false,
                paid: false,
                message: data?.desc || data?.message || "Payment not successful.",
                detail: data,
            };
        } catch (err) {
            return { success: false, paid: false, message: err?.message || "Verify payment error" };
        }
    },
});

// Internal mutation to update landlord tier (actions cannot use ctx.db directly)
// Note: updateLandlordTier mutation moved to functions/payosMutations.js (non-node file)

function buildSignature(amount, cancelUrl, description, orderCode, returnUrl) {
    const CHECK_SUM_KEY = "";

    const rawString = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;

    return createHmac("sha256", CHECK_SUM_KEY).update(rawString).digest("hex");
}

async function normalizeResponseStream(reader) {
    const decoder = new TextDecoder();
    let parts = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    return JSON.parse(parts.join(""));
}

function appendQueryParam(urlStr, key, value) {
    try {
        if (!urlStr) return "";
        const url = new URL(urlStr, "http://localhost:5173/landlord/payments/package/result/");
        // If urlStr is absolute, base is ignored; if relative, base allows URL constructor usage
        url.searchParams.set(key, value);
        console.log("appended url", url.toString());
        // Preserve relative form if original was relative
        if (!/^https?:\/\//i.test(urlStr)) {
            return url.pathname + (url.search || "") + (url.hash || "");
        }
        return url.toString();
    } catch {
        // Fallback: naive append
        const sep = urlStr.includes("?") ? "&" : "?";
        return `${urlStr}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
}

function hashSelectedTier(selected) {
    const hashed = `selected=${selected}`;
    return createHmac("sha256").update(hashed).digest("hex");
}

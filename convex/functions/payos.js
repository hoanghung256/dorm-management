"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { createHmac } from "crypto";
import { internal } from "../_generated/api";

// Call PayOS API to create checkout session
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || "";
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || "";
const CHECK_SUM_KEY = process.env.CHECK_SUM_KEY || "";

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
        // PayOS expects an integer order code; use a timestamp-based integer
        const ORDER_CODE = Date.now();

        // Ensure the return/cancel URLs carry the selected tier so the result page can read it
        const selectedId = (orderData.tier || "").toLowerCase() === "pro" ? "professional" : "basic";
        console.log("Selected ID:", selectedId);
        const hashSelectedId = hashSelectedTier(selectedId);
        const returnUrlWithTier = appendQueryParam(orderData.returnUrl || "", "selected", hashSelectedId);
        const cancelUrlWithTier = appendQueryParam(orderData.cancelUrl || "", "selected", hashSelectedId);
        const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-client-id": PAYOS_CLIENT_ID,
                "x-api-key": PAYOS_API_KEY,
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
                    "x-client-id": PAYOS_CLIENT_ID,
                    "x-api-key": PAYOS_API_KEY,
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
                const rawTier = findTierFromHash(tier);
                if (rawTier) {
                    await ctx.runMutation(internal.functions.payosMutations.updateLandlordTier, {
                        landlordId,
                        tier: rawTier, // can be "professional"|"basic"|"Pro"|"Basic"; mutation normalizes
                    });
                } else {
                    return { message: "Unable to determine tier from payment data" };
                }

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
        const isAbsolute = /^https?:\/\//i.test(urlStr);
        const publicDomain = "https://tubbiestech.site";
        const baseForRelative = publicDomain || "http://localhost:5173";
        const url = new URL(urlStr, baseForRelative);
        url.searchParams.set(key, value);
        console.log("appended url", url.toString());
        if (!isAbsolute) {
            if (publicDomain) return url.toString();
            return url.pathname + (url.search || "") + (url.hash || "");
        }
        return url.toString();
    } catch {
        const sep = urlStr.includes("?") ? "&" : "?";
        return `${urlStr}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
}

function hashSelectedTier(selected) {
    const hashed = `selected=${selected}`;
    return createHmac("sha256", CHECK_SUM_KEY).update(hashed).digest("hex");
}

function findTierFromHash(hash) {
    const tiers = ["basic", "professional"];
    for (const tier of tiers) {
        if (hash === hashSelectedTier(tier)) {
            return tier;
        }
    }
    return null;
}

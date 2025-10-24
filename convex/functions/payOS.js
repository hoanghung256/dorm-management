"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import crypto from "crypto";
import axios from "axios";

const PAYOS = {
  clientId: process.env.PAYOS_CLIENT_ID || "57a755b1-bca3-4898-ae57-76696758094e",
  apiKey: process.env.PAYOS_API_KEY || "8f6f3e2e-5d3b-4f7c-9f4d-1a2b3c4d5e6f",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "bab5d517a79063292cc2a1cbbf8564ebc39acede026b14531dbbfa8187cc5e38",
  baseUrl: process.env.PAYOS_BASE_URL || "https://api-merchant.payos.vn",
};

// Log PayOS config để debug
console.log('[PayOS] Config check:');
console.log('- Client ID:', PAYOS.clientId ? 'Set' : 'Missing');
console.log('- API Key:', PAYOS.apiKey ? 'Set' : 'Missing');
console.log('- Checksum Key:', PAYOS.checksumKey ? 'Set' : 'Missing');
console.log('- Base URL:', PAYOS.baseUrl);

// Tạo chữ ký đúng chuẩn PayOS production
function createSignature(orderCode, amount, description, returnUrl, cancelUrl) {
  // Use explicit sanitized description (remove pipe characters)
    const desc = (description || "").replace(/[|]/g, "-").trim(); // Sanitize description
    const stringToSign = `${orderCode}|${amount}|${desc}|${returnUrl}|${cancelUrl}`; // Change order to orderCode|amount|description|returnUrl|cancelUrl

  console.log('[PayOS] stringToSign:', stringToSign);
  console.log('[PayOS] checksumKey length:', PAYOS.checksumKey.length);

  const signature = crypto.createHmac("sha256", PAYOS.checksumKey).update(stringToSign).digest("hex");
  console.log('[PayOS] generated signature:', signature);
  return signature;
}


export const createPayOSPayment = action({
  args: {
    landlordId: v.id("landlords"),
    tier: v.union(v.literal("Basic"), v.literal("Pro")),
    amount: v.number(),
    description: v.string(),
  },
  handler: async (ctx, { landlordId, tier, amount, description }) => {
    if (!PAYOS.clientId || !PAYOS.apiKey || !PAYOS.checksumKey) {
      throw new Error("Missing PayOS credentials. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY in .env.local and redeploy.");
    }
  // Use a numeric order code to match schema expectations
  const orderCode = Date.now();
  // Use environment-configured callback URLs if present, otherwise fall back
  // to the public domain. This ensures the signature uses the exact URLs
  // PayOS expects in production.
  // Prefer explicit non-localhost env values; if env contains localhost (dev),
  // fall back to the public tubbiestech.site endpoints used for PayOS production signatures.
  const envReturn = process.env.PAYOS_RETURN_URL || "";
  const envCancel = process.env.PAYOS_CANCEL_URL || "";
  const returnUrl = envReturn && !envReturn.includes("localhost")
    ? envReturn
    : "https://tubbiestech.site/landlord/payments/package/success";
  const cancelUrl = envCancel && !envCancel.includes("localhost")
    ? envCancel
    : "https://tubbiestech.site/landlord/payments/package/cancel";
  // Log environment and convex deployment info to help debug mismatched URLs
  console.log('[PayOS] process.env.PAYOS_RETURN_URL:', process.env.PAYOS_RETURN_URL);
  console.log('[PayOS] process.env.PAYOS_CANCEL_URL:', process.env.PAYOS_CANCEL_URL);
  console.log('[PayOS] CONVEX_DEPLOYMENT:', process.env.CONVEX_DEPLOYMENT);
  console.log('[PayOS] CONVEX_SITE_URL:', process.env.CONVEX_SITE_URL);
  // Không truyền webhookUrl/signature vào body
  console.log("[PayOS] baseUrl:", PAYOS.baseUrl);
  console.log('[PayOS] using returnUrl:', returnUrl);
  console.log('[PayOS] using cancelUrl:', cancelUrl);
  const signature = createSignature(String(orderCode), amount, description, returnUrl, cancelUrl);
    // Compute alternative signature variants to help with PayOS validation edge cases
    // (different field orders or URL-encoding). We include them as extra headers
    // for debugging — PayOS ignores unknown headers but the logs will help.
    const signatureAltOrder = crypto.createHmac("sha256", PAYOS.checksumKey)
      .update(`${amount}|${orderCode}|${description}|${returnUrl}|${cancelUrl}`)
      .digest("hex");
    const encodedReturn = encodeURIComponent(returnUrl);
    const encodedCancel = encodeURIComponent(cancelUrl);
    const signatureEncodedUrls = crypto.createHmac("sha256", PAYOS.checksumKey)
      .update(`${orderCode}|${amount}|${description}|${encodedReturn}|${encodedCancel}`)
      .digest("hex");

    const headers = {
      "x-client-id": PAYOS.clientId,
      "x-api-key": PAYOS.apiKey,
      "Content-Type": "application/json",
      // Primary signature (canonical order)
      "x-signature": signature,
      // Extra variants for debugging/compatibility
      "x-signature-alt": signatureAltOrder,
      "x-signature-enc": signatureEncodedUrls,
      // Common alternate header names PayOS integrations sometimes expect
      "x-checksum": signature,
      "signature": signature,
    };
    // PayOS API v2 payment-requests payload format
    const payload = {
      orderCode: String(orderCode), // PayOS expects string for orderCode
      amount: amount, // Amount in VND (integer)
      description: description, // Payment description
      returnUrl: returnUrl, // URL to return after successful payment
      cancelUrl: cancelUrl, // URL to return after cancelled payment
  signature: signature, // include signature in body as well
    };
    console.log('[PayOS] payload gửi lên:', JSON.stringify(payload, null, 2));
    Object.entries(payload).forEach(([key, value]) => {
      console.log(`[PayOS] ${key}:`, value, 'type:', typeof value);
    });
    try {
      console.log('[PayOS] signature (hex):', signature);
      console.log('[PayOS] Request headers:', JSON.stringify(headers, null, 2));
      
      const res = await axios.post(
        `${PAYOS.baseUrl}/v2/payment-requests`,
        payload,
        { 
          headers,
          timeout: 30000 // 30 second timeout
        }
      );
      
      console.log("PayOS response status:", res.status);
      console.log("PayOS response data:", JSON.stringify(res.data, null, 2));
      
      if (!res.data?.data) {
        console.error("PayOS response missing data field:", res.data);
        throw new Error("PayOS did not return payment data");
      }
      
      const { checkoutUrl, qrCode } = res.data.data;
      
      if (!checkoutUrl) {
        console.error("PayOS response missing checkoutUrl:", res.data.data);
        throw new Error("PayOS did not return checkout URL");
      }
      
      // Save payment request to database
      await ctx.runMutation("paymentRequests:create", {
        landlordId,
        tier,
        orderCode,
        amount,
        status: "pending",
        createdAt: Date.now(),
      });
      
      console.log('[PayOS] Payment request created successfully with orderCode:', orderCode);
      return { checkoutUrl, qrCode, orderCode };
    } catch (err) {
      console.error("PayOS API error details:");
      console.error("- Status:", err?.response?.status);
      console.error("- Status text:", err?.response?.statusText);
      console.error("- Response data:", err?.response?.data);
      console.error("- Request config:", err?.config?.url, err?.config?.method);
      
      const errorMessage = err?.response?.data?.desc || 
                          err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          err.message;
      
      throw new Error(`Failed to create PayOS payment link: ${errorMessage}`);
    }
  },
});

// ✅ Xử lý webhook PayOS gửi về
export const handlePayOSWebhook = action({
  args: {
    orderCode: v.union(v.number(), v.string()),
    status: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, { orderCode, status, amount }) => {
    try {
      // Convert orderCode to number if it's a string
      const numericOrderCode = typeof orderCode === 'string' ? parseInt(orderCode, 10) : orderCode;
      console.log('[PayOS Webhook] Processing orderCode:', numericOrderCode, 'status:', status, 'amount:', amount);
      
      const paymentRequest = await ctx.runQuery("paymentRequests:getByOrderCode", { orderCode: numericOrderCode });
      if (!paymentRequest) {
        console.error('[PayOS Webhook] Payment request not found for orderCode:', numericOrderCode);
        throw new Error("Payment request not found");
      }

      console.log('[PayOS Webhook] Found payment request:', paymentRequest._id);

      if (status === "PAID") {
        console.log('[PayOS Webhook] Payment confirmed, creating subscription...');
        
        const currentDate = new Date();
        const startMonth = currentDate.getMonth() + 1;
        const startYear = currentDate.getFullYear();
        const endMonth = startMonth === 12 ? 1 : startMonth + 1;
        const endYear = startMonth === 12 ? startYear + 1 : startYear;

        // Create subscription
        await ctx.runMutation("subscriptions:create", {
          landlordId: paymentRequest.landlordId,
          tier: paymentRequest.tier,
          periods: {
            start: startYear * 12 + startMonth,
            end: endYear * 12 + endMonth,
          },
        });

        // Update landlord tier
        await ctx.runMutation("landlords:updateTier", {
          landlordId: paymentRequest.landlordId,
          tier: paymentRequest.tier,
        });
        
        console.log('[PayOS Webhook] Subscription created and landlord tier updated');
      }

      // Update payment request status
      await ctx.runMutation("paymentRequests:updateStatus", {
        paymentRequestId: paymentRequest._id,
        status: status === "PAID" ? "completed" : "failed",
        updatedAt: Date.now(),
      });

      console.log('[PayOS Webhook] Payment request status updated to:', status === "PAID" ? "completed" : "failed");
      return { success: true };
    } catch (error) {
      console.error('[PayOS Webhook] Error processing webhook:', error);
      throw error;
    }
  },
});

// convex/functions/payments.js
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listByInvoice = query({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, { invoiceId }) => {
        return await ctx.db
            .query("paymentEvidences")
            .withIndex("by_invoice", (q) => q.eq("invoiceId", invoiceId))
            .collect();
    },
});

export const submitEvidence = mutation({
    args: {
        invoiceId: v.id("invoices"),
        renterId: v.id("renters"),
        files: v.array(v.object({ url: v.string(), type: v.optional(v.string()) })),
    },
    handler: async (ctx, { invoiceId, renterId, files }) => {
        const inv = await ctx.db.get(invoiceId);
        if (!inv) throw new Error("Invoice not found");

        const now = Date.now();
        const id = await ctx.db.insert("paymentEvidences", {
            invoiceId,
            renterId,
            files,
            submittedAt: now,
            status: "pending",
        });
        const firstUrl = files[0]?.url || null;
        await ctx.db.patch(invoiceId, { status: "pending", evidenceUrls: firstUrl });
        return id;
    },
});

export const reviewEvidence = mutation({
    args: { evidenceId: v.id("paymentEvidences"), approve: v.boolean(), reason: v.optional(v.string()) },
    handler: async (ctx, { evidenceId, approve, reason }) => {
        const ev = await ctx.db.get(evidenceId);
        if (!ev) throw new Error("Evidence not found");
        const newStatus = approve ? "approved" : "rejected";
        await ctx.db.patch(evidenceId, { status: newStatus, reason });

        // When approved, mark invoice paid
        if (approve) {
            await ctx.db.patch(ev.invoiceId, { status: "paid" });
        } else {
            await ctx.db.patch(ev.invoiceId, { status: "rejected" });
        }
        return { ok: true };
    },
});

export const listInvoicesForRenter = query({
    args: { renterId: v.id("renters") },
    handler: async (ctx, { renterId }) => {
        const renter = await ctx.db.get(renterId);
        if (!renter || !renter.assignedRoomId) return [];
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_room", (q) => q.eq("roomId", renter.assignedRoomId))
            .collect();
        if (!invoices.length) return [];
        const room = await ctx.db.get(renter.assignedRoomId);
        const roomCode = room?.code || "";
        invoices.sort((a, b) => (b.period?.start || 0) - (a.period?.start || 0));
        return invoices.map((inv) => {
            return {
                ...inv,
                roomCode,
                evidenceUrl: inv.evidenceUrls || null,
            };
        });
    },
});

// Note: PayOS payment creation lives in `convex/functions/payOS.js` as an action
// to avoid confusion between mutation/action runtimes and to centralize PayOS
// credential handling. The old mutation implementation was removed.

export const handlePayOSWebhook = mutation({
    args: {
        orderCode: v.number(),
        status: v.string(),
        amount: v.number(),
    },
    handler: async (ctx, { orderCode, status, amount }) => {
        // Find the payment request
        const paymentRequest = await ctx.db
            .query("paymentRequests")
            .withIndex("by_order_code", (q) => q.eq("orderCode", orderCode))
            .first();

        if (!paymentRequest) {
            throw new Error("Payment request not found");
        }

        if (status === "PAID") {
            // Update subscription
            const currentDate = new Date();
            const startMonth = currentDate.getMonth() + 1; // Next month
            const startYear = currentDate.getFullYear();
            const endMonth = startMonth === 12 ? 1 : startMonth + 1;
            const endYear = startMonth === 12 ? startYear + 1 : startYear;

            await ctx.db.insert("subscriptions", {
                landlordId: paymentRequest.landlordId,
                tier: paymentRequest.tier,
                periods: {
                    start: startYear * 12 + startMonth,
                    end: endYear * 12 + endMonth,
                },
            });

            // Update landlord tier
            await ctx.db.patch(paymentRequest.landlordId, {
                subscriptionTier: paymentRequest.tier,
            });
        }

        // Update payment request status
        await ctx.db.patch(paymentRequest._id, {
            status: status === "PAID" ? "completed" : "failed",
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

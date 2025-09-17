// convex/functions/invoices.js
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { sendEmail } from "./email";

function calcTotal(baseItems) {
  // Sum price fields from prepared items
  return baseItems.reduce((sum, it) => sum + (it.amount ?? 0), 0);
}

export const listByRoomAndPeriod = query({
  args: { roomId: v.id("rooms"), period: v.optional(v.string()) },
  handler: async (ctx, { roomId, period }) => {
    let q = ctx.db.query("invoices").withIndex("by_room", q => q.eq("roomId", roomId));
    if (period) {
      q = q.filter(f => f.eq(f.field("period"), period));
    }
    return await q.collect();
  }
});

// Build invoice from room, landlord expense templates, and inputs
export const create = mutation({
  args: {
    roomId: v.id("rooms"),
    period: v.string(), // YYYY-MM
    currency: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    items: v.array(v.object({ label: v.string(), amount: v.number() })),
  },
  handler: async (ctx, { roomId, period, currency = "VND", dueDate, items }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");
    const landlord = await ctx.db.get(room.landlordId);

    // Ensure idempotency per (roomId, period)
    const existing = await ctx
      .db
      .query("invoices")
      .withIndex("by_room", q => q.eq("roomId", roomId))
      .filter(q => q.eq(q.field("period"), period))
      .first();
    if (existing) return existing._id;

    const total = calcTotal(items);
    const now = Date.now();
    const id = await ctx.db.insert("invoices", {
      roomId,
      period,
      dueDate,
      totalAmount: total,
      currency,
      status: "pending",
      createdAt: now,
    });

    // T030 Basic tier auto-email: notify renter (stub - send to landlord alias until renter contact/email field is standardized)
    if ((landlord?.subscriptionTier || 'Free') === 'Basic') {
      try {
        await sendEmail({
          to: [landlord?.contactEmail || 'noreply@example.com'],
          subject: `Invoice ${period} created`,
          html: `<p>Invoice ${period} for room ${room.code} created with total ${total} ${currency}</p>`,
        });
      } catch (e) {
        console.warn('Email stub failed:', e?.message);
      }
    }
    return id;
  }
});

export const updateStatus = mutation({
  args: { invoiceId: v.id("invoices"), status: v.string() },
  handler: async (ctx, { invoiceId, status }) => {
    const allowed = ["pending", "submitted", "approved", "rejected", "paid"];
    if (!allowed.includes(status)) throw new Error("Invalid status");
    const inv = await ctx.db.get(invoiceId);
    if (!inv) throw new Error("Invoice not found");
    await ctx.db.patch(invoiceId, { status });
    return { ok: true };
  }
});

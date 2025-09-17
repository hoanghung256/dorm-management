// convex/functions/notifications.js
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listByLandlord = query({
  args: { landlordId: v.id("landlords") },
  handler: async (ctx, { landlordId }) => {
    return await ctx.db.query("notifications").withIndex("by_landlord", q => q.eq("landlordId", landlordId)).collect();
  }
});

export const create = mutation({
  args: {
    landlordId: v.id("landlords"),
    title: v.string(),
    content: v.string(),
    targetAll: v.boolean(),
    renterIds: v.optional(v.array(v.id("renters"))),
  },
  handler: async (ctx, { landlordId, title, content, targetAll, renterIds }) => {
    const now = Date.now();
    return await ctx.db.insert("notifications", {
      landlordId,
      title,
      content,
      targetAll,
      renterIds,
      createdAt: now,
      readBy: [],
    });
  }
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications"), renterId: v.id("renters") },
  handler: async (ctx, { notificationId, renterId }) => {
    const n = await ctx.db.get(notificationId);
    if (!n) throw new Error("Notification not found");
    const readBy = new Set(n.readBy || []);
    readBy.add(renterId);
    await ctx.db.patch(notificationId, { readBy: Array.from(readBy) });
    return { ok: true };
  }
});

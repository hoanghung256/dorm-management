import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    landlordId: v.id("landlords"),
    tier: v.union(v.literal("Basic"), v.literal("Pro")),
    orderCode: v.number(),
    amount: v.number(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("paymentRequests", args);
  },
});

export const getByOrderCode = query({
  args: { orderCode: v.number() },
  handler: async (ctx, { orderCode }) => {
    return await ctx.db
      .query("paymentRequests")
      .withIndex("by_order_code", (q) => q.eq("orderCode", orderCode))
      .first();
  },
});

export const updateStatus = mutation({
  args: {
    paymentRequestId: v.id("paymentRequests"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    updatedAt: v.number(),
  },
  handler: async (ctx, { paymentRequestId, status, updatedAt }) => {
    await ctx.db.patch(paymentRequestId, { status, updatedAt });
  },
});

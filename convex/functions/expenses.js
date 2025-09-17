// convex/functions/expenses.js
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listByLandlord = query({
  args: { landlordId: v.id("landlords") },
  handler: async (ctx, { landlordId }) => {
    return await ctx.db.query("expenseItems").withIndex("by_landlord", q => q.eq("landlordId", landlordId)).collect();
  }
});

export const create = mutation({
  args: {
    landlordId: v.id("landlords"),
    type: v.string(),
    unit: v.string(),
    price: v.number(),
    scope: v.string(),
  },
  handler: async (ctx, { landlordId, type, unit, price, scope }) => {
    const now = Date.now();
    return await ctx.db.insert("expenseItems", { landlordId, type, unit, price, scope, createdAt: now });
  }
});

export const update = mutation({
  args: { itemId: v.id("expenseItems"), type: v.optional(v.string()), unit: v.optional(v.string()), price: v.optional(v.number()), scope: v.optional(v.string()) },
  handler: async (ctx, { itemId, ...patch }) => {
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Expense item not found");
    await ctx.db.patch(itemId, patch);
    return { ok: true };
  }
});

export const remove = mutation({
  args: { itemId: v.id("expenseItems") },
  handler: async (ctx, { itemId }) => {
    await ctx.db.delete(itemId);
    return { ok: true };
  }
});

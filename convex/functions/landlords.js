import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateTier = mutation({
    args: {
        landlordId: v.id("landlords"),
        tier: v.union(v.literal("Free"), v.literal("Basic"), v.literal("Pro")),
    },
    handler: async (ctx, { landlordId, tier }) => {
        await ctx.db.patch(landlordId, { subscriptionTier: tier });
    },
});
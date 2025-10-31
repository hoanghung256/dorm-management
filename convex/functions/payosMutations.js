import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";

// Non-node module: mutations/queries go here
export const updateLandlordTier = internalMutation({
    args: {
        landlordId: v.id("landlords"),
        tier: v.string(), // expected: "Free" | "Basic" | "Pro"
    },
    handler: async (ctx, { landlordId, tier }) => {
        const normalized = ["Free", "Basic", "Pro"].includes(tier) ? tier : "Free";
        await ctx.db.patch(landlordId, { subscriptionTier: normalized });
        console.log("Updated landlord tier", landlordId, normalized);
        return { ok: true };
    },
});

// convex/functions/subscriptions.js
import { query } from "../_generated/server";
import { v } from "convex/values";

// Pack limits:
// - Free: same limits as Basic
// - Basic: 1 dorm, 15 rooms
// - Pro: unlimited (null = no limit)
const PACK_LIMITS = {
    Free: { dormLimit: 1, roomLimit: 15 },
    Basic: { dormLimit: 1, roomLimit: 15 },
    Pro: { dormLimit: null, roomLimit: null },
};

function resolveTier(landlord) {
    const tier = landlord?.subscriptionTier || "Free";
    return ["Free", "Basic", "Pro"].includes(tier) ? tier : "Free";
}

// Limits by current tier only
export const getLimits = query({
    args: { landlordId: v.id("landlords") },
    handler: async (ctx, { landlordId }) => {
        const landlord = await ctx.db.get(landlordId);
        if (!landlord) throw new Error("Landlord not found");
        const tier = resolveTier(landlord);
        const { dormLimit, roomLimit } = PACK_LIMITS[tier];
        return { tier, limits: { dormLimit, roomLimit } };
    },
});

// Trial-aware: Free behaves like Basic for 30 days from users.createdAt
export const getTrialAwareLimits = query({
    args: { landlordId: v.id("landlords") },
    handler: async (ctx, { landlordId }) => {
        const landlord = await ctx.db.get(landlordId);
        if (!landlord) throw new Error("Landlord not found");

        const user = await ctx.db.get(landlord.userId);
        const now = Date.now();
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const startedAt = user?.createdAt ?? now;
        const daysElapsed = Math.floor((now - startedAt) / MS_PER_DAY);
        const daysLeft = Math.max(0, 30 - daysElapsed);
        const expired = daysElapsed >= 30;

        const tier = resolveTier(landlord);
        const { dormLimit, roomLimit } = PACK_LIMITS[tier];

        return {
            tier,
            trial: { startedAt, daysElapsed, daysLeft, expired },
            limits: { dormLimit, roomLimit },
        };
    },
});

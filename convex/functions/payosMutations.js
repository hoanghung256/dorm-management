import { mutation } from "../_generated/server";
import { v } from "convex/values";

const PACK_LIMITS = {
    Free: { dormLimit: 1, roomLimit: 15 },
    Basic: { dormLimit: 1, roomLimit: 15 },
    // For unlimited, do NOT use null (schema doesn't allow null). Omit the fields instead.
    Pro: { dormLimit: undefined, roomLimit: undefined },
};

function normalizeTier(input) {
    const s = String(input || "").toLowerCase();
    if (s === "pro" || s === "professional") return "Pro";
    if (s === "basic") return "Basic";
    if (s === "free") return "Free";
    return "Free";
}

export const updateLandlordTier = mutation({
    args: {
        landlordId: v.id("landlords"),
        tier: v.string(),
    },
    handler: async (ctx, { landlordId, tier }) => {
        const landlord = await ctx.db.get(landlordId);
        if (!landlord) throw new Error("Landlord not found");

        const normalized = normalizeTier(tier);
        const limits = PACK_LIMITS[normalized];

        const patch = { subscriptionTier: normalized };
        if (typeof limits.dormLimit === "number") {
            patch.dormLimit = limits.dormLimit;
        } else {
            patch.dormLimit = undefined;
        }
        if (typeof limits.roomLimit === "number") {
            patch.roomLimit = limits.roomLimit;
        } else {
            patch.roomLimit = undefined;
        }

        await ctx.db.patch(landlordId, patch);

        return { ok: true, tier: normalized, limits };
    },
});

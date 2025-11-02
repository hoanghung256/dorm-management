import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Query for admin dashboard - returns a sanitized list of users (no sensitive fields)
export const listAllUsersForAdmin = query({
    handler: async (ctx) => {
        // Collect all users
        const allUsers = await ctx.db.query("users").collect();

        const results = [];

        for (const u of allUsers) {
            const base = {
                _id: u._id,
                name: u.name || "",
                email: u.email || "",
                role: u.role || null,
            };

            // Add landlord subscription summary (non-sensitive)
            if (u.role === "landlord") {
                const landlord = await ctx.db
                    .query("landlords")
                    .withIndex("by_user", (q) => q.eq("userId", u._id))
                    .unique();

                base.subscription = landlord
                    ? {
                          subscriptionTier: landlord.subscriptionTier || "Free",
                          // dormLimit/roomLimit are optional numbers in schema; may be undefined for unlimited
                          dormLimit: landlord.dormLimit,
                          roomLimit: landlord.roomLimit,
                          overageFeePerRoom: landlord.overageFeePerRoom,
                      }
                    : null;
            }

            // Add renter summary (non-sensitive)
            if (u.role === "renter") {
                const renter = await ctx.db
                    .query("renters")
                    .withIndex("by_user", (q) => q.eq("userId", u._id))
                    .unique();
                base.renter = renter ? { active: !!renter.active } : null;
            }

            results.push(base);
        }

        return results;
    },
});

// Simple revenue aggregation: sum of paid invoices per landlord, grouped by landlord subscription tier.
export const revenueByTier = query({
    args: { period: v.optional(v.string()) }, // YYYY-MM optional filter
    handler: async (ctx, { period }) => {
        // Build a map landlordId -> tier
        const landlords = await ctx.db.query("landlords").collect();
        const tierByLandlord = new Map(landlords.map((l) => [l._id, l.subscriptionTier || "Free"]));

        // Collect paid invoices (optionally by period)
        let invoicesQ = ctx.db.query("invoices").filter((q) => q.eq(q.field("status"), "paid"));
        if (period) {
            invoicesQ = invoicesQ.filter((q) => q.eq(q.field("period"), period));
        }
        const invoices = await invoicesQ.collect();

        // Need to map invoice -> landlord (via room)
        const tierTotals = new Map();
        for (const inv of invoices) {
            const room = await ctx.db.get(inv.roomId);
            if (!room) continue;
            const tier = tierByLandlord.get(room.landlordId) || "Free";
            tierTotals.set(tier, (tierTotals.get(tier) || 0) + (inv.totalAmount || 0));
        }
        // Return as array for ease of consumption
        return Array.from(tierTotals.entries()).map(([tier, total]) => ({ tier, total }));
    },
});

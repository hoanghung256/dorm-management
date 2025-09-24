import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const getUserByClerkId = query({
    args: {
        clerkUserId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk", (q) => q.eq("clerkUserId", args.clerkUserId))
            .unique();

        if (user) {
            if (user.role === "landlord") {
                const landlordDetail = await ctx.db
                    .query("landlords")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .unique();
                user.detail = landlordDetail;
            } else if (user.role === "renter") {
                const renterDetail = await ctx.db
                    .query("renters")
                    .withIndex("by_user", (q) => q.eq("userId", user._id))
                    .unique();
                user.detail = renterDetail;
            }
        }

        return user ?? null;
    },
});

export const createUser = mutation({
    handler: async (ctx, args) => {
        const { clerkUserId, name, email, role, birthDate, phone, hometown } = args;
        const userId = await ctx.db.insert("users", {
            clerkUserId,
            name,
            email,
            role,
            birthDate,
            phone,
            hometown,
        });
        let user = {
            id: userId,
            name,
            email,
            role,
            birthDate,
            phone,
            hometown,
        };

        if (userId) {
            if (role === "landlord") {
                const landlordId = await ctx.db.insert("landlords", {
                    userId: userId,
                    subscriptionTier: "Free",
                    dormLimit: 5,
                    overageFeePerRoom: 0,
                });
                user.detail = {
                    _id: landlordId,
                    subscriptionTier: "Free",
                    dormLimit: 5,
                    overageFeePerRoom: 0,
                };
            } else if (role === "renter") {
                const renterId = await ctx.db.insert("renters", {
                    userId: userId,
                    active: true,
                });
                user.detail = {
                    _id: renterId,
                    active: true,
                };
            }
        }

        return user;
    },
});

export const getById = query({
    args: { landlordId: v.id("landlords") },
    handler: async (ctx, { landlordId }) => {
        const doc = await ctx.db.get(landlordId);
        return doc ? { _id: doc._id, name: doc.name ?? null } : null;
    },
});

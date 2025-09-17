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

        return user ?? null;
    },
});

export const createUser = mutation({
    handler: async (ctx, args) => {
        const { clerkUserId, name, email, role, birthDate, phone, address } = args;
        const userId = await ctx.db.insert("users", {
            clerkUserId,
            name,
            email,
            role,
            birthDate,
            phone,
            address,
        });
        return userId;
    },
});

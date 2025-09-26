// convex/schema.js
// Convex schema for Dormitory Management System
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkUserId: v.string(),
        email: v.string(),
        role: v.optional(v.union(v.literal("landlord"), v.literal("renter"))),
        name: v.optional(v.string()),
        birthDate: v.optional(v.string()),
        phone: v.optional(v.string()),
        hometown: v.optional(v.string()),
    }).index("by_clerk", ["clerkUserId"]),

    landlords: defineTable({
        userId: v.id("users"),
        subscriptionTier: v.optional(v.union(v.literal("Free"), v.literal("Basic"), v.literal("Pro"))),
        dormLimit: v.optional(v.number()),
        overageFeePerRoom: v.optional(v.number()),
    }).index("by_user", ["userId"]),

    renters: defineTable({
        userId: v.id("users"),
        active: v.boolean(),
        assignedRoomId: v.optional(v.id("rooms")),
        assignedAt: v.optional(v.number()),
    }).index("by_user", ["userId"]),

    dorms: defineTable({
        name: v.string(),
        address: v.string(),
        landlordId: v.id("landlords"),
        involveDueDate: v.number(),
    }).index("by_landlord", ["landlordId"]),

    amenities: defineTable({
        dormId: v.id("dorms"),
        name: v.string(),
        type: v.optional(
            v.union(
                v.literal("electricity"),
                v.literal("water"),
                v.literal("internet"),
                v.literal("garbage"),
                v.literal("elevator"),
                v.literal("management"),
                v.literal("other"),
            ),
        ),
        unitPrice: v.number(), // Changed from 'price' to match UI expectations
        unit: v.optional(v.string()), // For metered amenities (kWh, m³, etc.)
        unitFeeType: v.union(v.literal("metered"), v.literal("per_person"), v.literal("fixed")),
    }).index("by_dorm", ["dormId"]),

    rooms: defineTable({
        code: v.string(),
        price: v.number(),
        currency: v.literal("VND"),
        status: v.union(v.literal("vacant"), v.literal("occupied"), v.literal("maintenance")),
        dormId: v.id("dorms"),
        landlordId: v.id("landlords"),
        currentRenterId: v.optional(v.id("renters")),
    })
        .index("by_landlord", ["landlordId"])
        .index("by_dorm", ["dormId"])
        // Index with landlordId first then code so iteration by this index returns rooms ordered by code for a landlord
        .index("by_code_landlord", ["landlordId", "code"])
        // New index to allow listing rooms in a dorm ordered by code without client-side sorting
        .index("by_dorm_code", ["dormId", "code"]),

    roomAmenities: defineTable({
        roomId: v.id("rooms"),
        amenityId: v.id("amenities"),
        lastUsedNumber: v.number(),
        month: v.number(),
    }).index("by_room", ["roomId"]),

    invoices: defineTable({
        roomId: v.id("rooms"),
        period: v.object({
            start: v.number(), //month
            end: v.number(), //month
        }),
        totalAmount: v.number(),
        currency: v.literal("VND"),
        status: v.union(
            v.literal("pending"),
            v.literal("submitted"),
            v.literal("approved"),
            v.literal("rejected"),
            v.literal("paid"),
        ),
        evidenceUrls: v.optional(v.string()),
    })
        .index("by_room", ["roomId"])
        .index("by_period", ["period"]),

    subscriptions: defineTable({
        landlordId: v.id("landlords"),
        tier: v.union(v.literal("Free"), v.literal("Basic"), v.literal("Pro")),
        periods: v.object({
            start: v.number(), //month
            end: v.number(), //month
        }),
    }).index("by_landlord", ["landlordId"]),

    // notifications: defineTable({
    //     landlordId: v.id("landlords"),
    //     title: v.string(),
    //     content: v.string(),
    //     targetAll: v.boolean(),
    //     renterIds: v.optional(v.array(v.id("renters"))),
    //     readBy: v.optional(v.array(v.id("renters"))),
    // }).index("by_landlord", ["landlordId"]),

    // chatMessages: defineTable({
    //     landlordId: v.id("landlords"),
    //     roomId: v.optional(v.id("rooms")), // null => general
    //     senderType: v.union(v.literal("landlord"), v.literal("renter")),
    //     senderRenterId: v.optional(v.id("renters")),
    //     content: v.string(),
    // })
    //     .index("by_landlord", ["landlordId"])
    //     .index("by_room", ["roomId"]),
});

// convex/schema.js
// Convex schema for Dormitory Management System
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkUserId: v.string(),
        email: v.string(),
        role: v.optional(v.string()), // landlord | renter
		name: v.optional(v.string()),
		birthDate: v.optional(v.string()),
		phone: v.optional(v.string()),
		hometown: v.optional(v.string()),
    }).index("by_clerk", ["clerkUserId"]),

    landlords: defineTable({
        userId: v.id("users"),
        subscriptionTier: v.optional(v.string()), // Free | Basic | Pro
        roomLimit: v.optional(v.number()),
        overageFeePerRoom: v.optional(v.number()),
    }).index("by_user", ["userId"]),

    renters: defineTable({
        userId: v.id("users"),
        active: v.boolean(),
        assignedRoomId: v.optional(v.id("rooms")),
        assignedAt: v.optional(v.number()),
    }).index("by_user", ["userId"]),

    rooms: defineTable({
        code: v.string(),
        status: v.string(), // vacant | occupied | maintenance
        landlordId: v.id("landlords"),
        currentRenterId: v.optional(v.id("renters")),
    })
        .index("by_landlord", ["landlordId"])
        .index("by_code_landlord", ["landlordId", "code"]),

    expenseItems: defineTable({
        landlordId: v.id("landlords"),
        type: v.string(), // electricity | water | wifi | trash | other
        unit: v.string(), // kWh | m3 | month | flat
        price: v.number(),
        scope: v.string(), // per-room | global
    }).index("by_landlord", ["landlordId"]),

    invoices: defineTable({
        roomId: v.id("rooms"),
        period: v.string(), // YYYY-MM
        dueDate: v.optional(v.number()),
        totalAmount: v.number(),
        currency: v.string(), // VND
        status: v.string(), // pending | submitted | approved | rejected | paid
    })
        .index("by_room", ["roomId"])
        .index("by_period", ["period"]),

    paymentEvidences: defineTable({
        invoiceId: v.id("invoices"),
        renterId: v.id("renters"),
        files: v.array(v.object({ url: v.string(), type: v.optional(v.string()) })),
        status: v.string(), // submitted | rejected | approved
        reason: v.optional(v.string()),
    }).index("by_invoice", ["invoiceId"]),

    notifications: defineTable({
        landlordId: v.id("landlords"),
        title: v.string(),
        content: v.string(),
        targetAll: v.boolean(),
        renterIds: v.optional(v.array(v.id("renters"))),
        createdAt: v.number(),
        readBy: v.optional(v.array(v.id("renters"))),
    }).index("by_landlord", ["landlordId"]),

    chatMessages: defineTable({
        landlordId: v.id("landlords"),
        roomId: v.optional(v.id("rooms")), // null => general
        senderType: v.string(), // landlord | renter
        senderRenterId: v.optional(v.id("renters")),
        content: v.string(),
    })
        .index("by_landlord", ["landlordId"])
        .index("by_room", ["roomId"]),

    subscriptions: defineTable({
        landlordId: v.id("landlords"),
        tier: v.string(), // Free | Basic | Pro
        startAt: v.number(),
        endAt: v.optional(v.number()),
    }).index("by_landlord", ["landlordId"]),
});

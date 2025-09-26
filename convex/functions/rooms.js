import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

const RoomStatus = v.union(v.literal("vacant"), v.literal("occupied"), v.literal("maintenance"));

// List by landlord
export const listByLandlord = query({
    args: { landlordId: v.id("landlords") },
    handler: async (ctx, { landlordId }) => {
        return await ctx.db
            .query("rooms")
            .withIndex("by_landlord", (q) => q.eq("landlordId", landlordId))
            .collect();
    },
});

// List by dorm
export const listByDorm = query({
    args: { dormId: v.id("dorms") },
    handler: async (ctx, { dormId }) => {
        return await ctx.db
            .query("rooms")
            .withIndex("by_dorm", (q) => q.eq("dormId", dormId))
            .collect();
    },
});

// Get one
export const getById = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, { roomId }) => {
        const room = await ctx.db.get(roomId);
        if (!room) return null;

        // If room has a renter, fetch renter details with user info
        let renterInfo = null;
        if (room.currentRenterId) {
            const renter = await ctx.db.get(room.currentRenterId);
            if (renter) {
                const user = await ctx.db.get(renter.userId);
                renterInfo = {
                    ...renter,
                    user: user,
                };
            }
        }

        return {
            ...room,
            renter: renterInfo,
        };
    },
});

// Search exact code (per landlord)
export const searchByCode = query({
    args: { landlordId: v.id("landlords"), code: v.string() },
    handler: async (ctx, { landlordId, code }) => {
        return await ctx.db
            .query("rooms")
            .withIndex("by_code_landlord", (q) => q.eq("landlordId", landlordId))
            .filter((q) => q.eq(q.field("code"), code))
            .first();
    },
});

// Search by code prefix (per landlord)
export const searchByCodePrefix = query({
    args: {
        landlordId: v.id("landlords"),
        prefix: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, { landlordId, prefix, limit }) => {
        const lower = prefix;
        const upper = prefix + "\uffff";
        const results = await ctx.db
            .query("rooms")
            .withIndex("by_code_landlord", (q) => q.eq("landlordId", landlordId))
            .filter((q) => q.and(q.gte(q.field("code"), lower), q.lte(q.field("code"), upper)))
            .collect();
        return limit ? results.slice(0, limit) : results;
    },
});

// Create room (align with schema: price number, currency "VND")
export const create = mutation({
    args: {
        landlordId: v.id("landlords"),
        code: v.string(),
        dormId: v.optional(v.id("dorms")),
        price: v.optional(v.float64()), // accept price
    },
    handler: async (ctx, { landlordId, code, dormId, price }) => {
        const trimmedCode = code.trim();
        if (!trimmedCode) throw new Error("Room code is required.");

        const dup = await ctx.db
            .query("rooms")
            .withIndex("by_code_landlord", (q) => q.eq("landlordId", landlordId))
            .filter((q) => q.eq(q.field("code"), trimmedCode))
            .first();
        if (dup) throw new Error("Room code already exists");

        let dormIdToUse = dormId;
        if (!dormIdToUse) {
            const firstDorm = await ctx.db
                .query("dorms")
                .withIndex("by_landlord", (q) => q.eq("landlordId", landlordId))
                .first();
            if (!firstDorm) throw new Error("No dorm found for this landlord. Please create a dorm first.");
            dormIdToUse = firstDorm._id;
        }

        return await ctx.db.insert("rooms", {
            code: trimmedCode,
            price: price ?? 0, // required by schema
            currency: "VND", // required by schema
            status: "vacant",
            dormId: dormIdToUse,
            landlordId,
            currentRenterId: undefined,
        });
    },
});

// Update room
export const update = mutation({
    args: {
        roomId: v.id("rooms"),
        code: v.optional(v.string()),
        price: v.optional(v.number()),
        status: v.optional(RoomStatus),
        dormId: v.optional(v.id("dorms")),
        currentRenterId: v.optional(v.union(v.id("renters"), v.null())), // allow clearing
    },
    handler: async (ctx, { roomId, code, price, status, dormId, currentRenterId }) => {
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");

        const patch = {};

        if (code && code.trim() && code.trim() !== room.code) {
            const dup = await ctx.db
                .query("rooms")
                .withIndex("by_code_landlord", (q) => q.eq("landlordId", room.landlordId))
                .filter((q) => q.eq(q.field("code"), code.trim()))
                .first();
            if (dup && dup._id !== roomId) throw new Error("Room code already exists");
            patch.code = code.trim();
        }

        if (price !== undefined) {
            if (typeof price !== "number" || price < 0) throw new Error("Price must be a non-negative number.");
            patch.price = price;
        }

        if (status) patch.status = status;
        if (dormId) patch.dormId = dormId;

        if (currentRenterId !== undefined) {
            // allow setting a renter or clearing it (null)
            patch.currentRenterId = currentRenterId === null ? undefined : currentRenterId;
        }

        if (Object.keys(patch).length === 0) return { ok: true, updated: false };
        await ctx.db.patch(roomId, patch);
        return { ok: true, updated: true };
    },
});

// Update only status
export const updateStatus = mutation({
    args: { roomId: v.id("rooms"), status: RoomStatus },
    handler: async (ctx, { roomId, status }) => {
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");
        await ctx.db.patch(roomId, { status });
        return { ok: true };
    },
});

// Delete room (with checks)
export const remove = mutation({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, { roomId }) => {
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");

        if (room.currentRenterId) throw new Error("Cannot delete an occupied room");

        const invoice = await ctx.db
            .query("invoices")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .first();
        if (invoice) throw new Error("Cannot delete a room with invoices");

        const links = await ctx.db
            .query("roomAmenities")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .collect();
        for (const link of links) await ctx.db.delete(link._id);

        await ctx.db.delete(roomId);
        return { ok: true };
    },
});

export const getRoomDetails = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, { roomId }) => {
        try {
            const room = await ctx.db.get(roomId);
            if (!room) return null;

            let renterInfo = null;
            if (room.currentRenterId) {
                const renter = await ctx.db.get(room.currentRenterId);
                if (renter) {
                    const user = await ctx.db.get(renter.userId);
                    renterInfo = {
                        ...renter,
                        user: user,
                    };
                }
            }

            return {
                ...room,
                roomCode: room.code,
                renter: renterInfo,
            };
        } catch (error) {
            throw error;
        }
    },
});

export const getRoomAmenities = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, { roomId }) => {
        try {
            const room = await ctx.db.get(roomId);
            if (!room) throw new Error("Room not found");

            const roomAmenities = await ctx.db
                .query("roomAmenities")
                .withIndex("by_room", (q) => q.eq("roomId", roomId))
                .collect();

            const amenitiesWithDetails = await Promise.all(
                roomAmenities.map(async (ra) => {
                    try {
                        const amenityDetail = await ctx.db.get(ra.amenityId);
                        return {
                            ...ra,
                            details: amenityDetail,
                        };
                    } catch (error) {
                        return {
                            ...ra,
                            details: null,
                        };
                    }
                }),
            );

            return amenitiesWithDetails;
        } catch (error) {
            throw error;
        }
    },
});

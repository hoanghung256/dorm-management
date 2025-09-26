// convex/functions/renters.js
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Get renter by ID with user details
export const getById = query({
    args: { renterId: v.id("renters") },
    handler: async (ctx, { renterId }) => {
        const renter = await ctx.db.get(renterId);
        if (!renter) return null;

        const user = await ctx.db.get(renter.userId);
        return {
            ...renter,
            name: user?.name || "Unknown User",
            email: user?.email || "",
            phone: user?.phone || "",
            contact: user?.phone || user?.email || "No contact info",
        };
    },
});

// Get available users who can become renters (users with role "renter" not already assigned)
export const getAvailableUsers = query({
    args: { landlordId: v.id("landlords") },
    handler: async (ctx, { landlordId }) => {
        console.log("getAvailableUsers called with:", { landlordId });

        // Get all users with role "renter"
        const allUsers = await ctx.db.query("users").collect();
        const renterUsers = allUsers.filter((user) => user.role === "renter");
        console.log("Found renter users:", renterUsers.length);

        // Get all active renters
        const activeRenters = await ctx.db
            .query("renters")
            .filter((q) => q.eq(q.field("active"), true))
            .collect();

        const assignedUserIds = new Set(activeRenters.map((r) => r.userId));
        console.log("Assigned user IDs:", assignedUserIds);

        // Filter out users who are already assigned as renters
        const availableUsers = renterUsers
            .filter((user) => !assignedUserIds.has(user._id))
            .map((user) => ({
                _id: user._id,
                name: user.name || "Unknown User",
                email: user.email || "",
                phone: user.phone || "",
                contact: user.phone || user.email || "No contact info",
            }));

        console.log("Available users:", availableUsers);
        return availableUsers;
    },
});

// List renters assigned to a specific room
export const listByRoom = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, { roomId }) => {
        return await ctx.db
            .query("renters")
            .filter((q) => q.eq(q.field("assignedRoomId"), roomId))
            .collect();
    },
});

// List all renters for a landlord (through their rooms) with user details
export const listByLandlord = query({
    args: { landlordId: v.id("landlords") },
    handler: async (ctx, { landlordId }) => {
        console.log("listByLandlord called with:", { landlordId });

        // Get all rooms for this landlord
        const rooms = await ctx.db
            .query("rooms")
            .withIndex("by_landlord", (q) => q.eq("landlordId", landlordId))
            .collect();

        console.log("Found rooms:", rooms.length);

        // Get all renters assigned to these rooms
        const renterIds = rooms.map((room) => room.currentRenterId).filter(Boolean);
        console.log("Found renter IDs:", renterIds);

        const renters = await Promise.all(renterIds.map((id) => ctx.db.get(id)));
        const activeRenters = renters.filter(Boolean);

        console.log("Active renters:", activeRenters);

        // Enrich renters with user details
        const enrichedRenters = await Promise.all(
            activeRenters.map(async (renter) => {
                try {
                    const user = await ctx.db.get(renter.userId);
                    return {
                        ...renter,
                        name: user?.name || "Unknown User",
                        email: user?.email || "",
                        phone: user?.phone || "",
                        contact: user?.phone || user?.email || "No contact info",
                    };
                } catch (error) {
                    console.error("Error enriching renter:", error);
                    return {
                        ...renter,
                        name: "Unknown User",
                        email: "",
                        phone: "",
                        contact: "No contact info",
                    };
                }
            }),
        );

        console.log("Enriched renters:", enrichedRenters);
        return enrichedRenters;
    },
});

// Create a renter and assign to room (requires userId from users table)
export const createAndAssign = mutation({
    args: {
        roomId: v.id("rooms"),
        userId: v.id("users"),
    },
    handler: async (ctx, { roomId, userId }) => {
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const now = Date.now();
        const renterId = await ctx.db.insert("renters", {
            userId,
            active: true,
            assignedRoomId: roomId,
            assignedAt: now,
        });

        await ctx.db.patch(roomId, {
            currentRenterId: renterId,
            status: room.status === "vacant" ? "occupied" : room.status,
        });

        return renterId;
    },
});

// Assign existing renter to a room
export const assignToRoom = mutation({
    args: { renterId: v.id("renters"), roomId: v.id("rooms") },
    handler: async (ctx, { renterId, roomId }) => {
        const renter = await ctx.db.get(renterId);
        if (!renter) throw new Error("Renter not found");
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");

        // Clear previous room if any
        if (renter.assignedRoomId) {
            const prevRoom = await ctx.db.get(renter.assignedRoomId);
            if (prevRoom && prevRoom.currentRenterId === renterId) {
                await ctx.db.patch(prevRoom._id, {
                    currentRenterId: undefined,
                    status: prevRoom.status === "occupied" ? "vacant" : prevRoom.status,
                });
            }
        }

        await ctx.db.patch(renterId, { assignedRoomId: roomId });
        await ctx.db.patch(roomId, {
            currentRenterId: renterId,
            status: room.status === "vacant" ? "occupied" : room.status,
        });
        return { ok: true };
    },
});

// Unassign renter from their room
export const unassignFromRoom = mutation({
    args: { renterId: v.id("renters") },
    handler: async (ctx, { renterId }) => {
        const renter = await ctx.db.get(renterId);
        if (!renter) throw new Error("Renter not found");
        if (renter.assignedRoomId) {
            const room = await ctx.db.get(renter.assignedRoomId);
            if (room && room.currentRenterId === renterId) {
                await ctx.db.patch(room._id, {
                    currentRenterId: undefined,
                    status: room.status === "occupied" ? "vacant" : room.status,
                });
            }
        }
        await ctx.db.patch(renterId, { assignedRoomId: undefined });
        return { ok: true };
    },
});

export const update = mutation({
    args: {
        renterId: v.id("renters"),
        name: v.optional(v.string()),
        contact: v.optional(v.string()),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, { renterId, ...patch }) => {
        const renter = await ctx.db.get(renterId);
        if (!renter) throw new Error("Renter not found");
        await ctx.db.patch(renterId, patch);
        return { ok: true };
    },
});

export const remove = mutation({
    args: { renterId: v.id("renters") },
    handler: async (ctx, { renterId }) => {
        const renter = await ctx.db.get(renterId);
        if (!renter) return { ok: true };
        if (renter.assignedRoomId) {
            throw new Error("Cannot delete renter while assigned to a room");
        }
        await ctx.db.delete(renterId);
        return { ok: true };
    },
});

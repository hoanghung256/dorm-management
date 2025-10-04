import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// ---------- Shared helpers ----------
function safeName(user) {
    if (!user) return "Unknown User";
    if (user.name && user.name.trim()) return user.name.trim();
    if (user.email) return user.email.split("@")[0];
    return "Unknown User";
}

async function enrichRenters(ctx, renterDocs) {
    if (!renterDocs || renterDocs.length === 0) return [];
    const userIds = [...new Set(renterDocs.map((r) => r.userId))];
    const userDocs = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = new Map();
    userDocs.forEach((u) => {
        if (u) userMap.set(u._id, u);
    });

    return renterDocs.map((r) => {
        const user = userMap.get(r.userId);
        return {
            ...r,
            name: safeName(user),
            email: user?.email || "",
            phone: user?.phone || "",
            contact: user?.phone || user?.email || "No contact info",
            user, // optional full user object
        };
    });
}

// ---------- New: Get ONLY the renter name ----------
export const getRenterName = query({
    args: { renterId: v.id("renters") },
    handler: async (ctx, { renterId }) => {
        const renter = await ctx.db.get(renterId);
        if (!renter) throw new Error("Renter not found");
        const user = await ctx.db.get(renter.userId);
        return safeName(user);
    },
});

// ---------- Queries ----------
export const getById = query({
    args: { renterId: v.id("renters") },
    handler: async (ctx, { renterId }) => {
        const renter = await ctx.db.get(renterId);
        if (!renter) return null;

        const user = await ctx.db.get(renter.userId);
        return {
            ...renter,
            name: safeName(user),
            email: user?.email || "",
            phone: user?.phone || "",
            contact: user?.phone || user?.email || "No contact info",
        };
    },
});

export const getAvailableUsers = query({
    args: { landlordId: v.id("landlords") },
    handler: async (ctx, { landlordId }) => {
        const allUsers = await ctx.db.query("users").collect();
        const renterUsers = allUsers.filter((u) => u.role === "renter");

        const activeRenters = await ctx.db
            .query("renters")
            .filter((q) => q.eq(q.field("active"), true))
            .collect();

        const assignedUserIds = new Set(activeRenters.map((r) => r.userId));

        return renterUsers
            .filter((u) => !assignedUserIds.has(u._id))
            .map((u) => ({
                _id: u._id,
                name: safeName(u),
                email: u.email || "",
                phone: u.phone || "",
                contact: u.phone || u.email || "No contact info",
            }));
    },
});

export const listByRoom = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, { roomId }) => {
        const renters = await ctx.db
            .query("renters")
            .filter((q) => q.eq(q.field("assignedRoomId"), roomId))
            .collect();
        return await enrichRenters(ctx, renters);
    },
});

export const listByLandlord = query({
    args: { landlordId: v.id("landlords") },
    handler: async (ctx, { landlordId }) => {
        const rooms = await ctx.db
            .query("rooms")
            .withIndex("by_landlord", (q) => q.eq("landlordId", landlordId))
            .collect();

        const renterIds = rooms.map((room) => room.currentRenterId).filter(Boolean);
        const renters = await Promise.all(renterIds.map((id) => ctx.db.get(id)));
        const activeRenters = renters.filter(Boolean);

        return await enrichRenters(ctx, activeRenters);
    },
});

// ---------- Mutations ----------
export const createAndAssign = mutation({
    args: { roomId: v.id("rooms"), userId: v.id("users") },
    handler: async (ctx, { roomId, userId }) => {
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        const renterId = await ctx.db.insert("renters", {
            userId,
            active: true,
            assignedRoomId: roomId,
            assignedAt: Date.now(),
        });

        await ctx.db.patch(roomId, {
            currentRenterId: renterId,
            status: room.status === "vacant" ? "occupied" : room.status,
        });

        return renterId;
    },
});

export const assignSpenderToRoom = mutation({
    args: { userId: v.id("users"), roomId: v.id("rooms") },
    handler: async (ctx, { userId, roomId }) => {
        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");
        const renter = await ctx.db
            .query("renters")
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();
        if (!renter) throw new Error("Renter not found");
        const renterId = renter._id;

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

export const unassignFromRoom = mutation({
    args: { userId: v.id("users"), roomId: v.id("rooms") },
    handler: async (ctx, { userId, roomId }) => {
        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");
        const renter = await ctx.db
            .query("renters")
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();
        if (!renter) throw new Error("Renter not found");
        const renterId = renter._id;
        if (renter.assignedRoomId !== roomId) {
            throw new Error("Renter is not assigned to this room");
        }
        await ctx.db.patch(roomId, {
            currentRenterId: undefined,
            status: "vacant",
        });
        await ctx.db.patch(renterId, {
            assignedRoomId: undefined,
        });
        return { ok: true };
    },
});

export const update = mutation({
    args: {
        renterId: v.id("renters"),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, { renterId, active }) => {
        const renter = await ctx.db.get(renterId);
        if (!renter) throw new Error("Renter not found");
        const patch = {};
        if (typeof active === "boolean") patch.active = active;

        if (Object.keys(patch).length) await ctx.db.patch(renterId, patch);
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

export const searchRenters = query({
    args: {
        searchTerm: v.string(),
    },
    handler: async (ctx, args) => {
        const { searchTerm } = args;

        try {
            const renters = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("role"), "renter"))
                .collect();

            if (!searchTerm) return [];
            const matchedUsers = renters.filter((u) => u.email === searchTerm || u.phone === searchTerm);
            return matchedUsers.map((user) => ({
                _id: user._id,
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                birthDate: user.birthDate,
                hometown: user.hometown,
            }));
        } catch (error) {
            console.error("Search error:", error);
            return [];
        }
    },
});

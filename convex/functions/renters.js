// convex/functions/renters.js
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// List renters assigned to a specific room
export const listByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }) => {
    return await ctx
      .db
      .query("renters")
      .filter(q => q.eq(q.field("assignedRoomId"), roomId))
      .collect();
  }
});

// Create a renter and assign to room (infers landlord from room)
export const createAndAssign = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.string(),
    contact: v.optional(v.string()),
  },
  handler: async (ctx, { roomId, name, contact }) => {
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found");

    const now = Date.now();
    const renterId = await ctx.db.insert("renters", {
      name,
      contact,
      active: true,
      assignedRoomId: roomId,
      createdAt: now,
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
  args: { renterId: v.id("renters"), name: v.optional(v.string()), contact: v.optional(v.string()), active: v.optional(v.boolean()) },
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

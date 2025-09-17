// convex/functions/chat.js
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listMessages = query({
  args: { landlordId: v.id("landlords"), roomId: v.optional(v.id("rooms")) },
  handler: async (ctx, { landlordId, roomId }) => {
    let q = ctx.db.query("chatMessages").withIndex("by_landlord", q => q.eq("landlordId", landlordId));
    if (roomId) {
      q = ctx.db.query("chatMessages").withIndex("by_room", q => q.eq("roomId", roomId));
    }
    return await q.collect();
  }
});

export const postMessage = mutation({
  args: {
    landlordId: v.id("landlords"),
    roomId: v.optional(v.id("rooms")),
    senderType: v.string(), // landlord | renter
    senderRenterId: v.optional(v.id("renters")),
    content: v.string(),
  },
  handler: async (ctx, { landlordId, roomId, senderType, senderRenterId, content }) => {
    if (!content.trim()) throw new Error("Empty message");
    if (senderType === "renter" && !senderRenterId) throw new Error("senderRenterId required for renter");

    // Access control for room chats: renter must belong to the room
    if (roomId && senderType === "renter") {
      const room = await ctx.db.get(roomId);
      if (!room) throw new Error("Room not found");
      if (room.currentRenterId !== senderRenterId) {
        throw new Error("Access denied to room chat");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("chatMessages", {
      landlordId,
      roomId,
      senderType,
      senderRenterId,
      content,
      createdAt: now,
    });
  }
});

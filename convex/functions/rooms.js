// convex/functions/rooms.js
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const listByLandlord = query({
  args: { landlordId: v.id("landlords") },
  handler: async (ctx, { landlordId }) => {
    return await ctx.db.query('rooms').withIndex('by_landlord', q => q.eq('landlordId', landlordId)).collect()
  }
})

export const create = mutation({
  args: { landlordId: v.id('landlords'), code: v.string() },
  handler: async (ctx, { landlordId, code }) => {
    // enforce unique code per landlord
    const dup = await ctx.db.query('rooms').withIndex('by_code_landlord', q => q.eq('landlordId', landlordId)).filter(q => q.eq(q.field('code'), code)).first()
    if (dup) throw new Error('Room code already exists')

    // enforce subscription limits
    const landlord = await ctx.db.get(landlordId)
    if (!landlord) throw new Error('Landlord not found')
    const tier = landlord.subscriptionTier || 'Free'
    let limit = 5
    if (tier === 'Basic') limit = 10
    if (tier === 'Pro') limit = 20 // base cap; overage is a billing concern

    const currentCount = (await ctx.db
      .query('rooms')
      .withIndex('by_landlord', q => q.eq('landlordId', landlordId))
      .collect()).length
    if (currentCount >= limit) {
      throw new Error(`Room limit reached for tier ${tier}`)
    }

    const now = Date.now()
    return await ctx.db.insert('rooms', {
      code,
      status: 'vacant',
      landlordId,
      currentRenterId: undefined,
      createdAt: now,
    })
  }
})

export const updateStatus = mutation({
  args: { roomId: v.id('rooms'), status: v.string() },
  handler: async (ctx, { roomId, status }) => {
    const allowed = ['vacant', 'occupied', 'maintenance']
    if (!allowed.includes(status)) throw new Error('Invalid status')
    const room = await ctx.db.get(roomId)
    if (!room) throw new Error('Room not found')
    await ctx.db.patch(roomId, { status })
    return { ok: true }
  }
})

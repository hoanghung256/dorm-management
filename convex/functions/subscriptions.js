// convex/functions/subscriptions.js
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getLimits = query({
  args: { landlordId: v.id("landlords") },
  handler: async (ctx, { landlordId }) => {
    const landlord = await ctx.db.get(landlordId)
    if (!landlord) throw new Error('Landlord not found')
    const tier = landlord.subscriptionTier || 'Free'
    let roomLimit = 5
    if (tier === 'Basic') roomLimit = 10
    if (tier === 'Pro') roomLimit = 20 // base, overage fees >20 handled by billing, not limit
    return { tier, roomLimit }
  }
})

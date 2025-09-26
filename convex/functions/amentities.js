import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateDormAmenities = mutation({
    args: {
        dormId: v.id("dorms"),
        amenities: v.array(
            v.object({
                _id: v.optional(v.id("amenities")),
                dormId: v.optional(v.id("dorms")), // not needed for update/insert, but useful to have in the object
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
                unitPrice: v.number(),
                unit: v.optional(v.string()),
                unitFeeType: v.union(v.literal("metered"), v.literal("per_person"), v.literal("fixed")),
                _creationTime: v.optional(v.number()),
            }),
        ),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("amenities")
            .withIndex("by_dorm", (q) => q.eq("dormId", args.dormId))
            .collect();

        const incomingIds = new Set(
            args.amenities
                .map((a) => a._id) // lấy _id (có thể undefined)
                .filter((id) => id), // loại bỏ undefined
        );

        let updated = 0;
        let inserted = 0;
        let deleted = 0;

        // 1. Update or Insert
        for (const amenity of args.amenities) {
            if (amenity._id) {
                await ctx.db.patch(amenity._id, {
                    name: amenity.name,
                    type: amenity.type,
                    unitPrice: amenity.unitPrice,
                    unit: amenity.unit,
                    unitFeeType: amenity.unitFeeType,
                });
                updated++;
            } else {
                await ctx.db.insert("amenities", {
                    dormId: args.dormId,
                    name: amenity.name,
                    type: amenity.type,
                    unitPrice: amenity.unitPrice,
                    unit: amenity.unit,
                    unitFeeType: amenity.unitFeeType,
                });
                inserted++;
            }
        }

        // 2. Delete những cái không có trong payload
        for (const oldAmenity of existing) {
            if (!incomingIds.has(oldAmenity._id)) {
                await ctx.db.delete(oldAmenity._id);
                deleted++;
            }
        }

        return { updated, inserted, deleted, total: args.amenities.length };
    },
});

import { v } from "convex/values";
import { mutation } from "../_generated/server.js";

// Function để sync tất cả amenities với tất cả rooms trong dorm
export const syncDormAmenitiesWithRooms = mutation({
    args: { dormId: v.id("dorms") },
    handler: async (ctx, args) => {
        console.log("Starting sync for dorm:", args.dormId);
        
        // Get all amenities in dorm
        const amenities = await ctx.db
            .query("amenities")
            .withIndex("by_dorm", (q) => q.eq("dormId", args.dormId))
            .collect();
            
        // Get all rooms in dorm
        const rooms = await ctx.db
            .query("rooms")
            .withIndex("by_dorm", (q) => q.eq("dormId", args.dormId))
            .collect();
            
        console.log(`Found ${amenities.length} amenities and ${rooms.length} rooms`);
        
        let created = 0;
        let skipped = 0;
        
        // Create roomAmenities links for each combination
        for (const room of rooms) {
            for (const amenity of amenities) {
                // Check if link already exists
                const existingLink = await ctx.db
                    .query("roomAmenities")
                    .withIndex("by_room", (q) => q.eq("roomId", room._id))
                    .filter(q => q.eq(q.field("amenityId"), amenity._id))
                    .first();
                
                if (!existingLink) {
                    await ctx.db.insert("roomAmenities", {
                        roomId: room._id,
                        amenityId: amenity._id,
                        lastUsedNumber: 0,
                        month: new Date().getMonth(),
                    });
                    created++;
                    console.log(`Created link: Room ${room.code} <-> Amenity ${amenity.name}`);
                } else {
                    skipped++;
                }
            }
        }
        
        console.log(`Sync completed: ${created} links created, ${skipped} skipped`);
        
        return {
            success: true,
            amenitiesCount: amenities.length,
            roomsCount: rooms.length,
            linksCreated: created,
            linksSkipped: skipped,
            totalPossibleLinks: amenities.length * rooms.length
        };
    },
});

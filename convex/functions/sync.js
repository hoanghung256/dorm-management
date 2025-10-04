import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Sync existing amenities with all rooms in dorm
 * This is a one-time fix for existing data
 */
export const syncRoomAmenities = mutation({
    args: {
        dormId: v.id("dorms")
    },
    handler: async (ctx, args) => {
        console.log("Starting sync for dorm:", args.dormId);
        
        // Get all amenities for this dorm
        const dormAmenities = await ctx.db
            .query("amenities")
            .withIndex("by_dorm", (q) => q.eq("dormId", args.dormId))
            .collect();
        
        // Get all rooms in this dorm  
        const roomsInDorm = await ctx.db
            .query("rooms")
            .withIndex("by_dorm", (q) => q.eq("dormId", args.dormId))
            .collect();
        
        console.log(`Found ${dormAmenities.length} amenities and ${roomsInDorm.length} rooms`);
        
        let linksCreated = 0;
        let linksExisted = 0;
        
        // Create roomAmenities links for each room-amenity combination
        for (const room of roomsInDorm) {
            for (const amenity of dormAmenities) {
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
                    linksCreated++;
                } else {
                    linksExisted++;
                }
            }
        }
        
        console.log(`Sync completed: ${linksCreated} links created, ${linksExisted} already existed`);
        
        return {
            success: true,
            amenitiesFound: dormAmenities.length,
            roomsFound: roomsInDorm.length,
            linksCreated,
            linksExisted,
            totalExpected: dormAmenities.length * roomsInDorm.length
        };
    }
});

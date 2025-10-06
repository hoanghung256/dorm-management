import { mutation, query } from "../_generated/server";
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
                unitFeeType: v.string(), // Changed from union to string for more flexibility
                _creationTime: v.optional(v.number()),
            }),
        ),
    },
    handler: async (ctx, args) => {
        // Validation: Check for required fields and null/empty values
        for (const amenity of args.amenities) {
            // Check required fields
            if (!amenity.name || amenity.name.trim() === "") {
                throw new Error("Tên tiện ích không được để trống");
            }
            
            if (amenity.unitPrice === null || amenity.unitPrice === undefined) {
                throw new Error("Giá đơn vị không được để trống");
            }
            
            if (amenity.unitPrice < 0) {
                throw new Error("Giá đơn vị không được âm");
            }
            
            if (!amenity.unitFeeType || amenity.unitFeeType.trim() === "") {
                throw new Error("Loại phí không được để trống");
            }
            
            // Validate unit field if provided
            if (amenity.unit !== undefined && amenity.unit !== null && amenity.unit.trim() === "") {
                throw new Error("Đơn vị tính không được để trống nếu có nhập");
            }
            
            // Validate type field if provided
            if (amenity.type !== undefined && amenity.type !== null && amenity.type.trim() === "") {
                throw new Error("Loại tiện ích không được để trống nếu có chọn");
            }
        }

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
        const newAmenityIds = [];

        // 1. Update or Insert
        for (const amenity of args.amenities) {
            // Prepare clean data (remove empty strings and convert to null if needed)
            const cleanData = {
                name: amenity.name.trim(),
                type: amenity.type || null,
                unitPrice: amenity.unitPrice,
                unit: amenity.unit && amenity.unit.trim() !== "" ? amenity.unit.trim() : null,
                unitFeeType: amenity.unitFeeType,
            };

            if (amenity._id) {
                await ctx.db.patch(amenity._id, cleanData);
                updated++;
            } else {
                // Insert new amenity and track its ID
                const newAmenityId = await ctx.db.insert("amenities", {
                    dormId: args.dormId,
                    ...cleanData,
                });
                newAmenityIds.push(newAmenityId);
                inserted++;
            }
        }

        // 2. Delete những cái không có trong payload và xóa roomAmenities liên quan
        for (const oldAmenity of existing) {
            if (!incomingIds.has(oldAmenity._id)) {
                // Delete related roomAmenities first
                const relatedRoomAmenities = await ctx.db
                    .query("roomAmenities")
                    .filter(q => q.eq(q.field("amenityId"), oldAmenity._id))
                    .collect();
                
                for (const roomAmenity of relatedRoomAmenities) {
                    await ctx.db.delete(roomAmenity._id);
                }
                
                // Then delete the amenity
                await ctx.db.delete(oldAmenity._id);
                deleted++;
            }
        }

        // 3. AUTO-CREATE roomAmenities links for new amenities
        if (newAmenityIds.length > 0) {
            // Get all rooms in this dorm
            const roomsInDorm = await ctx.db
                .query("rooms")
                .withIndex("by_dorm", (q) => q.eq("dormId", args.dormId))
                .collect();

            // Create roomAmenities links for each new amenity with each room
            for (const roomId of roomsInDorm.map(r => r._id)) {
                for (const amenityId of newAmenityIds) {
                    // Check if link already exists to avoid duplicates
                    const existingLink = await ctx.db
                        .query("roomAmenities")
                        .withIndex("by_room", (q) => q.eq("roomId", roomId))
                        .filter(q => q.eq(q.field("amenityId"), amenityId))
                        .first();
                    
                    if (!existingLink) {
                        await ctx.db.insert("roomAmenities", {
                            roomId: roomId,
                            amenityId: amenityId,
                            lastUsedNumber: 0,
                            month: new Date().getMonth(),
                            enabled: true, // Default to enabled when creating new amenity
                        });
                    }
                }
            }
        }

        return { updated, inserted, deleted, total: args.amenities.length, roomLinksCreated: newAmenityIds.length * await ctx.db.query("rooms").withIndex("by_dorm", (q) => q.eq("dormId", args.dormId)).collect().then(rooms => rooms.length) };
    },
});

export const toggleRoomAmenity = mutation({
    args: {
        roomId: v.id("rooms"),
        amenityId: v.id("amenities"),
        enabled: v.boolean(),
    },
    handler: async (ctx, args) => {
        // Find the roomAmenity record
        const roomAmenity = await ctx.db
            .query("roomAmenities")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .filter(q => q.eq(q.field("amenityId"), args.amenityId))
            .first();
        
        if (!roomAmenity) {
            throw new Error("Room amenity not found");
        }
        
        // Update the enabled state
        await ctx.db.patch(roomAmenity._id, {
            enabled: args.enabled,
        });
        
        return { success: true };
    },
});

// Migration function to set enabled=true for existing roomAmenities without this field
export const migrateRoomAmenitiesEnabled = mutation({
    args: {},
    handler: async (ctx, args) => {
        const roomAmenities = await ctx.db
            .query("roomAmenities")
            .filter(q => q.eq(q.field("enabled"), undefined))
            .collect();
        
        let migrated = 0;
        for (const roomAmenity of roomAmenities) {
            await ctx.db.patch(roomAmenity._id, {
                enabled: true,
            });
            migrated++;
        }
        
        return { migrated };
    },
});

// Function to sync all amenities to all rooms in a dorm
export const syncAmenitiesForDorm = mutation({
    args: {
        dormId: v.id("dorms"),
    },
    handler: async (ctx, args) => {
        // Get all amenities for this dorm
        const amenities = await ctx.db
            .query("amenities")
            .withIndex("by_dorm", (q) => q.eq("dormId", args.dormId))
            .collect();

        // Get all rooms in this dorm
        const rooms = await ctx.db
            .query("rooms")
            .withIndex("by_dorm", (q) => q.eq("dormId", args.dormId))
            .collect();

        let linksCreated = 0;

        // For each room, ensure it has links to all amenities
        for (const room of rooms) {
            for (const amenity of amenities) {
                // Check if link already exists
                const existingLink = await ctx.db
                    .query("roomAmenities")
                    .withIndex("by_room", (q) => q.eq("roomId", room._id))
                    .filter(q => q.eq(q.field("amenityId"), amenity._id))
                    .first();

                if (!existingLink) {
                    // Create the missing link
                    await ctx.db.insert("roomAmenities", {
                        roomId: room._id,
                        amenityId: amenity._id,
                        lastUsedNumber: 0,
                        month: new Date().getMonth(),
                        enabled: true, // Default to enabled
                    });
                    linksCreated++;
                }
            }
        }

        return { 
            success: true, 
            linksCreated, 
            roomsProcessed: rooms.length, 
            amenitiesProcessed: amenities.length 
        };
    },
});

// Mutation to update lastUsedNumber for metered amenities after invoice creation
export const updateLastUsedNumbers = mutation({
    args: {
        roomId: v.id("rooms"),
        readings: v.array(
            v.object({
                amenityId: v.id("amenities"),
                lastUsedNumber: v.number(),
            })
        ),
    },
    handler: async (ctx, args) => {
        let updated = 0;
        
        for (const reading of args.readings) {
            // Find the roomAmenity record
            const roomAmenity = await ctx.db
                .query("roomAmenities")
                .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
                .filter(q => q.eq(q.field("amenityId"), reading.amenityId))
                .first();
            
            if (roomAmenity) {
                // Update the lastUsedNumber
                await ctx.db.patch(roomAmenity._id, {
                    lastUsedNumber: reading.lastUsedNumber,
                    month: new Date().getMonth(),
                });
                updated++;
            }
        }
        
        return { success: true, updated };
    },
});

// Query to get all amenities for a specific room
export const listByRoom = query({
    args: {
        roomId: v.id("rooms"),
    },
    handler: async (ctx, args) => {
        // Get all roomAmenities for this room
        const roomAmenities = await ctx.db
            .query("roomAmenities")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

        // For each roomAmenity, get the full amenity details
        const amenitiesWithDetails = [];
        for (const roomAmenity of roomAmenities) {
            const amenityDetails = await ctx.db.get(roomAmenity.amenityId);
            if (amenityDetails) {
                amenitiesWithDetails.push({
                    ...roomAmenity,
                    details: amenityDetails
                });
            }
        }

        return amenitiesWithDetails;
    },
});

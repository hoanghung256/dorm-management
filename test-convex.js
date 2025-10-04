// Test file to verify Convex functions
import { api } from "./convex/_generated/api";

// This file is for testing purposes only
// Test the new toggleRoomAmenity function

console.log("Testing toggleRoomAmenity function");
console.log("API endpoint:", api.functions.amentities.toggleRoomAmenity);

export const testToggle = {
    roomId: "test_room_id",
    amenityId: "test_amenity_id", 
    enabled: true
};
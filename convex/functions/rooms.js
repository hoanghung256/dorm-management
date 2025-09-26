import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

const RoomStatus = v.union(v.literal("vacant"), v.literal("occupied"), v.literal("maintenance"));

// List by landlord
export const listByLandlord = query({
    args: { landlordId: v.id("landlords") },
    handler: async (ctx, { landlordId }) => {
        console.log("listByLandlord called with landlordId:", landlordId);
        const rooms = await ctx.db
            .query("rooms")
            .withIndex("by_code_landlord", (q) => q.eq("landlordId", landlordId))
            .collect();
        return rooms.sort(roomCodeComparator);
    },
});

// List by dorm
export const listByDorm = query({
    args: { dormId: v.id("dorms") },
    handler: async (ctx, { dormId }) => {
        console.log("listByDorm called with dormId:", dormId);
        const rooms = await ctx.db
            .query("rooms")
            .withIndex("by_dorm_code", (q) => q.eq("dormId", dormId))
            .collect();
        return rooms.sort(roomCodeComparator);
    },
});

// Get one
export const getById = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, { roomId }) => {
        return await ctx.db.get(roomId);
    },
});

export const searchByCode = query({
    args: { landlordId: v.id("landlords"), code: v.string() },
    handler: async (ctx, { landlordId, code }) => {
        return await ctx.db
            .query("rooms")
            .withIndex("by_code_landlord", (q) => q.eq("landlordId", landlordId))
            .filter((q) => q.eq(q.field("code"), code))
            .first();
    },
});

// Create room (align with schema: price number, currency "VND")
export const create = mutation({
    args: {
        landlordId: v.id("landlords"),
        code: v.string(),
        dormId: v.optional(v.id("dorms")),
        price: v.optional(v.float64()),
    },
    handler: async (ctx, { landlordId, code, dormId, price }) => {
        const trimmedCode = code.trim();
        if (!trimmedCode) throw new Error("Room code is required.");

        const dup = await ctx.db
            .query("rooms")
            .withIndex("by_code_landlord", (q) => q.eq("landlordId", landlordId))
            .filter((q) => q.eq(q.field("code"), trimmedCode))
            .first();
        if (dup) throw new Error("Room code already exists");

        let dormIdToUse = dormId;
        if (!dormIdToUse) {
            const firstDorm = await ctx.db
                .query("dorms")
                .withIndex("by_landlord", (q) => q.eq("landlordId", landlordId))
                .first();
            if (!firstDorm) throw new Error("No dorm found for this landlord. Please create a dorm first.");
            dormIdToUse = firstDorm._id;
        }

        return await ctx.db.insert("rooms", {
            code: trimmedCode,
            price: price ?? 0, // required by schema
            currency: "VND", // required by schema
            status: "vacant",
            dormId: dormIdToUse,
            landlordId,
            currentRenterId: undefined,
        });
    },
});

export const update = mutation({
    args: {
        roomId: v.id("rooms"),
        code: v.optional(v.string()),
        price: v.optional(v.number()),
        status: v.optional(RoomStatus),
        dormId: v.optional(v.id("dorms")),
        currentRenterId: v.optional(v.union(v.id("renters"), v.null())),
    },
    handler: async (ctx, { roomId, code, price, status, dormId, currentRenterId }) => {
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");

        const patch = {};

        if (code && code.trim() && code.trim() !== room.code) {
            const dup = await ctx.db
                .query("rooms")
                .withIndex("by_code_landlord", (q) => q.eq("landlordId", room.landlordId))
                .filter((q) => q.eq(q.field("code"), code.trim()))
                .first();
            if (dup && dup._id !== roomId) throw new Error("Room code already exists");
            patch.code = code.trim();
        }

        if (price !== undefined) {
            if (typeof price !== "number" || price < 0) throw new Error("Price must be a non-negative number.");
            patch.price = price;
        }

        if (status) patch.status = status;
        if (dormId) patch.dormId = dormId;

        if (currentRenterId !== undefined) {
            // allow setting a renter or clearing it (null)
            patch.currentRenterId = currentRenterId === null ? undefined : currentRenterId;
        }

        // Validate: cannot change to occupied if resulting renter is missing
        const resultingStatus = patch.status ?? room.status;
        const resultingRenter = Object.prototype.hasOwnProperty.call(patch, "currentRenterId")
            ? patch.currentRenterId
            : room.currentRenterId;
        if (room.status !== "occupied" && resultingStatus === "occupied" && !resultingRenter) {
            return {
                ok: false,
                updated: false,
                error: "NO_RENTER",
                message: "Cannot mark room as occupied because it has no renter assigned.",
            };
        }

        if (Object.keys(patch).length === 0) return { ok: true, updated: false };
        await ctx.db.patch(roomId, patch);
        return { ok: true, updated: true };
    },
});

export const updateStatus = mutation({
    args: { roomId: v.id("rooms"), status: RoomStatus },
    handler: async (ctx, { roomId, status }) => {
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");
        if (room.status !== "occupied" && status === "occupied" && !room.currentRenterId) {
            return {
                ok: false,
                error: "NO_RENTER",
                message: "Cannot mark room as occupied because it has no renter assigned.",
            };
        }
        await ctx.db.patch(roomId, { status });
        return { ok: true };
    },
});

export const remove = mutation({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, { roomId }) => {
        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");

        if (room.currentRenterId) throw new Error("Cannot delete an occupied room");

        const invoice = await ctx.db
            .query("invoices")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .first();
        if (invoice) throw new Error("Cannot delete a room with invoices");

        const links = await ctx.db
            .query("roomAmenities")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .collect();
        for (const link of links) await ctx.db.delete(link._id);

        await ctx.db.delete(roomId);
        return { ok: true };
    },
});

// ---- Sorting helpers ----
// Natural sort: splits alphanumeric code into text + numeric tokens for intuitive ordering
function roomCodeComparator(a, b) {
    const ta = tokenizeCode(a.code);
    const tb = tokenizeCode(b.code);
    const len = Math.max(ta.length, tb.length);
    for (let i = 0; i < len; i++) {
        const va = ta[i];
        const vb = tb[i];
        if (va === undefined) return -1;
        if (vb === undefined) return 1;
        if (typeof va === "number" && typeof vb === "number") {
            if (va !== vb) return va - vb;
        } else if (typeof va === "number") return -1;
        else if (typeof vb === "number") return 1;
        else {
            const cmp = va.localeCompare(vb, undefined, { sensitivity: "base" });
            if (cmp !== 0) return cmp;
        }
    }
    return 0;
}

function tokenizeCode(code) {
    const raw = (code || "").trim();
    if (!raw) return [];
    const tokens = [];
    let current = "";
    for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        const isDigit = ch >= "0" && ch <= "9";
        if (isDigit) {
            if (current && !/^[0-9]+$/.test(current)) {
                tokens.push(current);
                current = "";
            }
            current += ch;
        } else {
            if (current && /^[0-9]+$/.test(current)) {
                tokens.push(parseInt(current, 10));
                current = "";
            }
            current += ch;
        }
    }
    if (current) {
        if (/^[0-9]+$/.test(current)) tokens.push(parseInt(current, 10));
        else tokens.push(current);
    }
    return tokens;
}

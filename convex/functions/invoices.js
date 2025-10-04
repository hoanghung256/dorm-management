// convex/functions/invoices.js
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { sendEmail } from "./email";

function calcTotal(baseItems) {
    // Sum price fields from prepared items
    return baseItems.reduce((sum, it) => sum + (it.amount ?? 0), 0);
}

const STATUS_VALUES = ["pending", "submitted", "approved", "rejected", "paid"];

async function enrich(ctx, invoices) {
    if (!invoices.length) return [];
    const roomIds = [...new Set(invoices.map((i) => i.roomId))];
    const rooms = await Promise.all(roomIds.map((id) => ctx.db.get(id)));
    const roomMap = new Map(rooms.filter(Boolean).map((r) => [r._id, r]));
    return invoices.map((inv) => {
        const room = roomMap.get(inv.roomId);
        return {
            ...inv,
            roomCode: room?.code || "",
        };
    });
}

export const listByRoomAndPeriod = query({
    args: { roomId: v.id("rooms"), period: v.optional(v.string()) },
    handler: async (ctx, { roomId, period }) => {
        let q = ctx.db.query("invoices").withIndex("by_room", (q) => q.eq("roomId", roomId));
        if (period) {
            q = q.filter((f) => f.eq(f.field("period"), period));
        }
        return await q.collect();
    },
});

export const listByDorm = query({
    args: { dormId: v.id("dorms") },
    handler: async (ctx, { dormId }) => {
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_dorm", (q) => q.eq("dormId", dormId))
            .collect();

        invoices.sort((a, b) => (b.period?.start ?? 0) - (a.period?.start ?? 0));

        return await enrich(ctx, invoices);
    },
});


export const listByRoom = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, { roomId }) => {
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .collect();

        invoices.sort((a, b) => (b.period?.start ?? 0) - (a.period?.start ?? 0));
        return invoices;
    },
});


export const listByDormAndPeriod = query({
    args: {
        dormId: v.id("dorms"),
        period: v.object({ start: v.number(), end: v.number() }),
    },
    handler: async (ctx, { dormId, period }) => {
        const all = await ctx.db
            .query("invoices")
            .withIndex("by_dorm", (q) => q.eq("dormId", dormId))
            .collect();

        return all.filter((i) => i.period?.start === period.start && i.period?.end === period.end);
    },
});


export const getByIdForDorm = query({
    args: { invoiceId: v.id("invoices"), dormId: v.id("dorms") },
    handler: async (ctx, { invoiceId, dormId }) => {
        const inv = await ctx.db.get(invoiceId);
        if (!inv) return null;
        if (inv.dormId !== dormId) return null;
        const [enriched] = await enrich(ctx, [inv]);
        return enriched;
    },
});


export const create = mutation({
    args: {
        roomId: v.id("rooms"),
        period: v.object({
            start: v.number(),
            end: v.number(),
        }),
        totalAmount: v.number(),
        currency: v.string(),
        status: v.string(),
    },
    handler: async (ctx, { roomId, period, totalAmount, currency, status }) => {
        if (!roomId) throw new Error("Room ID is required");
        if (!period) throw new Error("Period is required");
        if (!totalAmount) throw new Error("Total amount is required");

        const room = await ctx.db.get(roomId);
        if (!room) throw new Error("Room not found");

        const existingInvoice = await ctx.db
            .query("invoices")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .filter((q) => q.eq(q.field("period.start"), period.start) && q.eq(q.field("period.end"), period.end))
            .first();

        if (existingInvoice) {
            const startDate = new Date(period.start);
            const month = startDate.getUTCMonth() + 1;
            const year = startDate.getUTCFullYear();

            return {
                success: true,
                invoiceId: existingInvoice._id,
                isExisting: true,
                message: `Hóa đơn tháng ${month}/${year} đã tồn tại`,
            };
        }

        const invoiceData = {
            roomId,
            dormId: room.dormId, // Thêm dormId từ room data
            period,
            totalAmount,
            currency,
            status,
        };

        const invoiceId = await ctx.db.insert("invoices", invoiceData);

        const startDate = new Date(period.start);
        const month = startDate.getUTCMonth() + 1;
        const year = startDate.getUTCFullYear();

        return {
            success: true,
            invoiceId: invoiceId,
            isExisting: false,
            message: `Hóa đơn tháng ${month}/${year} đã được tạo thành công`,
        };
    },
});

export const updateStatus = mutation({
    args: { invoiceId: v.id("invoices"), status: v.string() },
    handler: async (ctx, { invoiceId, status }) => {
        const allowed = ["pending", "submitted", "approved", "rejected", "paid"];
        if (!allowed.includes(status)) throw new Error("Invalid status");
        const inv = await ctx.db.get(invoiceId);
        if (!inv) throw new Error("Invoice not found");
        await ctx.db.patch(invoiceId, { status });
        return { ok: true };
    },
});

export const updateEvidence = mutation({
    args: { invoiceId: v.id("invoices"), evidenceUrls: v.optional(v.string()) },
    handler: async (ctx, { invoiceId, evidenceUrls }) => {
        const inv = await ctx.db.get(invoiceId);
        if (!inv) throw new Error("Invoice not found");
        await ctx.db.patch(invoiceId, { evidenceUrls: evidenceUrls || null });
        return { ok: true };
    },
});


export const remove = mutation({
    args: { invoiceId: v.id("invoices") },
    handler: async (ctx, { invoiceId }) => {
        const inv = await ctx.db.get(invoiceId);
        if (!inv) throw new Error("Invoice not found");
        await ctx.db.delete(invoiceId);
        return { ok: true };
    },
});


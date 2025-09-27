import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Phân trang kiểu page/pageSize.
 * page: số trang (>=1)
 * pageSize: số bản ghi mỗi trang (default 20)
 * search: lọc tên (so khớp thường, hạ chữ)
 */
export const listDormsByLandlord = query({
    args: {
        landlordId: v.id("landlords"),
        page: v.optional(v.number()),
        pageSize: v.optional(v.number()),
        search: v.optional(v.string()),
    },
    handler: async (ctx, { landlordId, page = 1, pageSize = 20, search }) => {
        if (page < 1) throw new Error("Page phải >= 1");
        if (pageSize < 1 || pageSize > 100) throw new Error("pageSize phải trong 1-100");

        let q = ctx.db.query("dorms").withIndex("by_landlord", (q) => q.eq("landlordId", landlordId));

        if (search && search.trim()) {
            const term = search.trim().toLowerCase();
            q = q.filter((qf) => qf.or(qf.eq(qf.field("name"), term), qf.startsWith(qf.field("name"), term)));
        }

        // Thu thập toàn bộ (giả định số lượng không quá lớn)
        let all = await q.collect();

        // Sắp xếp mới nhất trước (ưu tiên createdAt, fallback _id)
        all.sort((a, b) => {
            const cDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0);
            if (cDiff !== 0) return cDiff;
            return b._id > a._id ? 1 : -1;
        });

        const total = all.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        if (page > totalPages && total > 0) {
            return { items: [], page, pageSize, total, totalPages };
        }

        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const slice = all.slice(start, end);

        for (const d of slice) {
            d.amenities = await ctx.db
                .query("amenities")
                .withIndex("by_dorm", (q) => q.eq("dormId", d._id))
                .collect();
        }

        return {
            items: slice,
            page,
            pageSize,
            total,
            totalPages,
        };
    },
});

/**
 * Handle update and create dorm.
 */
export const saveDorm = mutation({
    args: {
        landlordId: v.id("landlords"),
        _id: v.optional(v.id("dorms")),
        name: v.optional(v.string()),
        address: v.optional(v.string()),
        involveDueDate: v.optional(v.number()),
        _creationTime: v.optional(v.number()),
    },
    handler: async (ctx, { landlordId, _id, name, address, involveDueDate }) => {
        // Create new
        if (!_id) {
            const landlord = await ctx.db.get(landlordId);
            const dormCount = await ctx.db
                .query("dorms")
                .withIndex("by_landlord", (q) => q.eq("landlordId", landlordId))
                .collect()
                .then((r) => r.length);
            if (dormCount >= landlord.dormLimit) {
                throw new Error("Đạt số lượng trọ tối đa");
            }
            await ctx.db.insert("dorms", { landlordId, name, address, involveDueDate });
            return { success: true, created: true };
        }
        // Update existing
        const dorm = await ctx.db.get(_id);
        if (!dorm) throw new Error("Không tìm thấy trọ");

        const patch = {};
        if (name !== undefined && name !== dorm.name) {
            // Ensure no duplicate name within same landlord
            const dup = await ctx.db
                .query("dorms")
                .withIndex("by_landlord", (q) => q.eq("landlordId", dorm.landlordId))
                .filter((q) => q.eq(q.field("name"), name))
                .first();
            if (dup && !dup._id.equals(_id)) {
                throw new Error("Tên trọ đã tồn tại");
            }
            patch.name = name;
        }
        if (address !== undefined) patch.address = address;
        if (involveDueDate !== undefined) patch.involveDueDate = involveDueDate;
        if (Object.keys(patch).length === 0) return { updated: false };

        await ctx.db.patch(_id, patch);
        return { success: true, updated: true };
    },
});

/**
 * Delete dorm; optionally cascade amenities.
 */
export const deleteDorm = mutation({
    args: {
        dormId: v.id("dorms"),
        force: v.optional(v.boolean()), // if true, delete related amenities
    },
    handler: async (ctx, { dormId, force }) => {
        const dorm = await ctx.db.get(dormId);
        if (!dorm) throw new Error("Không tìm thấy trọ");

        // Check amenities referencing dorm
        const amenities = await ctx.db
            .query("amenities")
            .withIndex("by_dorm", (q) => q.eq("dormId", dormId))
            .collect();

        if (amenities.length > 0 && !force) {
            throw new Error("Trọ có tiện ích; cần force=true để xóa");
        }

        if (force && amenities.length > 0) {
            for (const a of amenities) {
                await ctx.db.delete(a._id);
            }
        }

        await ctx.db.delete(dormId);
        return { deleted: true };
    },
});

export const getById = query({
    args: { dormId: v.id("dorms") },
    handler: async (ctx, { dormId }) => {
        const d = await ctx.db.get(dormId);
        return d ? { _id: d._id, name: d.name ?? null } : null;
    },
});

import React from "react";
import { Box, TextField } from "@mui/material";

const STATUS_META = {
    pending: { label: "Chờ" },
    unpaid: { label: "Chưa thanh toán" },
    paid: { label: "Đã thanh toán" },
};

export default function SearchInvoiceForm({
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    monthFilter,
    setMonthFilter,
    monthOptions,
}) {
    return (
        <Box
            sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
                mb: 3,
            }}
        >
            {/* Search */}
            <TextField
                size="small"
                label="Tìm phòng"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ width: "65%" }}
            />

            {/* Status */}
            <TextField
                size="small"
                select
                label="Trạng thái"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ width: "17%" }}
            >
                <option value="all">Tất cả</option>
                {Object.entries(STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>
                        {v.label}
                    </option>
                ))}
            </TextField>

            {/* Month */}
            <TextField
                size="small"
                select
                label="Tháng/Năm"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ width: "15%" }}
            >
                <option value="all">Tất cả</option>
                {monthOptions.map((m) => (
                    <option key={m} value={m}>
                        {m}
                    </option>
                ))}
            </TextField>
        </Box>
    );
}

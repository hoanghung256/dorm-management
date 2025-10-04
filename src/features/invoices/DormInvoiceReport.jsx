import React, { useEffect, useState, useMemo } from "react";
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Select,
    MenuItem,
    Dialog,
    DialogContent,
    DialogActions,
    IconButton,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { convexQueryOneTime, convexMutation } from "../../services/convexClient";
import { api } from "../../../convex/_generated/api";
import { FileDownload, Close, Visibility } from "@mui/icons-material";
import SearchInvoiceForm from "./SearchInvoiceForm";
import ConfirmModal from "../../components/ConfirmModal";

function formatVND(n) {
    if (n == null) return "-";
    try {
        return new Intl.NumberFormat("vi-VN").format(n);
    } catch {
        return `${n}`;
    }
}

function parseMonthLabel(invoice) {
    if (invoice.periodDisplay) return invoice.periodDisplay;
    if (!invoice.period) return "-";

    const startDate = new Date(invoice.period.start);
    if (!isNaN(startDate.getTime())) {
        const month = startDate.getMonth() + 1;
        const year = startDate.getFullYear();
        return `Tháng ${month}/${year}`;
    }
    return String(invoice.period.start);
}

export default function DormInvoiceReport() {
    const { dormId } = useParams();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");

    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState("");

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);

    const handleViewImage = (imageUrl) => {
        setCurrentImageUrl(imageUrl);
        setImageDialogOpen(true);
    };

    const handleCloseImageDialog = () => {
        setImageDialogOpen(false);
        setCurrentImageUrl("");
    };

    useEffect(() => {
        const load = async () => {
            if (!dormId) return;
            setLoading(true);
            try {
                const data = await convexQueryOneTime(api.functions.invoices.listByDorm, { dormId });
                setInvoices(data || []);
            } catch (error) {
                console.error("Failed to load invoices:", error);
                setInvoices([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [dormId]);

    const updateStatus = async (invoiceId, newStatus) => {
        const originalInvoice = invoices.find((inv) => inv._id === invoiceId);

        // Optimistic update
        setInvoices((prev) => prev.map((i) => (i._id === invoiceId ? { ...i, status: newStatus } : i)));

        try {
            const result = await convexMutation(api.functions.invoices.updateStatus, {
                invoiceId,
                status: newStatus,
            });

            if (!result.ok) throw new Error(result.message || "Update failed");
        } catch (e) {
            // Rollback on error
            setInvoices((prev) =>
                prev.map((i) => (i._id === invoiceId ? { ...i, status: originalInvoice?.status || "unpaid" } : i)),
            );
            alert(e.message || "Cập nhật thất bại");
        }
    };

    const handleStatusChange = (invoice, newStatus) => {
        if (invoice.status === newStatus) return;

        if ((newStatus === "paid" || newStatus === "unpaid") && !invoice.evidenceUrls) {
            alert("Cần có ảnh bằng chứng trước khi thay đổi trạng thái thanh toán!");
            return;
        }

        setPendingStatusChange({ invoiceId: invoice._id, newStatus });
        setConfirmOpen(true);
    };

    const confirmStatusChange = () => {
        if (pendingStatusChange) {
            updateStatus(pendingStatusChange.invoiceId, pendingStatusChange.newStatus);
        }
        setConfirmOpen(false);
        setPendingStatusChange(null);
    };

    const monthOptions = useMemo(() => {
        const set = new Set();
        invoices.forEach((i) => {
            const lbl = parseMonthLabel(i);
            if (lbl && lbl !== "-") set.add(lbl);
        });
        return [...set].sort();
    }, [invoices]);

    const filtered = invoices.filter((inv) => {
        if (statusFilter !== "all" && inv.status !== statusFilter) return false;
        if (monthFilter !== "all" && parseMonthLabel(inv) !== monthFilter) return false;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            const roomCode = (inv.roomCode || "").toLowerCase();
            if (!roomCode.includes(q)) return false;
        }
        return true;
    });

    function exportCSV() {
        const headers = ["Mã HĐ", "Phòng", "Người thuê", "Kỳ", "Trạng thái", "Tổng tiền"];
        const lines = [headers.join(",")];

        invoices.forEach((inv) => {
            lines.push(
                [
                    inv.code || inv._id,
                    inv.roomCode || "",
                    inv.renterName || "",
                    parseMonthLabel(inv),
                    inv.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
                    inv.totalAmount || 0,
                ]
                    .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
                    .join(","),
            );
        });

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hoa-don-${dormId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const kpis = useMemo(() => {
        const totalAmount = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

        const paidAmount = invoices
            .filter((i) => i.status === "paid")
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

        const unpaidAmount = invoices
            .filter((i) => i.status === "unpaid")
            .reduce((sum, i) => sum + ((i.totalAmount || 0) - (i.paidAmount || 0)), 0);

        const rate = totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : 0;

        return { totalAmount, paidAmount, unpaidAmount, rate };
    }, [invoices]);

    const getRowBorderColor = (status) => {
        switch (status) {
            case "paid":
                return "4px solid green";
            case "unpaid":
                return "4px solid red";
            default:
                return "4px solid gray";
        }
    };

    return (
        <Container sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Hóa đơn
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Quản lý hóa đơn cho nhà trọ
                    </Typography>
                </Box>
                <Button variant="outlined" startIcon={<FileDownload />} disabled={!filtered.length} onClick={exportCSV}>
                    Xuất CSV
                </Button>
            </Box>

            {/* KPIs */}
            {invoices.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                            gap: 2,
                        }}
                    >
                        <Box sx={kpiCardSx}>
                            <Typography sx={kpiLabelSx}>Tổng tiền</Typography>
                            <Typography sx={kpiValueSx}>{formatVND(kpis.totalAmount)}đ</Typography>
                        </Box>
                        <Box sx={kpiCardSx}>
                            <Typography sx={kpiLabelSx}>Đã thanh toán</Typography>
                            <Typography sx={{ ...kpiValueSx, color: "green" }}>
                                {formatVND(kpis.paidAmount)}đ
                            </Typography>
                        </Box>
                        <Box sx={kpiCardSx}>
                            <Typography sx={kpiLabelSx}>Chưa thanh toán</Typography>
                            <Typography sx={{ ...kpiValueSx, color: "red" }}>
                                {formatVND(kpis.unpaidAmount)}đ
                            </Typography>
                        </Box>
                        <Box sx={kpiCardSx}>
                            <Typography sx={kpiLabelSx}>Tỷ lệ thu</Typography>
                            <Typography sx={{ ...kpiValueSx, color: "#7b1fa2" }}>{kpis.rate}%</Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            <Box sx={{ mb: 3 }}>
                <SearchInvoiceForm
                    search={search}
                    setSearch={setSearch}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    monthFilter={monthFilter}
                    setMonthFilter={setMonthFilter}
                    monthOptions={monthOptions}
                />
            </Box>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tháng/Năm</TableCell>
                            <TableCell>Phòng</TableCell>
                            <TableCell>Số tiền</TableCell>
                            <TableCell>Trạng thái</TableCell>
                            <TableCell>Ảnh hóa đơn</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    Không tìm thấy hóa đơn
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((inv) => (
                                <TableRow
                                    key={inv._id}
                                    hover
                                    sx={{
                                        borderLeft: getRowBorderColor(inv.status),
                                        "&:hover": {
                                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                                        },
                                    }}
                                >
                                    <TableCell>{parseMonthLabel(inv)}</TableCell>
                                    <TableCell>{inv.roomCode || "-"}</TableCell>
                                    <TableCell>{formatVND(inv.totalAmount)}đ</TableCell>
                                    <TableCell>
                                        <Select
                                            size="small"
                                            value={inv.status}
                                            onChange={(e) => handleStatusChange(inv, e.target.value)}
                                            sx={{ minWidth: 140 }}
                                        >
                                            <MenuItem value="pending" disabled={inv.evidenceUrls}>
                                                Đang chờ
                                            </MenuItem>

                                            <MenuItem value="unpaid">Chưa thanh toán</MenuItem>

                                            <MenuItem value="paid">Đã thanh toán</MenuItem>
                                        </Select>
                                    </TableCell>

                                    <TableCell>
                                        {inv.evidenceUrls ? (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<Visibility />}
                                                onClick={() => handleViewImage(inv.evidenceUrls)}
                                                sx={{ textTransform: "none" }}
                                            >
                                                Xem ảnh
                                            </Button>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                Chưa có
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Image Dialog */}
            <Dialog
                open={imageDialogOpen}
                onClose={handleCloseImageDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        overflow: "hidden",
                    },
                }}
            >
                <DialogActions
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        minHeight: "auto",
                        p: 0,
                    }}
                >
                    <IconButton
                        onClick={handleCloseImageDialog}
                        sx={{
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            color: "white",
                            "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.7)",
                            },
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogActions>
                <DialogContent sx={{ p: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {currentImageUrl && (
                        <img
                            src={currentImageUrl}
                            alt="Bằng chứng thanh toán"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "80vh",
                                objectFit: "contain",
                            }}
                            onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "block";
                            }}
                        />
                    )}
                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ display: "none", textAlign: "center", p: 4 }}
                    >
                        Không thể tải ảnh
                    </Typography>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                show={confirmOpen}
                title="Xác nhận thay đổi trạng thái"
                message={`Bạn có chắc muốn thay đổi trạng thái hóa đơn thành "${
                    pendingStatusChange?.newStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"
                }"?`}
                onCancel={() => {
                    setConfirmOpen(false);
                    setPendingStatusChange(null);
                }}
                onConfirm={confirmStatusChange}
                confirmText="Đồng ý"
                cancelText="Hủy"
            />
        </Container>
    );
}

const kpiCardSx = {
    border: "1px solid #e0e0e0",
    borderRadius: 3,
    px: 2.5,
    py: 2,
    backgroundColor: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};
const kpiLabelSx = { color: "text.secondary", fontSize: 14, fontWeight: 600 };
const kpiValueSx = { mt: 0.5, fontWeight: 700, fontSize: 22 };

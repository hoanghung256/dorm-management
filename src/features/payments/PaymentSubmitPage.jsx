import React from "react";
import { useMemo, useState } from "react";
import { uploadFile, getFileDownloadURL, FOLDERS } from "../../services/storage";
import { convexMutation, convexQueryRealtime } from "../../services/convexClient";
import { api } from "../../../convex/_generated/api";
import useConvexUserData from "../../hooks/useConvexUserData";
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Input,
    Chip,
    CircularProgress,
    Stack,
    Link,
    Dialog,
    DialogContent,
    DialogActions,
    IconButton,
} from "@mui/material";
import { Close, Image as ImageIcon, Visibility } from "@mui/icons-material";

function formatVND(n) {
    if (n === undefined || n === null) return "-";
    try {
        return new Intl.NumberFormat("vi-VN").format(n);
    } catch {
        return `${n}`;
    }
}

function invoiceStatusChip(status) {
    switch (status) {
        case "paid":
            return { label: "Thanh toán thành công", color: "success" };
        case "pending":
            return { label: "Chưa thanh toán", color: "default" };
        case "unpaid":
            return { label: "Thanh toán thất bại.", color: "info" };
        default:
            return { label: "Chưa thanh toán", color: "info" };
    }
}

export default function PaymentSubmitPage({ renterId }) {
    const [selectedFile, setSelectedFile] = useState({});
    const [uploadingIds, setUploadingIds] = useState({});
    const [progressMap, setProgressMap] = useState({});
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imgSrc, setImgSrc] = useState("");

    const user = useConvexUserData();
    const derivedRenterId = !renterId && user?.role === "renter" ? user?.detail?._id : undefined;
    const effectiveRenterId = renterId || derivedRenterId;

    const invoices = convexQueryRealtime(
        effectiveRenterId ? api.functions.payments.listInvoicesForRenter : undefined,
        effectiveRenterId ? { renterId: effectiveRenterId } : undefined,
    );
    const hasData = Array.isArray(invoices);

    const onFileChange = (invoiceId, e) => {
        const file = e.target.files?.[0];
        setSelectedFile((prev) => ({ ...prev, [invoiceId]: file }));
    };

    const onSubmit = async (invoiceId) => {
        setError("");
        setSuccessMsg("");
        if (!effectiveRenterId) {
            setError("Thiếu renterId");
            return;
        }
        try {
            const file = selectedFile[invoiceId];
            if (!file) return setError("Chưa chọn file chứng từ");
            setUploadingIds((p) => ({ ...p, [invoiceId]: true }));
            const path = await uploadFile(file, {
                folder: FOLDERS.INVOICES,
                onProgress: (pct) => setProgressMap((pm) => ({ ...pm, [invoiceId]: Math.round(pct) })),
            });
            const url = await getFileDownloadURL(path);
            await convexMutation(api.functions.payments.submitEvidence, {
                invoiceId,
                renterId: effectiveRenterId,
                files: [{ url }],
            });
            setSelectedFile((p) => ({ ...p, [invoiceId]: undefined }));
            setSuccessMsg("Gửi minh chứng thành công");
        } catch (e) {
            setError(e?.message || "Gửi minh chứng thất bại");
        } finally {
            setUploadingIds((p) => ({ ...p, [invoiceId]: false }));
            setProgressMap((pm) => ({ ...pm, [invoiceId]: undefined }));
        }
    };

    // Handle view image inside dialog; if evidenceUrl is already a full URL just use it
    const handleViewImage = async (pathOrUrl) => {
        try {
            if (!pathOrUrl) return;
            const isFullUrl = /^https?:\/\//i.test(pathOrUrl);
            const url = isFullUrl ? pathOrUrl : await getFileDownloadURL(pathOrUrl);
            setImgSrc(url);
            setImageDialogOpen(true);
        } catch (error) {
            console.error("Failed to fetch image URL:", error);
            setError("Không thể tải ảnh minh chứng");
        }
    };

    const handleCloseImageDialog = () => {
        setImageDialogOpen(false);
        setImgSrc("");
    };

    const rows = useMemo(() => {
        if (!hasData) return [];
        return invoices.map((inv) => {
            const periodStart = inv.period?.start ? new Date(inv.period.start) : null;
            const displayMonth = periodStart
                ? `Tháng ${periodStart.getMonth() + 1} năm ${periodStart.getFullYear()}`
                : "-";
            return { ...inv, displayMonth };
        });
    }, [hasData, invoices]);

    if (!effectiveRenterId)
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="body1" color="text.secondary">
                    Đang tải thông tin người thuê...
                </Typography>
            </Box>
        );

    return (
        <>
            <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                    Thêm minh chứng thanh toán
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 3, color: "primary.main" }}>
                    Tải hóa đơn, lưu trữ và đối chiếu thanh toán tiện lợi
                </Typography>

                <TableContainer component={Paper} sx={{ mb: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Phòng</TableCell>
                                <TableCell>Tháng</TableCell>
                                <TableCell>Số tiền</TableCell>
                                <TableCell>Trạng thái</TableCell>
                                <TableCell align="right">Minh chứng</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {!hasData && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            )}
                            {hasData && rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Không có hóa đơn nào.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((inv) => {
                                const file = selectedFile[inv._id];
                                const uploading = !!uploadingIds[inv._id];
                                const progress = progressMap[inv._id];
                                const statusInfo = invoiceStatusChip(inv.status);
                                const alreadySubmitted = ["unpaid", "paid"].includes(inv.status);
                                const hasEvidence = !!inv.evidenceUrl;
                                return (
                                    <TableRow key={inv._id} hover>
                                        <TableCell>{inv.roomCode || inv.roomId?.id || inv.roomId}</TableCell>
                                        <TableCell>{inv.displayMonth}</TableCell>
                                        <TableCell>{formatVND(inv.totalAmount)}₫</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={statusInfo.label}
                                                color={statusInfo.color}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {hasEvidence ? (
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    justifyContent="flex-end"
                                                    alignItems="center"
                                                >
                                                    <Chip
                                                        size="small"
                                                        color={inv.status === "paid" ? "success" : "info"}
                                                        label={inv.status === "paid" ? "Đã thanh toán" : "Đã gửi"}
                                                    />
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        startIcon={<Visibility fontSize="small" />}
                                                        onClick={() => handleViewImage(inv.evidenceUrl)}
                                                    >
                                                        Xem ảnh
                                                    </Button>
                                                </Stack>
                                            ) : alreadySubmitted ? (
                                                <Chip size="small" color="info" label="Đã gửi" />
                                            ) : (
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    justifyContent="flex-end"
                                                >
                                                    <Input
                                                        type="file"
                                                        onChange={(e) => onFileChange(inv._id, e)}
                                                        sx={{ display: "none" }}
                                                        inputProps={{ accept: "image/*" }}
                                                        id={`evidence-input-${inv._id}`}
                                                    />
                                                    <label htmlFor={`evidence-input-${inv._id}`}>
                                                        <Button
                                                            component="span"
                                                            size="small"
                                                            variant="outlined"
                                                            disabled={uploading}
                                                        >
                                                            Chọn ảnh
                                                        </Button>
                                                    </label>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={() => onSubmit(inv._id)}
                                                        disabled={uploading || !file}
                                                    >
                                                        {uploading
                                                            ? progress !== undefined
                                                                ? `Đang gửi ${progress}%`
                                                                : "Đang gửi..."
                                                            : "Gửi"}
                                                    </Button>
                                                    {file && (
                                                        <Typography variant="caption" sx={{ maxWidth: 120 }} noWrap>
                                                            {file.name}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                {error && (
                    <Typography color="error" sx={{ mb: 1 }}>
                        {error}
                    </Typography>
                )}
                {successMsg && (
                    <Typography color="success.main" sx={{ mb: 1 }}>
                        {successMsg}
                    </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                    Sau khi gửi, hóa đơn sẽ chuyển sang trạng thái "Đã gửi" và chờ duyệt.
                </Typography>
            </Box>
            <Dialog
                open={imageDialogOpen}
                onClose={handleCloseImageDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2, overflow: "hidden" },
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
                            backgroundColor: "rgba(0,0,0,0.5)",
                            color: "white",
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogActions>
                <DialogContent sx={{ p: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imgSrc}
                            alt="Evidence"
                            style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
                        />
                    ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ p: 4 }}>
                            Không thể tải ảnh
                        </Typography>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

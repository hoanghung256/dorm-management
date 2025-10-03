import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { convexMutation, convexQueryOneTime } from "../../services/convexClient";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
    MenuItem,
} from "@mui/material";

export default function UpdateRoomForm({ open, onClose, landlordId, dormId, roomId, roomData, onUpdate }) {
    const [code, setCode] = useState("");
    const [price, setPrice] = useState("");
    const [status, setStatus] = useState("vacant");
    const [dormName, setDormName] = useState("");
    const [currentRenterId, setCurrentRenterId] = useState("");
    const [availableRenters, setAvailableRenters] = useState([]);
    const [dormLoading, setDormLoading] = useState(false);
    const [rentersLoading, setRentersLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const statusOptions = [
        { value: "vacant", label: "Trống" },
        { value: "occupied", label: "Đang sử dụng" },
        { value: "maintenance", label: "Đang sửa" },
    ];

    // Validation functions
    const validateCode = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return "Mã phòng không được để trống";
        if (trimmed.length < 1) return "Mã phòng phải có ít nhất 1 ký tự";
        if (trimmed.length > 20) return "Mã phòng không được quá 20 ký tự";
        if (!/^[a-zA-Z0-9\-_\s]+$/.test(trimmed)) return "Mã phòng chỉ được chứa chữ, số, dấu gạch ngang, gạch dưới và khoảng trắng";
        return null;
    };

    const validatePrice = (value) => {
        if (value === "") return "Giá phòng không được để trống";

        const numValue = Number(value);
        if (isNaN(numValue)) return "Giá phòng phải là số";
        if (numValue < 0) return "Giá phòng không được âm";
        if (numValue > 100000000) return "Giá phòng không được vượt quá 100 triệu VND";
        if (!Number.isInteger(numValue)) return "Giá phòng phải là số nguyên";

        return null;
    };

    // Real-time validation handlers
    const handleCodeChange = (e) => {
        const value = e.target.value;
        setCode(value);

        const error = validateCode(value);
        setErrors(prev => ({
            ...prev,
            code: error
        }));
    };

    const handlePriceChange = (e) => {
        let value = e.target.value;

        // Only allow digits
        value = value.replace(/[^0-9]/g, '');

        setPrice(value);

        const error = validatePrice(value);
        setErrors(prev => ({
            ...prev,
            price: error
        }));
    };

    const formatPrice = (value) => {
        if (!value) return "";
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    useEffect(() => {
        if (!open || !roomData) return;

        // Populate form with existing room data
        setCode(roomData.code || "");
        setPrice(roomData.price ? roomData.price.toString() : "");
        setStatus(roomData.status || statusOptions[0].value);
        setCurrentRenterId(roomData.currentRenterId || "");

        let cancelled = false;

        (async () => {
            setDormLoading(true);
            setRentersLoading(true);

            try {
                // Load dorm name
                if (dormId && api.functions?.dorms?.getById) {
                    try {
                        console.log("Loading dorm name for dormId:", dormId);
                        const dorm = await convexQueryOneTime(api.functions.dorms.getById, { dormId });
                        console.log("Loaded dorm:", dorm);

                        if (!cancelled && dorm && dorm.name) {
                            console.log("Setting dorm name:", dorm.name);
                            setDormName(dorm.name);
                        } else if (!cancelled) {
                            console.log("No dorm name found, using fallback");
                            setDormName(`Khu trọ ${dormId.slice(-4)}`);
                        }
                    } catch (dormError) {
                        console.error("Failed to load dorm name:", dormError);
                        if (!cancelled) {
                            setDormName(`Khu trọ ${dormId.slice(-4)}`);
                        }
                    }
                }

                if (roomId && api.functions?.renters?.listByRoom) {
                    try {
                        const renters = await convexQueryOneTime(api.functions.renters.listByRoom, { roomId });
                        if (!cancelled) setAvailableRenters(renters || []);

                        if (
                            !cancelled &&
                            (!renters || renters.length === 0) &&
                            roomData?.currentRenterId &&
                            api.functions?.renters?.getById
                        ) {
                            try {
                                const single = await convexQueryOneTime(api.functions.renters.getById, {
                                    renterId: roomData.currentRenterId,
                                });
                                if (single) setAvailableRenters([single]);
                            } catch (e) {
                                console.warn("Fallback renter fetch failed:", e);
                            }
                        }
                    } catch (rentersError) {
                        console.error("Failed to load renters for room:", rentersError);
                        if (!cancelled) setAvailableRenters([]);
                    }
                } else if (!cancelled) {
                    setAvailableRenters([]);
                }
            } catch (e) {
                if (!cancelled) {
                    const msg = e?.message || "";
                    if (msg.includes("Failed to fetch") || msg.includes("TypeError")) {
                        setErrors(prev => ({
                            ...prev,
                            general: "Không thể kết nối máy chủ. Hãy chạy `npx convex dev` và kiểm tra VITE_CONVEX_URL."
                        }));
                    } else {
                        setErrors(prev => ({
                            ...prev,
                            general: msg || "Tải dữ liệu thất bại."
                        }));
                    }
                    console.error("Load data failed:", e);
                }
            } finally {
                if (!cancelled) {
                    setDormLoading(false);
                    setRentersLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, roomData, dormId, landlordId, roomId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        // Validate all fields
        const codeError = validateCode(code);
        const priceError = validatePrice(price);

        const newErrors = {
            code: codeError,
            price: priceError,
        };

        setErrors(newErrors);

        // Check if there are any errors
        const hasErrors = Object.values(newErrors).some(error => error !== null);
        if (hasErrors) {
            return;
        }

        try {
            const trimmed = code.trim();
            const numPrice = Number(price);
            const statusToSave = currentRenterId ? status : "vacant";

            setSubmitting(true);
            await convexMutation(api.functions.rooms.update, {
                roomId,
                code: trimmed,
                price: numPrice,
                status: statusToSave,
                currentRenterId: currentRenterId || undefined,
            });

            // Clear form and close
            setCode("");
            setPrice("");
            setErrors({});
            onUpdate?.();
            onClose?.();
        } catch (err) {
            const msg = err?.message || "Cập nhật phòng thất bại.";
            if (msg.includes("Failed to fetch")) {
                setErrors(prev => ({
                    ...prev,
                    general: "Không thể kết nối máy chủ. Hãy chạy `npx convex dev` và kiểm tra VITE_CONVEX_URL."
                }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    general: msg
                }));
            }
            console.error("Update room failed:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return;
        setErrors({});
        onClose?.();
        setCode("");
        setPrice("");
        setStatus(statusOptions[0].value);
        setCurrentRenterId("");
        setAvailableRenters([]);
    };

    // Check if form is valid
    const isFormValid = () => {
        return !validateCode(code) &&
            !validatePrice(price) &&
            code.trim() !== "" &&
            price !== "";
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    minWidth: 560,
                    maxWidth: 600,
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontWeight: "bold",
                    fontSize: "1.3rem",
                    fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                    color: "#333",
                    pb: 1,
                }}
            >
                Cập nhật thông tin phòng
            </DialogTitle>
            <DialogContent sx={{ pt: 2, pb: 1 }}>
                {errors.general && (
                    <Typography
                        variant="body2"
                        color="error"
                        sx={{
                            m: 2,
                            p: 1.5,
                            backgroundColor: "#ffeaea",
                            borderRadius: 1,
                            border: "1px solid #ffcdd2",
                        }}
                    >
                        {errors.general}
                    </Typography>
                )}
                <Stack spacing={2.5}>
                    <TextField
                        label="Khu trọ"
                        value={dormLoading ? "Đang tải tên khu trọ..." : dormName || dormId || "Chưa chọn"}
                        InputProps={{ readOnly: true }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                    <TextField
                        label="Mã phòng"
                        value={code}
                        onChange={handleCodeChange}
                        error={!!errors.code}
                        helperText={errors.code || "Nhập mã phòng (chỉ chữ, số, dấu gạch)"}
                        fullWidth
                        placeholder="Ví dụ: A101, P-201, Phòng 301"
                        inputProps={{ maxLength: 20 }}
                    />
                    <TextField
                        label="Giá phòng (VND)"
                        value={price}
                        onChange={handlePriceChange}
                        error={!!errors.price}
                        helperText={
                            errors.price ||
                            (price && !errors.price ? `${formatPrice(price)} VND` : "Nhập giá phòng bằng số")
                        }
                        placeholder="Ví dụ: 2500000"
                        fullWidth
                        inputProps={{
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                        }}
                    />
                    <TextField
                        select
                        label="Trạng thái phòng"
                        value={status}
                        onChange={(e) => {
                            const next = e.target.value;
                            setErrors(prev => ({ ...prev, status: null }));

                            // Check if trying to set status to 'vacant' while there's a current renter
                            const hasCurrentRenter = currentRenterId || roomData?.currentRenterId;
                            if (next === "vacant" && hasCurrentRenter) {
                                setErrors(prev => ({
                                    ...prev,
                                    status: "Không thể chuyển trạng thái thành 'Trống' khi phòng vẫn còn người thuê. Vui lòng xóa người thuê trước."
                                }));
                                return;
                            }

                            setStatus(next);
                            // If status set to 'vacant', clear renter automatically
                            if (next === "vacant") {
                                setCurrentRenterId("");
                            }
                        }}
                        fullWidth
                        MenuProps={{
                            disablePortal: true,
                            PaperProps: {
                                sx: {
                                    maxHeight: 300,
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                },
                            },
                            anchorOrigin: {
                                vertical: "bottom",
                                horizontal: "left",
                            },
                            transformOrigin: {
                                vertical: "top",
                                horizontal: "left",
                            },
                        }}
                        sx={{
                            "& .MuiSelect-select": {
                                py: 1.5,
                            },
                        }}
                    >
                        {statusOptions.map((option) => {
                            const hasCurrentRenter = currentRenterId || roomData?.currentRenterId;
                            const isVacantWithRenter = option.value === "vacant" && hasCurrentRenter;
                            return (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                    disabled={isVacantWithRenter}
                                    sx={{
                                        py: 1,
                                        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                                        ...(isVacantWithRenter && {
                                            color: "text.disabled",
                                            "&.Mui-disabled": {
                                                opacity: 0.5,
                                            },
                                        }),
                                    }}
                                >
                                    {option.label}
                                    {isVacantWithRenter && " (Có người thuê)"}
                                </MenuItem>
                            );
                        })}
                    </TextField>

                    <TextField
                        select
                        label="Người thuê hiện tại"
                        value={currentRenterId}
                        onChange={(e) => {
                            const nextId = e.target.value;
                            setCurrentRenterId(nextId);
                            // If user clears renter, auto-set status to vacant
                            if (!nextId) {
                                setStatus("vacant");
                            }
                        }}
                        fullWidth
                        disabled={rentersLoading}
                        helperText={
                            rentersLoading
                                ? "Đang tải danh sách người thuê..."
                                : availableRenters.length === 0
                                    ? "Không có người thuê trong phòng này"
                                    : "Chọn người thuê cho phòng này"
                        }
                        MenuProps={{
                            disablePortal: true,
                            PaperProps: {
                                sx: {
                                    maxHeight: 300,
                                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                },
                            },
                            anchorOrigin: {
                                vertical: "bottom",
                                horizontal: "left",
                            },
                            transformOrigin: {
                                vertical: "top",
                                horizontal: "left",
                            },
                        }}
                        sx={{
                            "& .MuiSelect-select": {
                                py: 1.5,
                            },
                        }}
                    >
                        <MenuItem
                            value=""
                            sx={{
                                py: 1,
                                fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                                fontStyle: "italic",
                                color: "#666",
                            }}
                        >
                            Không có người thuê
                        </MenuItem>
                        {availableRenters.map((renter) => (
                            <MenuItem
                                key={renter._id}
                                value={renter._id}
                                sx={{
                                    py: 1,
                                    fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                                }}
                            >
                                {renter.name || `Renter ${renter._id.slice(-4)}`}
                                {renter.contact && ` (${renter.contact})`}
                            </MenuItem>
                        ))}
                    </TextField>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 5, pb: 3, gap: 1.5, justifyContent: "flex-end" }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
                        fontWeight: 500,
                        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                        borderColor: "#e0e0e0",
                        color: "#666",
                        minWidth: 100,
                        "&:hover": {
                            borderColor: "#bdbdbd",
                            backgroundColor: "#f5f5f5",
                        },
                    }}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || !isFormValid()}
                    variant="contained"
                    sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
                        fontWeight: 500,
                        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                        backgroundColor: "#7b1fa2",
                        minWidth: 120,
                        boxShadow: "0 4px 12px rgba(123, 31, 162, 0.3)",
                        "&:hover": {
                            backgroundColor: "#6a1b9a",
                            boxShadow: "0 6px 16px rgba(123, 31, 162, 0.4)",
                        },
                        "&:disabled": {
                            backgroundColor: "#ccc",
                            boxShadow: "none",
                        },
                    }}
                >
                    {submitting ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

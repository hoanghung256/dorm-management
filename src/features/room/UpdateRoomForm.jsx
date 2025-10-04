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
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { CurrencyTextField } from "../../components/CurrencyTextField";

export default function UpdateRoomForm({ open, onClose, landlordId, dormId, roomId, roomData, onUpdate }) {
    const [code, setCode] = useState("");
    const [price, setPrice] = useState(0);
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

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm")); // responsive fullscreen on small devices
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
        const numValue = Number(value);
        if (isNaN(numValue)) return "Giá phòng phải là số";
        if (numValue < 1000) return "Giá phòng tối thiểu là 1,000 VND";
        if (numValue > 100000000) return "Giá phòng không được vượt quá 100 triệu VND";
        if (!Number.isInteger(numValue)) return "Giá phòng phải là số nguyên";
        if (numValue % 1000 !== 0) return "Giá phòng phải ở đơn vị nghìn đồng (ví dụ: 12,000,000)";
        
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

    const handlePriceChange = (value) => {
        setPrice(value);
        
        const error = validatePrice(value);
        setErrors(prev => ({
            ...prev,
            price: error
        }));
    };

    useEffect(() => {
        if (!open || !roomData) return;

        // Populate form with existing room data
        setCode(roomData.code || "");
        setPrice(roomData.price || 0);
        setStatus(roomData.status || statusOptions[0].value);
        setCurrentRenterId(roomData.currentRenterId || "");
        setErrors({});

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
            
            // Check if trying to set status to 'vacant' while there's a renter
            const hasCurrentRenter = currentRenterId || roomData?.currentRenterId;
            if (status === "vacant" && hasCurrentRenter) {
                setErrors(prev => ({
                    ...prev,
                    general: "Không thể chuyển trạng thái thành 'Trống' khi phòng vẫn còn người thuê. Vui lòng xóa người thuê trước."
                }));
                return;
            }

            // Check if trying to remove renter when room has one
            if (!currentRenterId && roomData?.currentRenterId) {
                setErrors(prev => ({
                    ...prev,
                    general: "Không thể xóa người thuê khi phòng đang có người ở. Vui lòng chuyển người thuê sang phòng khác trước."
                }));
                return;
            }

            // If no renter selected, ensure status becomes 'vacant'
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
            setPrice(0);
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
        setPrice(0);
        setStatus(statusOptions[0].value);
        setCurrentRenterId("");
        setAvailableRenters([]);
    };

    // Check if form is valid
    const isFormValid = () => {
        return !validateCode(code) && 
               !validatePrice(price) && 
               code.trim() !== "";
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullScreen={fullScreen}
            fullWidth
            maxWidth="md"
            keepMounted
            PaperProps={{
                sx: {
                    borderRadius: fullScreen ? 0 : 3,
                    width: "100%",
                    maxWidth: { xs: "100%", sm: 600, md: 640 },
                    m: 0,
                    ...(fullScreen ? {} : { mx: "auto" }),
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "calc(100vh - 32px)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontWeight: "bold",
                    fontSize: "1.25rem",
                    pr: 6,
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
                            mb: 2,
                            p: 2,
                            backgroundColor: "#ffeaea",
                            borderRadius: 1,
                            border: "1px solid #ffcdd2",
                        }}
                    >
                        {errors.general}
                    </Typography>
                )}
                <Stack spacing={2}>
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
                    <CurrencyTextField
                        label="Giá phòng (VNĐ)"
                        value={price}
                        onChange={handlePriceChange}
                        error={!!errors.price}
                        helperText={errors.price || "Nhập giá phòng (phải ở đơn vị nghìn đồng)"}
                        placeholder="Ví dụ: 2500000 (2.5 triệu)"
                        fullWidth
                    />
                    <TextField
                        select
                        label="Trạng thái phòng"
                        value={status}
                        onChange={(e) => {
                            const next = e.target.value;
                            setErrors(prev => ({ ...prev, general: null }));

                            // Check if room has a renter - if so, don't allow status change
                            const hasCurrentRenter = currentRenterId || roomData?.currentRenterId;
                            if (hasCurrentRenter) {
                                setErrors(prev => ({
                                    ...prev,
                                    general: "Không thể thay đổi trạng thái phòng khi đã có người thuê. Vui lòng xóa người thuê trước."
                                }));
                                return;
                            }

                            setStatus(next);
                            if (next === "vacant") {
                                setCurrentRenterId("");
                            }
                        }}
                        fullWidth
                        disabled={!!(currentRenterId || roomData?.currentRenterId)}
                        helperText={
                            (currentRenterId || roomData?.currentRenterId) 
                                ? "Không thể thay đổi trạng thái khi có người thuê" 
                                : "Chọn trạng thái phòng"
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
                        {statusOptions.map((option) => {
                            const hasCurrentRenter = currentRenterId || roomData?.currentRenterId;
                            return (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                    disabled={hasCurrentRenter}
                                    sx={{
                                        py: 1,
                                        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                                        ...(hasCurrentRenter && {
                                            color: "text.disabled",
                                            "&.Mui-disabled": {
                                                opacity: 0.5,
                                            },
                                        }),
                                    }}
                                >
                                    {option.label}
                                    {hasCurrentRenter && " (Có người thuê)"}
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
                            
                            // Check if trying to remove renter when room already has one
                            const hasCurrentRenter = currentRenterId || roomData?.currentRenterId;
                            if (!nextId && hasCurrentRenter) {
                                setErrors(prev => ({
                                    ...prev,
                                    general: "Không thể xóa người thuê khi phòng đang có người ở. Vui lòng chuyển người thuê sang phòng khác trước."
                                }));
                                return;
                            }
                            
                            setCurrentRenterId(nextId);
                            setErrors(prev => ({ ...prev, general: null }));
                            
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
                            disabled={!!(currentRenterId || roomData?.currentRenterId)}
                            sx={{
                                py: 1,
                                fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                                fontStyle: "italic",
                                color: (currentRenterId || roomData?.currentRenterId) ? "#ccc" : "#666",
                                "&.Mui-disabled": {
                                    opacity: 0.5,
                                },
                            }}
                        >
                            {(currentRenterId || roomData?.currentRenterId) 
                                ? "Không thể xóa người thuê" 
                                : "Không có người thuê"
                            }
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
            <DialogActions
                sx={{
                    px: fullScreen ? 2 : 5,
                    py: 2,
                    gap: 1.5,
                    justifyContent: "flex-end",
                    flexShrink: 0,
                }}
            >
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
                    disabled={submitting}
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

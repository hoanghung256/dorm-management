import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { convexMutation, convexQueryOneTime } from "../../services/convexClient";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { CurrencyTextField } from "../../components/CurrencyTextField";

export default function CreateRoomForm({ open, onClose, landlordId, dormId, onCreated }) {
    const [code, setCode] = useState("");
    const [price, setPrice] = useState(0);
    const [dormName, setDormName] = useState("");
    const [dormLoading, setDormLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Validation functions
    const validateCode = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return "Mã phòng không được để trống";
        if (trimmed.length > 20) return "Mã phòng không được quá 20 ký tự";
        if (!/^[a-zA-Z0-9\-_\s]+$/.test(trimmed)) return "Mã phòng chỉ được chứa chữ, số, dấu gạch nối và khoảng trắng";
        return null;
    };

    const validatePrice = (value) => {
        const num = Number(value);
        if (isNaN(num) || num < 0) return "Giá phòng phải là số không âm";
        if (num > 0 && num < 1000) return "Giá phòng tối thiểu là 1,000 VNĐ";
        if (num % 1000 !== 0) return "Giá phòng phải ở đơn vị nghìn đồng (ví dụ: 12,000,000)";
        return null;
    };

    useEffect(() => {
        if (!open) return;

        // Clear errors when form opens
        setErrors({});

        let cancelled = false;

        (async () => {
            setDormLoading(true);
            try {
                // Load dorm name
                if (dormId && api.functions?.dorms?.getById) {
                    console.log("Loading dorm name for dormId:", dormId);
                    const dorm = await convexQueryOneTime(api.functions.dorms.getById, { dormId });
                    console.log("Loaded dorm in CreateRoomForm:", dorm);

                    if (!cancelled && dorm && dorm.name) {
                        console.log("Setting dorm name:", dorm.name);
                        setDormName(dorm.name);
                    } else if (!cancelled) {
                        console.log("No dorm name, using fallback");
                        setDormName(`Khu trọ ${dormId.slice(-4)}`);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    setDormName(dormId);
                    const msg = e?.message || "";
                    if (msg.includes("Failed to fetch") || msg.includes("TypeError")) {
                        setErrors({ general: "Không thể kết nối máy chủ. Hãy chạy `npx convex dev` và kiểm tra VITE_CONVEX_URL." });
                    } else {
                        setErrors({ general: msg || "Tải tên khu trọ thất bại." });
                    }
                    console.error("Fetch dorm name failed:", e);
                }
            } finally {
                if (!cancelled) setDormLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, dormId]);

    // Handle input changes with validation
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        // Clear previous errors
        setErrors({});

        // Validate all fields
        const codeError = validateCode(code);
        const priceError = validatePrice(price);

        if (codeError || priceError) {
            setErrors({
                code: codeError,
                price: priceError
            });
            return;
        }

        try {
            const trimmed = code.trim();
            const p = price || 0;

            setSubmitting(true);
            const result = await convexMutation(api.functions.rooms.create, {
                landlordId,
                code: trimmed,
                dormId: dormId || undefined,
                price: p,
            });

            console.log("Room created with amenities:", result);

            // Room created successfully - no popup needed
            // if (result.totalAmenities > 0) {
            //     alert(`✅ Phòng ${trimmed} đã được tạo thành công với ${result.amenityLinksCreated}/${result.totalAmenities} tiện ích!`);
            // }

            setCode("");
            setPrice(0);
            setErrors({});
            onCreated?.();
        } catch (err) {
            const msg = err?.message || "Tạo phòng thất bại.";
            if (msg.includes("Failed to fetch")) {
                setErrors({ general: "Không thể kết nối máy chủ. Hãy chạy `npx convex dev` và kiểm tra VITE_CONVEX_URL." });
            } else {
                setErrors({ general: msg });
            }
            console.error("Create room failed:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return;
        setErrors({});
        setCode("");
        setPrice(0);
        onClose?.();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            component="form"
            onSubmit={handleSubmit}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    minWidth: 500,
                },
            }}
        >
            <DialogTitle>Tạo phòng</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
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
                        autoFocus
                        required
                        fullWidth
                        disabled={submitting}
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
                        disabled={submitting}
                    />
                    {errors.general && (
                        <Typography color="error" variant="body2">
                            {errors.general}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} disabled={submitting}>
                    Hủy
                </Button>
                <Button type="submit" variant="contained" disabled={submitting || !landlordId}>
                    {submitting ? "Đang tạo..." : "Tạo phòng"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

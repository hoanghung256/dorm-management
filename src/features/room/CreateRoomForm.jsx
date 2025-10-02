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
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
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
                        setError("Không thể kết nối máy chủ. Hãy chạy `npx convex dev` và kiểm tra VITE_CONVEX_URL.");
                    } else {
                        setError(msg || "Tải tên khu trọ thất bại.");
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setError("");

        try {
            const trimmed = code.trim();
            if (!trimmed) throw new Error("Mã phòng không được để trống.");

            const p = price || 0;
            if (Number.isNaN(p) || p < 0) throw new Error("Giá phòng không hợp lệ.");

            setSubmitting(true);
            await convexMutation(api.functions.rooms.create, {
                landlordId,
                code: trimmed,
                dormId: dormId || undefined,
                price: p,
            });

            setCode("");
            setPrice(0);
            onCreated?.();
        } catch (err) {
            const msg = err?.message || "Tạo phòng thất bại.";
            if (msg.includes("Failed to fetch")) {
                setError("Không thể kết nối máy chủ. Hãy chạy `npx convex dev` và kiểm tra VITE_CONVEX_URL.");
            } else {
                setError(msg);
            }
            console.error("Create room failed:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return;
        setError("");
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
                        onChange={(e) => setCode(e.target.value)}
                        autoFocus
                        required
                        fullWidth
                        disabled={submitting}
                    />
                    <CurrencyTextField
                        label="Giá phòng (VNĐ)"
                        value={price}
                        onChange={setPrice}
                        helperText="Để trống = 0 VNĐ"
                        fullWidth
                        disabled={submitting}
                    />
                    {error && (
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
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

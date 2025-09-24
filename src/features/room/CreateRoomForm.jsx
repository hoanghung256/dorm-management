import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { convexMutation, convexQueryOneTime } from "../../services/convexClient";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";

export default function CreateRoomForm({ open, onClose, landlordId, dormId, onCreated }) {
    const [code, setCode] = useState("");
    const [price, setPrice] = useState("");
    const [dormName, setDormName] = useState("");
    const [dormLoading, setDormLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        (async () => {
            if (!dormId) {
                setDormName("Tự động chọn khu trọ đầu tiên");
                return;
            }
            try {
                const d = await convexQueryOneTime(api.functions.dorms.getById, { dormId });
                if (!cancelled) setDormName(d?.name || dormId);
            } catch {
                if (!cancelled) setDormName(dormId);
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
            if (!landlordId) throw new Error("Thiếu landlordId.");
            const trimmed = code.trim();
            if (!trimmed) throw new Error("Mã phòng không được để trống.");

            const p = price === "" ? 0 : Number(price);
            if (Number.isNaN(p) || p < 0) throw new Error("Giá phòng không hợp lệ.");

            setSubmitting(true);
            await convexMutation(api.functions.rooms.create, {
                landlordId,
                code: trimmed,
                dormId: dormId || undefined,
                price: p,
            });

            setCode("");
            setPrice("");
            onCreated?.();
        } catch (err) {
            setError(err?.message || "Tạo phòng thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (submitting) return;
        setError("");
        setCode("");
        setPrice("");
        onClose?.();
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" component="form" onSubmit={handleSubmit}>
            <DialogTitle>Tạo phòng</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                        label="Khu trọ"
                        value={dormLoading ? "Đang tải tên khu trọ..." : dormName || dormId || "Chưa chọn"}
                        InputProps={{ readOnly: true }}
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
                    <TextField
                        label="Giá (VND)"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        inputProps={{ min: 0, step: 1000 }}
                        helperText="Để trống = 0 VND"
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

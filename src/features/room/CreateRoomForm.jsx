import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from "@mui/material";
import { convexMutation } from "../../services/convexClient";
import { api } from "../../../convex/_generated/api";

export default function CreateRoomForm({ open, onClose, landlordId, onCreated }) {
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        setError("");

        console.log("landlordId in CreateRoomForm:", landlordId);
        if (!landlordId) {
            setError("Không thể tạo phòng: thiếu thông tin chủ trọ");
            return;
        }

        const trimmed = code.trim();
        if (!trimmed) {
            setError("Vui lòng nhập mã phòng");
            return;
        }

        try {
            setSubmitting(true);
            const newId = await convexMutation(api.functions.rooms.create, { landlordId, code: trimmed });
            setSubmitting(false);
            setCode("");
            onCreated?.(newId);
            onClose?.();
        } catch (err) {
            setSubmitting(false);
            setError(err?.message || "Tạo phòng thất bại");
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setCode("");
            setError("");
            onClose?.();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <form onSubmit={handleSubmit}>
                <DialogTitle>Tạo phòng mới</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            label="Mã phòng"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            fullWidth
                            autoFocus
                            disabled={submitting}
                            helperText={error || "Ví dụ: A101"}
                            error={!!error}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={submitting} color="inherit">
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        // disabled={submitting || !landlordId}
                        sx={{
                            backgroundColor: "#7b1fa2",
                            "&:hover": { backgroundColor: "#6a1b9a" },
                            textTransform: "none",
                        }}
                    >
                        {submitting ? "Đang tạo..." : "Tạo phòng"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

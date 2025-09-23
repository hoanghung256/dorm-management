import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { convexMutation } from "../../services/convexClient";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";

function CreateDormModal({ landlordId, open, onClose, refresh }) {
    const [form, setForm] = useState({ name: "", address: "", involveDueDate: 1 });
    const [submitting, setSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState("");

    const handleSubmit = async () => {
        setSubmitting(true);
        setGlobalError("");
        try {
            if (!landlordId) throw new Error("Chưa có user?.detail?._id");
            if (!form.name.trim()) throw new Error("Tên trọ không được để trống");
            if (form.involveDueDate < 1 || form.involveDueDate > 31)
                throw new Error("Ngày chốt (involveDueDate) phải từ 1-31");

            // if (editing) {
            //     await updateDorm({
            //         dormId: editing._id,
            //         name: form.name.trim(),
            //         address: form.address.trim(),
            //         involveDueDate: form.involveDueDate,
            //     });
            // } else {
            await convexMutation(api.functions.dorms.createDorm, {
                landlordId,
                name: form.name.trim(),
                address: form.address.trim(),
                involveDueDate: form.involveDueDate,
            });
            // }
            // Refresh danh sách: reset cursor và để query tự tải lại
            // setDorms([]);
            refresh();
            onClose();
        } catch (err) {
            setGlobalError(err.message || "Lỗi khi lưu");
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: name === "involveDueDate" ? Number(value) : value }));
    };
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{"Thêm Trọ"}</DialogTitle>
            <DialogContent dividers>
                <Stack component="form" spacing={2} mt={1}>
                    <TextField
                        label="Tên trọ"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        fullWidth
                        autoFocus
                    />
                    <TextField
                        label="Địa chỉ"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        minRows={2}
                    />
                    <TextField
                        label="Ngày chốt (1-31)"
                        name="involveDueDate"
                        type="number"
                        value={form.involveDueDate}
                        onChange={handleChange}
                        inputProps={{ min: 1, max: 31 }}
                        required
                        fullWidth
                    />
                    {globalError && (
                        <Typography color="error" variant="body2">
                            {globalError}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>
                    Hủy
                </Button>
                <Button onClick={handleSubmit} variant="contained" disabled={submitting || !landlordId}>
                    {submitting ? "Đang lưu..." : "Tạo mới"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CreateDormModal;

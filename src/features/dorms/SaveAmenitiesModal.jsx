import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import BoltIcon from "@mui/icons-material/Bolt";
import OpacityIcon from "@mui/icons-material/Opacity"; // water
import WifiIcon from "@mui/icons-material/Wifi";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"; // trash service
import ElevatorIcon from "@mui/icons-material/Elevator";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { convexMutation } from "../../services/convexClient";
import { api } from "../../../convex/_generated/api";

// Clean component implementing 'Chọn loại' placeholder
function SaveAmenitiesModal({ dormId, existingAmenities, open, onClose, refresh }) {
    const [amenities, setAmenities] = useState([]);

    const TYPE_OPTIONS = [
        { value: "điện", label: "Điện", icon: <BoltIcon fontSize="small" color="warning" /> },
        { value: "nước", label: "Nước", icon: <OpacityIcon fontSize="small" color="primary" /> },
        { value: "internet", label: "Internet", icon: <WifiIcon fontSize="small" color="action" /> },
        { value: "rác", label: "Rác", icon: <DeleteOutlineIcon fontSize="small" color="error" /> },
        { value: "thang máy", label: "Thang máy", icon: <ElevatorIcon fontSize="small" color="action" /> },
        { value: "quản lý", label: "Quản lý", icon: <ManageAccountsIcon fontSize="small" color="action" /> },
        { value: "khác", label: "Khác", icon: <MoreHorizIcon fontSize="small" color="disabled" /> },
    ];

    useEffect(() => {
        setAmenities(existingAmenities || []);
    }, [existingAmenities]);

    const handleChange = (index, field, value) => {
        setAmenities((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const addRow = () => {
        setAmenities((prev) => [...prev, { name: "", type: "", unitPrice: 0, unit: "", unitFeeType: "fixed" }]);
    };

    const remove = (index) => {
        setAmenities((prev) => prev.filter((_, i) => i !== index));
    };

    const save = async () => {
        if (!dormId) return;
        await convexMutation(api.functions.amentities.updateDormAmenities, { dormId, amenities });
        onClose?.();
        refresh?.();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Thêm tiện ích</DialogTitle>
            <DialogContent dividers sx={{ maxHeight: 440 }}>
                {amenities.map((a, i) => (
                    <div key={i}>
                        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Grid item xs={2}>
                                <TextField
                                    label="Tên tiện ích"
                                    value={a.name}
                                    onChange={(e) => handleChange(i, "name", e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    select
                                    label="Loại"
                                    value={a.type}
                                    onChange={(e) => handleChange(i, "type", e.target.value)}
                                    fullWidth
                                    size="small"
                                    SelectProps={{
                                        displayEmpty: true,
                                        renderValue: (value) => {
                                            if (!value)
                                                return (
                                                    <Typography sx={{ opacity: 0.6, fontStyle: "italic" }}>
                                                        Chọn loại
                                                    </Typography>
                                                );
                                            const found = TYPE_OPTIONS.find((t) => t.value === value);
                                            return (
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    {found?.icon}
                                                    <span>{found?.label || value}</span>
                                                </Stack>
                                            );
                                        },
                                    }}
                                >
                                    {/* <MenuItem value="" disabled>
                                        <Typography sx={{ opacity: 0.6, fontStyle: "italic" }}>Chọn loại</Typography>
                                    </MenuItem> */}
                                    {TYPE_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {opt.icon}
                                                <span>{opt.label}</span>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    type="number"
                                    label="Đơn giá"
                                    value={a.unitPrice}
                                    onChange={(e) => handleChange(i, "unitPrice", Number(e.target.value))}
                                    fullWidth
                                    size="small"
                                    inputProps={{ min: 0 }}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    label="Đơn vị (kWh, m³, ...)"
                                    value={a.unit}
                                    onChange={(e) => handleChange(i, "unit", e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField
                                    select
                                    label="Loại phí"
                                    value={a.unitFeeType}
                                    onChange={(e) => handleChange(i, "unitFeeType", e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="metered">Theo chỉ số</MenuItem>
                                    <MenuItem value="per_person">Theo người</MenuItem>
                                    <MenuItem value="fixed">Cố định</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={1}>
                                <Button
                                    aria-label="remove amenity"
                                    color="error"
                                    size="small"
                                    onClick={() => remove(i)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </Button>
                            </Grid>
                        </Grid>
                        {i < amenities.length - 1 && <Divider sx={{ mb: 2, borderBottomWidth: 2 }} />}
                    </div>
                ))}
                <Button variant="outlined" size="small" onClick={addRow}>
                    + Thêm
                </Button>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>
                    Hủy
                </Button>
                <Button variant="contained" onClick={save} disabled={amenities.some((a) => !a.type || !a.name)}>
                    Lưu
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SaveAmenitiesModal;

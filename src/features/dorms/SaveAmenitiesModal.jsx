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
    Typography,
    Box,
    Card,
    CardContent,
    IconButton,
    Chip
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
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

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

    const amenityTypes = {
        electricity: "Điện",
        water: "Nước",
        internet: "Internet",
        garbage: "Rác",
        elevator: "Thang máy",
        management: "Quản lý",
        other: "Khác"
    };

    const feeTypes = {
        metered: "Theo chỉ số",
        per_person: "Theo người",
        fixed: "Cố định"
    };

    // Hàm format số tiền thành text tiếng Việt
    const formatCurrencyToText = (amount) => {
        if (!amount || amount === 0) return "";
        
        const units = ["", "nghìn", "triệu", "tỷ"];
        let result = "";
        let unitIndex = 0;
        
        while (amount > 0 && unitIndex < units.length) {
            const chunk = amount % 1000;
            if (chunk > 0) {
                const chunkText = chunk.toString();
                result = `${chunkText} ${units[unitIndex]} ${result}`.trim();
            }
            amount = Math.floor(amount / 1000);
            unitIndex++;
        }
        
        return result + " đồng";
    };

    // Hàm format số có dấu phẩy
    const formatNumber = (num) => {
        if (!num) return "";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // Hàm parse số từ string có dấu phẩy
    const parseNumber = (str) => {
        if (!str) return 0;
        return parseInt(str.replace(/\./g, "")) || 0;
    };

    const handleChange = (index, field, value) => {
        setAmenities((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const handlePriceChange = (index, value) => {
        // Xóa tất cả ký tự không phải số
        const numericValue = value.replace(/[^\d]/g, "");
        const parsedValue = parseInt(numericValue) || 0;
        
        const copy = [...amenities];
        copy[index].unitPrice = parsedValue;
        setAmenities(copy);
    };

    const addRow = () => {
        setAmenities([...amenities, { 
            name: "", 
            type: "other", 
            unitPrice: 0, 
            unit: "", 
            unitFeeType: "fixed" 
        }]);
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
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        Quản Lý Tiện Ích
                    </Typography>
                    <Chip 
                        label={`${amenities.length} tiện ích`} 
                        color="primary" 
                        variant="outlined" 
                        size="small" 
                    />
                </Box>
            </DialogTitle>
            
            <DialogContent dividers sx={{ maxHeight: 500, p: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Thêm và quản lý các tiện ích cho nhà trọ của bạn. Mỗi tiện ích có thể được tính phí theo nhiều cách khác nhau.
                    </Typography>
                </Box>

                {amenities.length === 0 ? (
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 4,
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        borderRadius: 2,
                        bgcolor: 'grey.50'
                    }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Chưa có tiện ích nào
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Hãy thêm tiện ích đầu tiên cho nhà trọ của bạn
                        </Typography>
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />}
                            onClick={addRow}
                            size="large"
                        >
                            Thêm Tiện Ích Đầu Tiên
                        </Button>
                    </Box>
                ) : (
                    amenities.map((a, i) => (
                        <Card key={i} sx={{ mb: 2, boxShadow: 2 }}>
                            <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            label="Tên tiện ích"
                                            placeholder="VD: Điện, Nước, Internet..."
                                            value={a.name}
                                            onChange={(e) => handleChange(i, "name", e.target.value)}
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={2}>
                                        <TextField
                                            select
                                            label="Loại tiện ích"
                                            value={a.type}
                                            onChange={(e) => handleChange(i, "type", e.target.value)}
                                            fullWidth
                                            size="small"
                                        >
                                            {Object.entries(amenityTypes).map(([key, value]) => (
                                                <MenuItem key={key} value={key}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={2}>
                                        <Box>
                                            <TextField
                                                label="Giá đơn vị (VNĐ)"
                                                placeholder="0"
                                                value={formatNumber(a.unitPrice)}
                                                onChange={(e) => handlePriceChange(i, e.target.value)}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    inputProps: { 
                                                        style: { textAlign: 'right' }
                                                    }
                                                }}
                                            />
                                            {a.unitPrice > 0 && (
                                                <Typography 
                                                    variant="caption" 
                                                    color="text.secondary" 
                                                    sx={{ 
                                                        fontSize: '0.65rem',
                                                        fontStyle: 'italic',
                                                        display: 'block',
                                                        mt: 0.5,
                                                        lineHeight: 1.2
                                                    }}
                                                >
                                                    {formatCurrencyToText(a.unitPrice)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={2}>
                                        <TextField
                                            label="Đơn vị tính"
                                            placeholder="VD: kWh, m³, tháng..."
                                            value={a.unit}
                                            onChange={(e) => handleChange(i, "unit", e.target.value)}
                                            fullWidth
                                            size="small"
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={2}>
                                        <TextField
                                            select
                                            label="Loại phí"
                                            value={a.unitFeeType}
                                            onChange={(e) => handleChange(i, "unitFeeType", e.target.value)}
                                            fullWidth
                                            size="small"
                                        >
                                            {Object.entries(feeTypes).map(([key, value]) => (
                                                <MenuItem key={key} value={key}>
                                                    {value}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={1}>
                                        <IconButton 
                                            aria-label="Xóa tiện ích" 
                                            color="error" 
                                            onClick={() => remove(i)}
                                            sx={{ 
                                                border: '1px solid',
                                                borderColor: 'error.main',
                                                '&:hover': {
                                                    backgroundColor: 'error.light',
                                                    color: 'white'
                                                }
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>

                                {/* Thông tin bổ sung */}
                                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>{amenityTypes[a.type]}:</strong> {a.name || 'Chưa đặt tên'} - 
                                        {a.unitPrice > 0 ? ` ${formatNumber(a.unitPrice)} VNĐ` : ' Chưa có giá'} 
                                        {a.unit && `/${a.unit}`} - 
                                        <em> {feeTypes[a.unitFeeType]}</em>
                                    </Typography>
                                    {a.unitPrice > 0 && (
                                        <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                                            💰 {formatCurrencyToText(a.unitPrice)}
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    ))
                )}

                {amenities.length > 0 && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button 
                            variant="outlined" 
                            startIcon={<AddIcon />}
                            onClick={addRow}
                            size="large"
                            sx={{ minWidth: 200 }}
                        >
                            Thêm Tiện Ích Mới
                        </Button>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button 
                    variant="outlined" 
                    onClick={onClose}
                    size="large"
                    sx={{ minWidth: 120 }}
                >
                    Hủy Bỏ
                </Button>
                <Button 
                    variant="contained" 
                    onClick={save}
                    size="large"
                    sx={{ minWidth: 120 }}
                    disabled={amenities.length === 0}
                >
                    Lưu Thay Đổi
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default SaveAmenitiesModal;

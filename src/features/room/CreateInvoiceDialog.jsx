import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Avatar,
    IconButton,
    Paper,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import ConfirmModal from '../../components/ConfirmModal';
import {
    Close as CloseIcon,
    FlashOn as ElectricIcon,
    Water as WaterIcon,
    Home as HomeIcon,
    Wifi as WifiIcon,
    Delete as TrashIcon,
    Elevator as ElevatorIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { api } from "../../../convex/_generated/api";
import { convexQueryOneTime, convexMutation } from '../../services/convexClient.js';

const CreateInvoiceDialog = ({ open, onClose, roomId }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [invoiceData, setInvoiceData] = useState({});
    const [roomDetails, setRoomDetails] = useState(null);
    const [roomAmenities, setRoomAmenities] = useState(null);
    const [loading, setLoading] = useState(false);

    // Confirm modal states
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmData, setConfirmData] = useState(null);

    // Load data when dialog opens
    React.useEffect(() => {
        if (open && roomId) {
            setLoading(true);
            Promise.all([
                convexQueryOneTime(api.functions.rooms.getById, { roomId }),
                convexQueryOneTime(api.functions.rooms.getRoomAmenities, { roomId })
            ]).then(([roomData, amenitiesData]) => {
                setRoomDetails(roomData ? { ...roomData, roomCode: roomData.code } : null);
                setRoomAmenities(amenitiesData);
                setLoading(false);
            }).catch((error) => {
                console.error("Failed to load room data:", error);
                setLoading(false);
            });
        }
    }, [open, roomId]);

    React.useEffect(() => {
        if (roomAmenities && Object.keys(invoiceData).length === 0) {
            const initialData = {};
            roomAmenities.forEach(amenity => {
                if (amenity.details?.unitFeeType === 'metered') {
                    initialData[amenity.amenityId] = amenity.lastUsedNumber || 0;
                } else if (amenity.details?.unitFeeType === 'per_person') {
                    initialData[amenity.amenityId] = roomDetails?.currentRenterCount || 1;
                }
            });
            if (Object.keys(initialData).length > 0) {
                setInvoiceData(initialData);
            }
        }
    }, [roomAmenities, roomDetails, invoiceData]);

    // Icon mapping
    const getAmenityIcon = (type) => {
        const iconMap = {
            'electricity': <ElectricIcon />,
            'water': <WaterIcon />,
            'internet': <WifiIcon />,
            'garbage': <TrashIcon />,
            'elevator': <ElevatorIcon />,
            'management': <PersonIcon />
        };
        return iconMap[type] || <HomeIcon />;
    };

    // Color mapping
    const getAmenityColor = (type) => {
        const colorMap = {
            'electricity': '#FF9800',
            'water': '#2196F3',
            'room': '#4CAF50',
            'internet': '#9C27B0',
            'garbage': '#795548',
            'elevator': '#607D8B',
            'management': '#FF5722'
        };
        return colorMap[type] || '#757575';
    };

    // Convert amenities data to UI format - ADD ROOM RENT FIRST
    const amenities = React.useMemo(() => {
        const roomRentCard = {
            id: 'room_rent',
            name: 'Tiền phòng',
            icon: getAmenityIcon('room'), // Use room icon
            price: roomDetails?.price || 0,
            unit: 'đ/tháng',
            hasInput: false, // Fixed price, no input needed
            inputLabel: '',
            value: 1, // Always 1 month
            subtext: `Giá cố định: ${(roomDetails?.price || 0).toLocaleString()} đ/tháng`,
            color: getAmenityColor('room'), // Green for room rent
            isRoomRent: true // Flag to identify this is room rent
        };

        const amenityCards = roomAmenities?.map(amenity => ({
            id: amenity.amenityId,
            name: amenity.details?.name || 'Unknown',
            icon: getAmenityIcon(amenity.details?.type),
            price: amenity.details?.unitPrice || 0,
            unit: amenity.details?.unitFeeType === 'metered' ? `đ/${amenity.details?.unit}` :
                amenity.details?.unitFeeType === 'per_person' ? 'đ/người' : 'đ/tháng',
            hasInput: amenity.details?.unitFeeType !== 'fixed',
            inputLabel: amenity.details?.unitFeeType === 'metered' ? amenity.details?.unit :
                amenity.details?.unitFeeType === 'per_person' ? 'người' : '',
            value: invoiceData[amenity.amenityId] || 0,
            subtext: amenity.details?.unitFeeType === 'metered' ?
                `Đọc lần cuối: ${amenity.lastUsedNumber || 0} ${amenity.details?.unit}` :
                amenity.details?.unitFeeType === 'per_person' ?
                    `Giá: ${amenity.details?.unitPrice?.toLocaleString()} đ/người` :
                    `Giá cố định: ${amenity.details?.unitPrice?.toLocaleString()} đ/tháng`,
            color: getAmenityColor(amenity.details?.type),
            isRoomRent: false,
            // Add metered info
            isMetered: amenity.details?.unitFeeType === 'metered',
            lastUsedNumber: amenity.lastUsedNumber || 0,
            unitType: amenity.details?.unit || ''
        })) || [];

        // Return room rent first, then amenities
        return roomDetails ? [roomRentCard, ...amenityCards] : amenityCards;
    }, [roomDetails, roomAmenities, invoiceData]);

    const handleInputChange = (amenityId, value) => {
        setInvoiceData(prev => ({
            ...prev,
            [amenityId]: value
        }));
    };

    // Calculate total amount - INCLUDE ROOM RENT
    const calculateTotal = () => {
        return amenities.reduce((total, amenity) => {
            if (amenity.isRoomRent) {
                // Room rent is always included (price * 1 month)
                return total + amenity.price;
            }

            const inputValue = invoiceData[amenity.id] || 0;

            if (amenity.hasInput) {
                // For metered items (electricity, water): price * (current - previous)
                if (amenity.isMetered) {
                    const consumption = Math.max(0, inputValue - (amenity.lastUsedNumber || 0));
                    return total + (amenity.price * consumption);
                }
                // For per_person or other types: price * quantity
                return total + (amenity.price * inputValue);
            }

            // Fixed price items
            return total + amenity.price;
        }, 0);
    };

    // Handle functions
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleReset = () => {
        if (roomAmenities) {
            const initialData = {};
            roomAmenities.forEach(amenity => {
                if (amenity.details?.unitFeeType === 'metered') {
                    initialData[amenity.amenityId] = amenity.lastUsedNumber || 0;
                } else if (amenity.details?.unitFeeType === 'per_person') {
                    initialData[amenity.amenityId] = roomDetails?.currentRenterCount || 1;
                }
            });
            setInvoiceData(initialData);
        }
    };

    const handleCreateInvoice = async () => {
        if (!roomId || !roomDetails) return;

        // Format items based on schema of API: { label: string, amount: number }
        const invoiceItems = amenities.map((amenity, index) => {
            let amount = 0;

            if (amenity.isRoomRent) {
                amount = amenity.price;
            } else if (amenity.hasInput) {
                const inputValue = invoiceData[amenity.id] || 0;

                if (amenity.isMetered) {
                    const consumption = Math.max(0, inputValue - (amenity.lastUsedNumber || 0));
                    amount = amenity.price * consumption;
                } else {
                    amount = amenity.price * inputValue;
                }
            } else {
                amount = amenity.price;
            }

            return {
                label: amenity.name,
                amount: amount
            };
        });

        // Create period object using UTC to avoid timezone issues
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed (Sep = 8)

        // Use UTC methods to create consistent timestamps
        const periodStart = Date.UTC(year, month, 1); // Start of current month UTC
        const periodEnd = Date.UTC(year, month + 1, 1); // Start of next month UTC

        const periodObj = {
            start: periodStart,
            end: periodEnd
        };

        setConfirmData({
            invoiceItems,
            period: periodObj,
            roomId,
            totalAmount: calculateTotal()
        });

        setShowConfirm(true);
    };

    const handleConfirmCreateInvoice = async () => {
        if (!confirmData) return;

        try {
            setShowConfirm(false);

            const result = await convexMutation(api.functions.invoices.create, {
                roomId: confirmData.roomId,
                period: confirmData.period,
                totalAmount: confirmData.totalAmount,
                currency: 'VND',
                status: 'pending'
            });

            if (result.success) {
                handleReset();
                setConfirmData(null);
                onClose();

                if (result.isExisting) {
                    alert(`ℹ️ ${result.message}`);
                } else {
                    alert(`✅ ${result.message}`);
                }
            }

        } catch (error) {
            console.error('Error creating invoice:', error);

            // Handle duplicate invoice error specifically
            if (error.message.includes('Invoice already exists')) {
                alert(`⚠️ Hóa đơn đã tồn tại!\n\n${error.message}\n\nVui lòng kiểm tra danh sách hóa đơn hoặc chọn tháng khác.`);
            } else {
                alert(`Lỗi tạo hóa đơn: ${error.message}`);
            }
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirm(false);
        setConfirmData(null);
    };

    const TabPanel = ({ children, value, index }) => (
        <Box sx={{
            height: '100%',
            overflow: 'hidden',
            opacity: value === index ? 1 : 0,
            transform: value === index ? 'translateX(0)' : 'translateX(20px)',
            transition: 'all 0.3s ease-in-out',
            display: value === index ? 'block' : 'none',
            py: 2
        }}>
            {children}
        </Box>
    );

    const RenterInfo = () => (
        <Box sx={{
            mb: 2,
            p: 1.5,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200'
        }}>
            <Typography variant="subtitle2" color="primary.main" fontWeight="600" gutterBottom>
                Người thuê hiện tại
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{
                    bgcolor: 'primary.main',
                    width: 32,
                    height: 32,
                    fontSize: '0.875rem'
                }}>
                    A
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="primary.main" fontWeight="600">
                        {roomDetails?.renter?.user?.name || 'Chưa có người thuê'}
                    </Typography>
                    {roomDetails?.renter?.user && (
                        <Box sx={{
                            display: 'flex',
                            gap: 2,
                            mt: 0.5,
                            flexWrap: 'wrap',
                            '& > *': { fontSize: '0.75rem' }
                        }}>
                            <Typography variant="caption" color="text.secondary">
                                📞 {roomDetails.renter.user.phone || 'Chưa có SĐT'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ✉️ {roomDetails.renter.user.email || 'Chưa có email'}
                            </Typography>
                            {/* <Typography variant="caption" color="text.secondary">
                                🏠 Đã chuyển vào {roomDetails.renter.assignedAt ? new Date(roomDetails.renter.assignedAt).toLocaleDateString('vi-VN') : 'N/A'}
                            </Typography> */}
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );

    const AmenityCard = ({ amenity }) => (
        <Card
            sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: 2,
                },
                margin: "0 0.5rem",
            }}
        >
            <CardContent
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    p: 1.5,
                    '&:last-child': { pb: 1.5 },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                        sx={{
                            color: amenity.color,
                            bgcolor: `${amenity.color}20`,
                            mr: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 35,
                            height: 35,
                            borderRadius: '10px',
                        }}
                    >
                        {amenity.icon}
                    </Box>
                    <Typography variant="body1" component="div" fontWeight="600">
                        {amenity.name}
                    </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {amenity.price.toLocaleString()} {amenity.unit}
                </Typography>

                <Box
                    sx={{
                        mt: 'auto',
                        minHeight: 60,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                    }}
                >
                    {amenity.hasInput ? (
                        <>
                            <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={amenity.value}
                                onChange={(e) =>
                                    handleInputChange(amenity.id, parseInt(e.target.value, 10) || 0)
                                }
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            {amenity.inputLabel}
                                        </InputAdornment>
                                    ),
                                    sx: { '& .MuiInputBase-input': { py: 0.5 } },
                                }}
                                sx={{ mb: amenity.subtext ? 0.5 : 0 }}
                            />
                            {amenity.subtext && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: '0.7rem' }}
                                >
                                    {amenity.subtext}
                                </Typography>
                            )}
                        </>
                    ) : (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ lineHeight: 1.2, fontSize: '0.75rem' }}
                        >
                            {amenity.subtext}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );


    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: '1200px',
                    height: '720px',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    m: 2
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 1,
                px: 3
            }}>
                <Typography variant="h5" component="div" fontWeight="600">
                    {roomDetails ? `Phòng ${roomDetails.roomCode}` : 'Phòng'}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Custom styled tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            minHeight: 48,
                            transition: 'all 0.3s ease-in-out',
                            '&.Mui-selected': {
                                backgroundColor: 'primary.main',
                                color: 'white',
                                borderRadius: '4px 4px 0 0',
                                transform: 'scale(1.02)',
                            },
                            '&:hover:not(.Mui-selected)': {
                                backgroundColor: 'primary.light',
                                color: 'white',
                                borderRadius: '4px 4px 0 0',
                            }
                        },
                        '& .MuiTabs-indicator': {
                            display: 'none', // Hide default indicator
                        }
                    }}
                >
                    <Tab label="Tạo hóa đơn" />
                    <Tab label="Tiện nghi" />
                    <Tab label="Người thuê" />
                </Tabs>
            </Box>

            <DialogContent sx={{
                px: 3,
                pb: 2,
                height: 'calc(700px - 200px)', // Fixed height minus header/footer
                overflow: 'hidden'
            }}>
                {loading || !roomDetails ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <CircularProgress />
                        <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
                    </Box>
                ) : (
                    <TabPanel value={activeTab} index={0}>
                        <RenterInfo />

                        <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 1.5 }}>
                            Tạo hóa đơn hàng tháng
                        </Typography>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 2,
                            }}
                        >
                            {amenities.map((amenity) => (
                                <Box key={amenity.id} sx={{ display: 'flex' }}>
                                    <AmenityCard amenity={amenity} />
                                </Box>
                            ))}
                        </Box>
                    </TabPanel>
                )}
            </DialogContent>

            <DialogActions sx={{
                justifyContent: 'space-between', // Spread buttons and total
                px: 3,
                py: 2,
                borderTop: 1,
                borderColor: 'divider',
                gap: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary.main" fontWeight="600">
                        Tổng cộng: {calculateTotal().toLocaleString('vi-VN')} đ
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleReset}
                        color="inherit"
                        sx={{ minWidth: 100 }}
                    >
                        Đặt lại
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateInvoice}
                        disabled={!roomDetails?.renter || amenities.length === 0}
                        sx={{ minWidth: 120 }}
                    >
                        Tạo hóa đơn
                    </Button>
                </Box>
            </DialogActions>

            {/* Confirm Modal */}
            <ConfirmModal
                show={showConfirm}
                title="Xác nhận tạo hóa đơn"
                message={confirmData ? (
                    <div>
                        <p><strong>Phòng:</strong> {roomDetails?.code}</p>
                        <p><strong>Chi tiết:</strong></p>

                        {/* Table format for better readability */}
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.9em',
                            marginBottom: '15px'
                        }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>
                                        Khoản phí
                                    </th>
                                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
                                        Tính toán
                                    </th>
                                    <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #ddd' }}>
                                        Thành tiền
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {confirmData.invoiceItems.map((item, index) => {
                                    const amenity = amenities.find(a => a.name === item.label);
                                    let calculationText = '';

                                    if (amenity) {
                                        if (amenity.isRoomRent) {
                                            calculationText = `${amenity.price.toLocaleString('vi-VN')} đ/tháng × 1 tháng`;
                                        } else if (amenity.isMetered && amenity.hasInput) {
                                            const currentReading = invoiceData[amenity.id] || 0;
                                            const lastReading = amenity.lastUsedNumber || 0;
                                            const consumption = Math.max(0, currentReading - lastReading);
                                            calculationText = (
                                                <div>
                                                    <div>Chỉ số cũ: {lastReading.toLocaleString()} {amenity.unitType}</div>
                                                    <div>Chỉ số mới: {currentReading.toLocaleString()} {amenity.unitType}</div>
                                                    <div>Tiêu thụ: {consumption.toLocaleString()} {amenity.unitType}</div>
                                                    <div>{amenity.price.toLocaleString('vi-VN')} đ/{amenity.unitType} × {consumption.toLocaleString()}</div>
                                                </div>
                                            );
                                        } else if (amenity.hasInput) {
                                            const inputValue = invoiceData[amenity.id] || 0;
                                            calculationText = `${amenity.price.toLocaleString('vi-VN')} ${amenity.unit} × ${inputValue} ${amenity.inputLabel}`;
                                        } else {
                                            calculationText = `${amenity.price.toLocaleString('vi-VN')} ${amenity.unit} (cố định)`;
                                        }
                                    }

                                    return (
                                        <tr key={index}>
                                            <td style={{
                                                padding: '8px',
                                                border: '1px solid #ddd',
                                                fontWeight: 'bold'
                                            }}>
                                                {item.label}
                                            </td>
                                            <td style={{
                                                padding: '8px',
                                                border: '1px solid #ddd',
                                                fontSize: '0.85em',
                                                color: '#666'
                                            }}>
                                                {calculationText}
                                            </td>
                                            <td style={{
                                                padding: '8px',
                                                border: '1px solid #ddd',
                                                textAlign: 'right',
                                                fontWeight: 'bold'
                                            }}>
                                                {item.amount.toLocaleString('vi-VN')} đ
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Total row */}
                                <tr style={{ backgroundColor: '#f0f8ff', fontWeight: 'bold' }}>
                                    <td colSpan={2} style={{
                                        padding: '12px 8px',
                                        border: '1px solid #ddd',
                                        textAlign: 'right'
                                    }}>
                                        <strong>TỔNG CỘNG:</strong>
                                    </td>
                                    <td style={{
                                        padding: '12px 8px',
                                        border: '1px solid #ddd',
                                        textAlign: 'right',
                                        fontSize: '1.1em',
                                        color: '#1976d2'
                                    }}>
                                        <strong>{confirmData.totalAmount.toLocaleString('vi-VN')} đ</strong>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <p><strong>Thời gian:</strong> Tháng {new Date(confirmData.period.start).getUTCMonth() + 1}/{new Date(confirmData.period.start).getUTCFullYear()}</p>
                        <p><strong>Thời hạn thanh toán:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}</p>
                    </div>
                ) : ''}
                onConfirm={handleConfirmCreateInvoice}
                onCancel={handleCancelConfirm}
                confirmText="Tạo hóa đơn"
                cancelText="Hủy"
            />
        </Dialog>
    );
};

export default CreateInvoiceDialog;

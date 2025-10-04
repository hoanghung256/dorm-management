import React, { useEffect, useState } from "react";
import {
    ListItemText,
    ListItem,
    ListItemAvatar,
    Chip,
    Grid,
    List,
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
    Switch,
    FormControlLabel,
} from "@mui/material";
import ConfirmModal from "../../components/ConfirmModal";
import {
    Close as CloseIcon,
    FlashOn as ElectricIcon,
    Water as WaterIcon,
    Home as HomeIcon,
    Wifi as WifiIcon,
    Delete as TrashIcon,
    Elevator as ElevatorIcon,
    Person as PersonIcon,
    PersonAdd as PersonAddIcon,
    GroupAdd as GroupAddIcon,
} from "@mui/icons-material";
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    CalendarToday as CalendarIcon,
    LocationOn as LocationIcon,
} from "@mui/icons-material";
import { api } from "../../../convex/_generated/api";
import { convexQueryOneTime, convexMutation } from "../../services/convexClient.js";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import { CardHeader } from "@mui/material";
import toast from "react-hot-toast";

// Add onDialogClose prop to component declaration
const CreateInvoiceDialog = ({ open, onClose, roomId, onDialogClose }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [invoiceData, setInvoiceData] = useState({});
    const [roomDetails, setRoomDetails] = useState(null);
    const [roomAmenities, setRoomAmenities] = useState(null);
    const [amenityToggles, setAmenityToggles] = useState({}); // Track toggle state for amenities
    const [loading, setLoading] = useState(false);

    // Confirm modal states
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmData, setConfirmData] = useState(null);

    //Search for renter info
    const [openSearchDialog, setOpenSearchDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedRenter, setSelectedRenter] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // Add new state for confirm modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Add new states
    const [openAddRenterDialog, setOpenAddRenterDialog] = useState(false);
    const [newRenterData, setNewRenterData] = useState({
        fullname: "",
        email: "",
        phone: "",
        birthDate: "",
        hometown: "",
    });

    // Add state for renters list
    const [renters, setRenters] = useState([]);

    useEffect(() => {
        console.log("de", roomDetails);
    }, [roomDetails]);

    // Load data when dialog opens
    React.useEffect(() => {
        if (open && roomId) {
            setLoading(true);
            getRoomDetailsAndAmenities();
        }
    }, [open, roomId]);

    React.useEffect(() => {
        if (roomAmenities && Object.keys(invoiceData).length === 0) {
            const initialData = {};
            const initialToggles = {};
            roomAmenities.forEach((amenity) => {
                // Initialize toggles from database enabled field, default to true if not set
                initialToggles[amenity.amenityId] = amenity.enabled !== false; // Default true if undefined/null

                if (amenity.details?.unitFeeType === "metered") {
                    initialData[amenity.amenityId] = amenity.lastUsedNumber || 0;
                } else if (amenity.details?.unitFeeType === "per_person") {
                    initialData[amenity.amenityId] = roomDetails?.currentRenterCount || 1;
                }
            });
            if (Object.keys(initialData).length > 0) {
                setInvoiceData(initialData);
            }
            setAmenityToggles(initialToggles);
        }
    }, [roomAmenities, roomDetails, invoiceData]);

    const getRoomDetailsAndAmenities = async () => {
        Promise.all([
            convexQueryOneTime(api.functions.rooms.getById, { roomId }),
            convexQueryOneTime(api.functions.rooms.getRoomAmenities, { roomId }),
            convexQueryOneTime(api.functions.rooms.getRentersByRoomId, { roomId }),
        ])
            .then(([roomData, amenitiesData, rentersData]) => {
                setRoomDetails(roomData ? { ...roomData, roomCode: roomData.code } : null);
                setRoomAmenities(amenitiesData);

                const representativeEmail = roomData?.renter?.user?.email || null;

                // Map backend name → fullname và gắn cờ isRepresentative
                let mergedRenters = (rentersData || []).map((r) => ({
                    ...r,
                    fullname: r.name || r.fullname, // Backend returns 'name', map to 'fullname'
                    isRepresentative: representativeEmail && r.email === representativeEmail,
                }));

                // Nếu đại diện chưa có trong danh sách renters → push thêm
                if (representativeEmail && !mergedRenters.some((r) => r.email === representativeEmail)) {
                    const representative = roomData.renter.user;
                    mergedRenters.push({
                        ...representative,
                        fullname: representative.name || representative.fullname, // Map name → fullname
                        isRepresentative: true,
                    });
                }

                // ✅ Sort: đại diện đứng đầu tiên
                mergedRenters.sort((a, b) => {
                    if (a.isRepresentative && !b.isRepresentative) return -1;
                    if (!a.isRepresentative && b.isRepresentative) return 1;
                    return 0;
                });

                setRenters(mergedRenters);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Failed to load data:", error);
                setLoading(false);
            });
    };

    // Icon mapping
    const getAmenityIcon = (type) => {
        const iconMap = {
            electricity: <ElectricIcon />,
            water: <WaterIcon />,
            internet: <WifiIcon />,
            garbage: <TrashIcon />,
            elevator: <ElevatorIcon />,
            management: <PersonIcon />,
        };
        return iconMap[type] || <HomeIcon />;
    };

    // Color mapping
    const getAmenityColor = (type) => {
        const colorMap = {
            electricity: "#FF9800",
            water: "#2196F3",
            room: "#4CAF50",
            internet: "#9C27B0",
            garbage: "#795548",
            elevator: "#607D8B",
            management: "#FF5722",
        };
        return colorMap[type] || "#757575";
    };

    // Convert amenities data to UI format - ADD ROOM RENT FIRST
    const amenities = React.useMemo(() => {
        const roomRentCard = {
            id: "room_rent",
            name: "Tiền phòng",
            icon: getAmenityIcon("room"), // Use room icon
            price: roomDetails?.price || 0,
            unit: "đ/tháng",
            hasInput: false, // Fixed price, no input needed
            inputLabel: "",
            value: 1, // Always 1 month
            subtext: `Giá cố định: ${(roomDetails?.price || 0).toLocaleString()} đ/tháng`,
            color: getAmenityColor("room"), // Green for room rent
            isRoomRent: true, // Flag to identify this is room rent
        };

        const amenityCards =
            roomAmenities
                ?.filter(
                    (amenity) => amenityToggles[amenity.amenityId] === true, // Only include enabled amenities
                )
                .map((amenity) => ({
                    id: amenity.amenityId,
                    name: amenity.details?.name || "Unknown",
                    icon: getAmenityIcon(amenity.details?.type),
                    price: amenity.details?.unitPrice || 0,
                    unit:
                        amenity.details?.unitFeeType === "metered"
                            ? `đ/${amenity.details?.unit}`
                            : amenity.details?.unitFeeType === "per_person"
                              ? "đ/người"
                              : "đ/tháng",
                    hasInput: amenity.details?.unitFeeType !== "fixed",
                    inputLabel:
                        amenity.details?.unitFeeType === "metered"
                            ? amenity.details?.unit
                            : amenity.details?.unitFeeType === "per_person"
                              ? "người"
                              : "",
                    value: invoiceData[amenity.amenityId] ?? "",
                    subtext:
                        amenity.details?.unitFeeType === "metered"
                            ? `Đọc lần cuối: ${amenity.lastUsedNumber || 0} ${amenity.details?.unit}`
                            : amenity.details?.unitFeeType === "per_person"
                              ? `Giá: ${amenity.details?.unitPrice?.toLocaleString()} đ/người`
                              : `Giá cố định: ${amenity.details?.unitPrice?.toLocaleString()} đ/tháng`,
                    color: getAmenityColor(amenity.details?.type),
                    isRoomRent: false,
                    // Add metered info
                    isMetered: amenity.details?.unitFeeType === "metered",
                    lastUsedNumber: amenity.lastUsedNumber || 0,
                    unitType: amenity.details?.unit || "",
                })) || [];

        // Return room rent first, then amenities
        return roomDetails ? [roomRentCard, ...amenityCards] : amenityCards;
    }, [roomDetails, roomAmenities, invoiceData, amenityToggles]);

    const handleInputChange = (amenityId, value) => {
        setInvoiceData((prev) => ({
            ...prev,
            [amenityId]: value,
        }));
    };

    // Handle toggle switch for amenities
    const handleAmenityToggle = async (amenityId, enabled) => {
        try {
            // Update local state immediately for UI responsiveness
            setAmenityToggles((prev) => ({
                ...prev,
                [amenityId]: enabled,
            }));

            // Save to database
            await convexMutation(api.functions.amentities.toggleRoomAmenity, {
                roomId,
                amenityId,
                enabled,
            });
            calculateTotal();
        } catch (error) {
            console.error("Failed to toggle amenity:", error);
            // Revert local state on error
            setAmenityToggles((prev) => ({
                ...prev,
                [amenityId]: !enabled,
            }));
        }
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
                    return total + amenity.price * consumption;
                }
                // For per_person or other types: price * quantity
                return total + amenity.price * inputValue;
            }

            // Fixed price items
            return total + amenity.price;
        }, 0);
    };

    // Handle functions
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);

        // Refresh amenities data when switching to amenities tab
        if (newValue === 1 && roomId) {
            console.log("Refreshing amenities data...");
            // loadRoomData();
            getRoomDetailsAndAmenities();
        }
    };

    const handleReset = () => {
        if (roomAmenities) {
            const initialData = {};
            roomAmenities.forEach((amenity) => {
                if (amenity.details?.unitFeeType === "metered") {
                    initialData[amenity.amenityId] = amenity.lastUsedNumber || 0;
                } else if (amenity.details?.unitFeeType === "per_person") {
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
                amount: amount,
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
            end: periodEnd,
        };

        setConfirmData({
            invoiceItems,
            period: periodObj,
            roomId,
            totalAmount: calculateTotal(),
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
                currency: "VND",
                status: "pending",
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
            console.error("Error creating invoice:", error);

            // Handle duplicate invoice error specifically
            if (error.message.includes("Invoice already exists")) {
                toast.error(
                    `⚠️ Hóa đơn đã tồn tại!\n\n${error.message}\n\nVui lòng kiểm tra danh sách hóa đơn hoặc chọn tháng khác.`,
                );
            } else {
                toast.error(`Lỗi tạo hóa đơn: ${error.message}`);
            }
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirm(false);
        setConfirmData(null);
    };

    const handleOpenDeleteConfirm = (renter) => {
        setSelectedRenter(renter);
        setShowDeleteConfirm(true);
    };

    const handleCloseDeleteConfirm = () => {
        setShowDeleteConfirm(false);
    };

    const handleConfirmDelete = async () => {
        if (!selectedRenter) return;

        try {
            // Xóa renter
            await convexMutation(api.functions.rooms.removeRenterFromRoom, {
                roomId,
                email: selectedRenter.email,
            });

            // Nếu là đại diện thì clear luôn
            if (roomDetails?.renter?.user?.email === selectedRenter.email) {
                await convexMutation(api.functions.renters.unassignFromRoom, {
                    roomId,
                    userId: roomDetails.renter.user._id,
                });
            }

            const updatedRoom = await convexQueryOneTime(api.functions.rooms.getById, { roomId });
            let rentersList = updatedRoom.renters || [];
            if (updatedRoom.renter?.user) {
                const rep = {
                    fullname: updatedRoom.renter.user.name,
                    email: updatedRoom.renter.user.email,
                    phone: updatedRoom.renter.user.phone,
                    birthDate: updatedRoom.renter.user.birthDate,
                    hometown: updatedRoom.renter.user.hometown,
                    isRepresentative: true,
                };
                const exists = rentersList.some((r) => r.email === rep.email);
                if (!exists) rentersList = [rep, ...rentersList];
            }
            setRoomDetails(updatedRoom);
            setRenters(rentersList);
            setSelectedRenter(null);
            setShowDeleteConfirm(false);
            toast.success("Đã xóa thành công!");
            getRoomDetailsAndAmenities();
        } catch (error) {
            console.error("Error removing renter:", error);
            toast.error("Lỗi khi xóa người thuê");
        }
    };

    const TabPanel = ({ children, value, index }) => (
        <Box
            sx={{
                height: "100%",
                overflow: "hidden",
                opacity: value === index ? 1 : 0,
                transform: value === index ? "translateX(0)" : "translateX(20px)",
                transition: "all 0.3s ease-in-out",
                display: value === index ? "block" : "none",
                py: 2,
            }}
        >
            {children}
        </Box>
    );

    const RenterInfo = () => (
        <Box
            sx={{
                mb: 2,
                p: 1.5,
                bgcolor: "grey.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "grey.200",
            }}
        >
            <Typography variant="subtitle2" color="primary.main" fontWeight="600" gutterBottom>
                Người thuê hiện tại
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                    sx={{
                        bgcolor: "primary.main",
                        width: 32,
                        height: 32,
                        fontSize: "0.875rem",
                    }}
                >
                    A
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="primary.main" fontWeight="600">
                        {roomDetails?.renter?.user?.name || "Chưa có người thuê"}
                    </Typography>
                    {roomDetails?.renter?.user && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                mt: 0.5,
                                flexWrap: "wrap",
                                "& > *": { fontSize: "0.75rem" },
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                📞 {roomDetails.renter.user.phone || "Chưa có SĐT"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                ✉️ {roomDetails.renter.user.email || "Chưa có email"}
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

    React.useEffect(() => {
        const fetchRenters = async () => {
            if (searchTerm.trim().length === 0) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const results = await convexQueryOneTime(api.functions.renters.searchRenters, { searchTerm });
                setSearchResults(Array.isArray(results) ? results : []);
            } catch (error) {
                console.error("Error searching users:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchRenters();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Khi chọn 1 renter trong danh sách
    const handleRenterSelect = async (user) => {
        try {
            // Call assignSpenderToRoom directly when selecting a renter
            await convexMutation(api.functions.renters.assignSpenderToRoom, {
                userId: user._id,
                roomId: roomId,
            });

            // Refresh room details after assigning
            const updatedRoom = await convexQueryOneTime(api.functions.rooms.getById, { roomId });
            setRoomDetails(updatedRoom);
            setSelectedRenter(user);
            handleSearchDialogClose();

            // Show success message
            getRoomDetailsAndAmenities();
            toast.success("Đã thêm và cập nhật người đại diện thành công!");
        } catch (error) {
            console.error("Error assigning representative:", error);
            toast.error("❌ Lỗi: " + (error.message || "Không thể thêm người đại diện"));
        }
    };

    const handleSearchDialogOpen = () => {
        setOpenSearchDialog(true);
        setSearchTerm("");
        setSearchResults([]);
    };

    const handleSearchDialogClose = () => {
        setOpenSearchDialog(false);
    };

    const AmenityCard = ({ amenity }) => (
        <Card
            sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: 2,
                },
                margin: "0 0.5rem",
            }}
        >
            <CardContent
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 1.5,
                    "&:last-child": { pb: 1.5 },
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Box
                        sx={{
                            color: amenity.color,
                            bgcolor: `${amenity.color}20`,
                            mr: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 35,
                            height: 35,
                            borderRadius: "10px",
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
                        mt: "auto",
                        minHeight: 60,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                    }}
                >
                    {amenity.hasInput ? (
                        <>
                            <TextField
                                size="small"
                                fullWidth
                                type="text"
                                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                value={String(amenity.value || "")}
                                onChange={(e) => {
                                    // Allow only numbers during typing
                                    const value = e.target.value.replace(/[^0-9]/g, "");
                                    handleInputChange(amenity.id, value);
                                }}
                                onBlur={(e) => {
                                    // Convert to number on blur for calculations if not empty
                                    const value = e.target.value.trim();
                                    if (value === "") {
                                        handleInputChange(amenity.id, "");
                                    } else {
                                        handleInputChange(amenity.id, Number(value));
                                    }
                                }}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">{amenity.inputLabel}</InputAdornment>,
                                    sx: { "& .MuiInputBase-input": { py: 0.5 } },
                                }}
                                sx={{ mb: amenity.subtext ? 0.5 : 0 }}
                            />
                            {amenity.subtext && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                                    {amenity.subtext}
                                </Typography>
                            )}
                        </>
                    ) : (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ lineHeight: 1.2, fontSize: "0.75rem" }}
                        >
                            {amenity.subtext}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );

    // Amenities Management Component
    const AmenitiesManagement = ({ roomId, roomAmenities, setRoomAmenities }) => {
        return (
            <Box>
                <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                    Quản lý cơ sở vật chất
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Bật/tắt các tiện nghi để tính vào hóa đơn. Chỉ những tiện nghi được bật mới được tính trong phần tạo
                    hóa đơn.
                </Typography>

                {(() => {
                    return roomAmenities && roomAmenities.length > 0;
                })() ? (
                    <Box
                        sx={{
                            maxHeight: 400,
                            overflowY: "auto",
                            pr: 1,
                            "&::-webkit-scrollbar": {
                                width: "8px",
                            },
                            "&::-webkit-scrollbar-track": {
                                backgroundColor: "#f1f1f1",
                                borderRadius: "10px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                                backgroundColor: "#888",
                                borderRadius: "10px",
                            },
                            "&::-webkit-scrollbar-thumb:hover": {
                                backgroundColor: "#555",
                            },
                        }}
                    >
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                                gap: 2,
                            }}
                        >
                            {roomAmenities.map((amenity) => (
                                <Card
                                    key={amenity.amenityId}
                                    sx={{
                                        border: "1px solid #e0e0e0",
                                        opacity: amenityToggles[amenity.amenityId] ? 1 : 0.6,
                                        transition: "opacity 0.3s ease",
                                    }}
                                >
                                    <CardContent>
                                        {/* Header with toggle */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                mb: 2,
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: getAmenityColor(amenity.details?.type),
                                                        width: 40,
                                                        height: 40,
                                                        fontSize: "1.2rem",
                                                    }}
                                                >
                                                    {getAmenityIcon(amenity.details?.type)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                                                        {amenity.details?.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            textTransform: "capitalize",
                                                            backgroundColor: "grey.100",
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 1,
                                                        }}
                                                    >
                                                        {amenity.details?.type === "electricity"
                                                            ? "Điện"
                                                            : amenity.details?.type === "water"
                                                              ? "Nước"
                                                              : amenity.details?.type === "internet"
                                                                ? "Internet"
                                                                : amenity.details?.type === "garbage"
                                                                  ? "Rác"
                                                                  : amenity.details?.type === "elevator"
                                                                    ? "Thang máy"
                                                                    : amenity.details?.type === "management"
                                                                      ? "Quản lý"
                                                                      : "Khác"}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            {/* Toggle Switch */}
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={amenityToggles[amenity.amenityId] || false}
                                                        onChange={(e) =>
                                                            handleAmenityToggle(amenity.amenityId, e.target.checked)
                                                        }
                                                        color="primary"
                                                    />
                                                }
                                                label=""
                                                sx={{ m: 0 }}
                                            />
                                        </Box>

                                        <Box
                                            sx={{
                                                backgroundColor: "grey.50",
                                                borderRadius: 1,
                                                p: 1.5,
                                                mb: 1.5,
                                            }}
                                        >
                                            <Typography variant="body2" fontWeight="600" color="primary.main">
                                                Giá: {amenity.details?.unitPrice?.toLocaleString("vi-VN")} VNĐ
                                                {amenity.details?.unitFeeType === "metered" &&
                                                    `/${amenity.details?.unit}`}
                                                {amenity.details?.unitFeeType === "per_person" && "/người"}
                                                {amenity.details?.unitFeeType === "fixed" && "/tháng"}
                                            </Typography>
                                        </Box>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mb: 1,
                                            }}
                                        >
                                            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                                                {amenity.details?.unitFeeType === "metered"
                                                    ? "📊 Theo chỉ số"
                                                    : amenity.details?.unitFeeType === "per_person"
                                                      ? "� Theo người"
                                                      : "💰 Giá cố định"}
                                            </Typography>

                                            {/* Status indicator */}
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    backgroundColor: amenityToggles[amenity.amenityId]
                                                        ? "success.light"
                                                        : "grey.300",
                                                    color: amenityToggles[amenity.amenityId]
                                                        ? "success.contrastText"
                                                        : "text.secondary",
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {amenityToggles[amenity.amenityId]
                                                    ? "✓ Đang tính phí"
                                                    : "✗ Không tính phí"}
                                            </Typography>
                                        </Box>

                                        {amenity.details?.unitFeeType === "metered" &&
                                            amenity.lastUsedNumber !== undefined && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        backgroundColor: "info.light",
                                                        color: "info.contrastText",
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        display: "block",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    Chỉ số cuối: {amenity.lastUsedNumber} {amenity.details?.unit}
                                                </Typography>
                                            )}
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    <Paper sx={{ p: 4, textAlign: "center", bgcolor: "grey.50" }}>
                        <HomeIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Chưa có tiện nghi nào
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Phòng này chưa được cấu hình tiện nghi. Hãy liên hệ quản lý để thêm các tiện nghi cần thiết.
                        </Typography>
                    </Paper>
                )}
            </Box>
        );
    };

    // Thêm RenterActionMenu component
    const RenterActionMenu = ({ renter, roomId, onDelete }) => {
        const [anchorEl, setAnchorEl] = useState(null);
        const open = Boolean(anchorEl);
        const isRepresentative = roomDetails?.renter?.user?._id === renter._id;

        const handleClick = (event) => {
            setAnchorEl(event.currentTarget);
        };

        const handleClose = () => {
            setAnchorEl(null);
        };

        const handleRemove = () => {
            onDelete();
            handleClose();
        };

        return (
            <>
                <IconButton size="small" onClick={handleClick} sx={{ ml: "auto" }}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    PaperProps={{
                        sx: { minWidth: 180 },
                    }}
                >
                    {isRepresentative ? (
                        <MenuItem onClick={handleRemove}>
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText sx={{ color: "error.main" }}>Xóa người đại diện</ListItemText>
                        </MenuItem>
                    ) : renter.roomId === roomId ? (
                        <MenuItem onClick={handleRemove}>
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText sx={{ color: "error.main" }}>Xóa người thuê</ListItemText>
                        </MenuItem>
                    ) : (
                        <MenuItem onClick={handleRemove}>
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText sx={{ color: "error.main" }}>Xóa</ListItemText>
                        </MenuItem>
                    )}
                </Menu>
            </>
        );
    };

    const handleClose = () => {
        // Reset all states
        setActiveTab(0);
        setInvoiceData({});
        setRoomDetails(null);
        setRoomAmenities(null);
        setSelectedRenter(null);
        setSearchTerm("");
        setSearchResults([]);

        // Call both close handlers
        onClose();
        if (onDialogClose) onDialogClose();
    };

    const handleAddRenterDialog = () => {
        setOpenAddRenterDialog(true);
    };

    const handleCloseAddRenterDialog = () => {
        setOpenAddRenterDialog(false);
        setNewRenterData({
            name: "",
            email: "",
            phone: "",
            birthDate: "",
            hometown: "",
        });
    };

    const handleSubmitNewRenter = async () => {
        try {
            // Gọi API thêm renter
            await convexMutation(api.functions.rooms.addRenterToRoom, {
                roomId,
                renter: newRenterData,
            });

            // Refresh lại dữ liệu room
            const updatedRoom = await convexQueryOneTime(api.functions.rooms.getById, { roomId });

            // Chuẩn hóa danh sách renters - Backend đã trả về fullname
            let rentersList = [
                // Renters thường: backend đã map name → fullname
                ...(updatedRoom.renters || []).map((renter) => ({
                    ...renter,
                    isRepresentative: false,
                })),
                // Đại diện: giữ nguyên field name từ user
                ...(updatedRoom.renter
                    ? [
                          {
                              ...updatedRoom.renter.user,
                              fullname: updatedRoom.renter.user.name, // Map name → fullname cho UI
                              isRepresentative: true,
                          },
                      ]
                    : []),
            ];

            // Xử lý trùng lặp
            if (updatedRoom.renter) {
                const representativeEmail = updatedRoom.renter.user.email;
                rentersList = rentersList.filter((r) => r.email !== representativeEmail);

                rentersList.unshift({
                    ...updatedRoom.renter.user,
                    fullname: updatedRoom.renter.user.name, // Map name → fullname cho UI
                    isRepresentative: true,
                });
            }

            setRenters(rentersList);
            setRoomDetails(updatedRoom);

            // Reset form - dùng fullname vì đây là form thêm renter thường
            setNewRenterData({
                fullname: "",
                email: "",
                phone: "",
                birthDate: "",
                hometown: "",
            });
            handleCloseAddRenterDialog();
            getRoomDetailsAndAmenities();
            toast.success("Đã thêm người thuê thành công!");
        } catch (error) {
            console.error("Error adding renter:", error);
            toast.error("Lỗi khi thêm người thuê");
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose} // Use new handler here
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: "1200px",
                    height: "720px",
                    maxWidth: "none",
                    maxHeight: "none",
                    m: 2,
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pb: 1,
                    px: 3,
                }}
            >
                <Typography variant="h5" component="div" fontWeight="600">
                    {roomDetails ? `Phòng ${roomDetails.roomCode}` : "Phòng"}
                </Typography>
                <IconButton onClick={handleClose} size="small">
                    {" "}
                    {/* Update here too */}
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Custom styled tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        "& .MuiTab-root": {
                            textTransform: "none",
                            fontWeight: 500,
                            minHeight: 48,
                            transition: "all 0.3s ease-in-out",
                            "&.Mui-selected": {
                                backgroundColor: "primary.main",
                                color: "white",
                                borderRadius: "4px 4px 0 0",
                                transform: "scale(1.02)",
                            },
                            "&:hover:not(.Mui-selected)": {
                                backgroundColor: "primary.light",
                                color: "white",
                                borderRadius: "4px 4px 0 0",
                            },
                        },
                        "& .MuiTabs-indicator": {
                            display: "none", // Hide default indicator
                        },
                    }}
                >
                    <Tab label="Tạo hóa đơn" />
                    <Tab label="Tiện nghi" />
                    <Tab label="Người thuê" />
                </Tabs>
            </Box>

            <DialogContent
                sx={{
                    px: 3,
                    pb: 2,
                    height: "calc(700px - 200px)", // Fixed height minus header/footer
                    overflow: "hidden",
                }}
            >
                {console.log("Loading state - roomDetails:", roomDetails, loading)}
                {loading || !roomDetails ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <CircularProgress />
                        <Typography color="text.secondary">Đang tải dữ liệu...</Typography>
                    </Box>
                ) : (
                    <>
                        <TabPanel value={activeTab} index={0}>
                            <RenterInfo />

                            <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 1.5 }}>
                                Tạo hóa đơn hàng tháng
                            </Typography>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: 2,
                                }}
                            >
                                {amenities.map((amenity) => (
                                    <Box key={amenity.id} sx={{ display: "flex" }}>
                                        <AmenityCard amenity={amenity} />
                                    </Box>
                                ))}
                            </Box>
                        </TabPanel>

                        <TabPanel value={activeTab} index={1}>
                            <AmenitiesManagement
                                roomId={roomId}
                                roomAmenities={roomAmenities}
                                setRoomAmenities={setRoomAmenities}
                            />
                        </TabPanel>
                    </>
                )}
                <TabPanel value={activeTab} index={2}>
                    <Box sx={{ p: 2 }}>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 3,
                            }}
                        >
                            <Typography variant="h6" fontWeight="600">
                                Thông tin người thuê phòng
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<PersonAddIcon />}
                                    onClick={handleSearchDialogOpen}
                                    sx={{
                                        bgcolor: "primary.main",
                                        "&:hover": { bgcolor: "primary.dark" },
                                    }}
                                >
                                    Thêm người đại diện
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<GroupAddIcon />}
                                    onClick={handleAddRenterDialog}
                                    sx={{
                                        borderColor: "primary.main",
                                        color: "primary.main",
                                        "&:hover": { bgcolor: "primary.50" },
                                    }}
                                >
                                    Thêm người thuê
                                </Button>
                            </Box>
                        </Box>

                        {/* Scrollable grid container for renter cards */}
                        <Box
                            sx={{
                                height: "calc(100vh - 350px)", // Adjust height as needed
                                overflowY: "auto",
                                pr: 1,
                                "&::-webkit-scrollbar": {
                                    width: "8px",
                                },
                                "&::-webkit-scrollbar-track": {
                                    background: "#f1f1f1",
                                    borderRadius: "10px",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                    background: "#888",
                                    borderRadius: "10px",
                                    "&:hover": {
                                        background: "#666",
                                    },
                                },
                            }}
                        >
                            <Grid container spacing={2} p={1}>
                                {renters.length === 0 ? (
                                    <Grid item xs={12}>
                                        <Paper sx={{ p: 4, textAlign: "center", bgcolor: "grey.50" }}>
                                            <PersonIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary">
                                                Phòng chưa có người thuê
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Hãy thêm người thuê để quản lý thông tin
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                ) : (
                                    renters.map((renter, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Card
                                            sx={{
                                                height: 240,
                                                borderRadius: 3,
                                                width: 340,
                                                boxShadow: 2,
                                                p: 2,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "space-between",
                                                transition: "all 0.2s",
                                                "&:hover": {
                                                    boxShadow: 4,
                                                    transform: "translateY(-4px)",
                                                },
                                            }}
                                        >
                                            {/* Header */}
                                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                                <Avatar
                                                    sx={{
                                                        width: 44,
                                                        height: 44,
                                                        bgcolor: "primary.main",
                                                        mr: 2,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {renter.fullname?.charAt(0).toUpperCase()}
                                                </Avatar>

                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        variant="subtitle1"
                                                        fontWeight={600}
                                                        noWrap
                                                        sx={{ textOverflow: "ellipsis" }}
                                                    >
                                                        {renter.fullname}
                                                    </Typography>

                                                    {renter.isRepresentative && (
                                                        <Chip
                                                            label="Người đại diện"
                                                            size="small"
                                                            color="success"
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    )}
                                                </Box>

                                                <RenterActionMenu
                                                    renter={renter}
                                                    roomId={roomId}
                                                    onDelete={() => handleOpenDeleteConfirm(renter)}
                                                />
                                            </Box>

                                            {/* Body */}
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 1,
                                                    mt: 1,
                                                }}
                                            >
                                                {[
                                                    { icon: <EmailIcon fontSize="small" />, value: renter.email },
                                                    { icon: <PhoneIcon fontSize="small" />, value: renter.phone },
                                                    {
                                                        icon: <CalendarIcon fontSize="small" />,
                                                        value: renter.birthDate,
                                                    },
                                                    { icon: <LocationIcon fontSize="small" />, value: renter.hometown },
                                                ].map((item, idx) => (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        <Box sx={{ mr: 1, color: "primary.main", display: "flex" }}>
                                                            {item.icon}
                                                        </Box>
                                                        <Typography
                                                            variant="body2"
                                                            noWrap
                                                            sx={{ flex: 1, textOverflow: "ellipsis" }}
                                                        >
                                                            {item.value || "Chưa cập nhật"}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Card>
                                    </Grid>
                                    ))
                                )}
                            </Grid>
                        </Box>
                    </Box>
                </TabPanel>
            </DialogContent>

            <DialogActions
                sx={{
                    justifyContent: "space-between",
                    px: 3,
                    py: 2,
                    borderTop: 1,
                    borderColor: "divider",
                    gap: 1,
                }}
            >
                {/* {activeTab === 0 && ( */}
                <>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="h6" color="primary.main" fontWeight="600">
                            Tổng cộng: {calculateTotal().toLocaleString("vi-VN")} đ
                        </Typography>
                    </Box>
                </>
                {/* )} */}

                <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flex: 1 }}>
                    {/* {activeTab === 0 && ( */}
                    <>
                        <Button variant="outlined" onClick={handleReset} color="inherit" sx={{ minWidth: 100 }}>
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
                    </>
                    {/* )} */}
                    <Button variant="outlined" onClick={handleClose} color="inherit" sx={{ minWidth: 100 }}>
                        Đóng
                    </Button>
                </Box>
            </DialogActions>

            {/* Confirm Modal */}
            <ConfirmModal
                show={showConfirm}
                title="Xác nhận tạo hóa đơn"
                message={
                    confirmData ? (
                        <div>
                            <p>
                                <strong>Phòng:</strong> {roomDetails?.code}
                            </p>
                            <p>
                                <strong>Chi tiết:</strong>
                            </p>

                            {/* Table format for better readability */}
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "0.9em",
                                    marginBottom: "15px",
                                }}
                            >
                                <thead>
                                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                                        <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>
                                            Khoản phí
                                        </th>
                                        <th style={{ padding: "8px", textAlign: "center", border: "1px solid #ddd" }}>
                                            Tính toán
                                        </th>
                                        <th style={{ padding: "8px", textAlign: "right", border: "1px solid #ddd" }}>
                                            Thành tiền
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {confirmData.invoiceItems.map((item, index) => {
                                        const amenity = amenities.find((a) => a.name === item.label);
                                        let calculationText = "";

                                        if (amenity) {
                                            if (amenity.isRoomRent) {
                                                calculationText = `${amenity.price.toLocaleString("vi-VN")} đ/tháng × 1 tháng`;
                                            } else if (amenity.isMetered && amenity.hasInput) {
                                                const currentReading = invoiceData[amenity.id] || 0;
                                                const lastReading = amenity.lastUsedNumber || 0;
                                                const consumption = Math.max(0, currentReading - lastReading);
                                                calculationText = (
                                                    <div>
                                                        <div>
                                                            Chỉ số cũ: {lastReading.toLocaleString()} {amenity.unitType}
                                                        </div>
                                                        <div>
                                                            Chỉ số mới: {currentReading.toLocaleString()}{" "}
                                                            {amenity.unitType}
                                                        </div>
                                                        <div>
                                                            Tiêu thụ: {consumption.toLocaleString()} {amenity.unitType}
                                                        </div>
                                                        <div>
                                                            {amenity.price.toLocaleString("vi-VN")} đ/{amenity.unitType}{" "}
                                                            × {consumption.toLocaleString()}
                                                        </div>
                                                    </div>
                                                );
                                            } else if (amenity.hasInput) {
                                                const inputValue = invoiceData[amenity.id] || 0;
                                                calculationText = `${amenity.price.toLocaleString("vi-VN")} ${amenity.unit} × ${inputValue} ${amenity.inputLabel}`;
                                            } else {
                                                calculationText = `${amenity.price.toLocaleString("vi-VN")} ${amenity.unit} (cố định)`;
                                            }
                                        }

                                        return (
                                            <tr key={index}>
                                                <td
                                                    style={{
                                                        padding: "8px",
                                                        border: "1px solid #ddd",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {item.label}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "8px",
                                                        border: "1px solid #ddd",
                                                        fontSize: "0.85em",
                                                        color: "#666",
                                                    }}
                                                >
                                                    {calculationText}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "8px",
                                                        border: "1px solid #ddd",
                                                        textAlign: "right",
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {item.amount.toLocaleString("vi-VN")} đ
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Total row */}
                                    <tr style={{ backgroundColor: "#f0f8ff", fontWeight: "bold" }}>
                                        <td
                                            colSpan={2}
                                            style={{
                                                padding: "12px 8px",
                                                border: "1px solid #ddd",
                                                textAlign: "right",
                                            }}
                                        >
                                            <strong>TỔNG CỘNG:</strong>
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px 8px",
                                                border: "1px solid #ddd",
                                                textAlign: "right",
                                                fontSize: "1.1em",
                                                color: "#1976d2",
                                            }}
                                        >
                                            <strong>{confirmData.totalAmount.toLocaleString("vi-VN")} đ</strong>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <p>
                                <strong>Thời gian:</strong> Tháng {new Date(confirmData.period.start).getUTCMonth() + 1}
                                /{new Date(confirmData.period.start).getUTCFullYear()}
                            </p>
                            <p>
                                <strong>Thời hạn thanh toán:</strong>{" "}
                                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("vi-VN")}
                            </p>
                        </div>
                    ) : (
                        ""
                    )
                }
                onConfirm={handleConfirmCreateInvoice}
                onCancel={handleCancelConfirm}
                confirmText="Tạo hóa đơn"
                cancelText="Hủy"
            />

            {/* Search Renter Dialog */}
            <Dialog open={openSearchDialog} onClose={handleSearchDialogClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h6">Tìm kiếm người thuê</Typography>
                        <IconButton onClick={handleSearchDialogClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nhập chính xác số điện thoại hoặc email của người đại diện..."
                        helperText="Người được chọn sẽ trở thành người đại diện phòng"
                        variant="outlined"
                        size="small"
                        autoFocus
                        // Remove debounce since we want exact matches
                    />

                    <List sx={{ maxHeight: 400, overflow: "auto" }}>
                        {searchResults.map((user) => (
                            <ListItem
                                key={user._id}
                                button
                                onClick={() => handleRenterSelect(user)}
                                sx={{
                                    "&:hover": {
                                        bgcolor: "action.hover",
                                    },
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: "primary.main" }}>
                                        {user.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={user.name}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2">
                                                {user.email}
                                            </Typography>
                                            {user.phone && (
                                                <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                                                    {user.phone}
                                                </Typography>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>

                    {searchTerm && !isSearching && searchResults.length === 0 && (
                        <Box sx={{ textAlign: "center", py: 3 }}>
                            <Typography color="text.secondary">Không tìm thấy kết quả phù hợp</Typography>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmModal
                show={showDeleteConfirm}
                title="Xác nhận xóa người thuê"
                message="Bạn có chắc muốn xóa người thuê này khỏi danh sách?"
                onConfirm={handleConfirmDelete}
                onCancel={handleCloseDeleteConfirm}
                confirmText="Xóa"
                cancelText="Hủy"
            />

            {/* Add Renter Dialog */}
            <Dialog open={openAddRenterDialog} onClose={handleCloseAddRenterDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="h6">Thêm người thuê mới</Typography>
                        <IconButton onClick={handleCloseAddRenterDialog}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Họ và tên"
                            value={newRenterData.fullname}
                            onChange={(e) =>
                                setNewRenterData((prev) => ({
                                    ...prev,
                                    fullname: e.target.value,
                                }))
                            }
                            required
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={newRenterData.email}
                            onChange={(e) =>
                                setNewRenterData((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                }))
                            }
                        />
                        <TextField
                            fullWidth
                            label="Số điện thoại"
                            value={newRenterData.phone}
                            onChange={(e) =>
                                setNewRenterData((prev) => ({
                                    ...prev,
                                    phone: e.target.value,
                                }))
                            }
                            required
                        />
                        <TextField
                            fullWidth
                            label="Ngày sinh"
                            type="date"
                            value={newRenterData.birthDate}
                            onChange={(e) =>
                                setNewRenterData((prev) => ({
                                    ...prev,
                                    birthDate: e.target.value,
                                }))
                            }
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            fullWidth
                            label="Quê quán"
                            value={newRenterData.hometown}
                            onChange={(e) =>
                                setNewRenterData((prev) => ({
                                    ...prev,
                                    hometown: e.target.value,
                                }))
                            }
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleCloseAddRenterDialog} color="inherit">
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitNewRenter}
                        disabled={!newRenterData.fullname || !newRenterData.phone}
                    >
                        Thêm người thuê
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default CreateInvoiceDialog;

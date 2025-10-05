import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { convexQueryOneTime, convexMutation } from "../../services/convexClient";
import useClerkUserData from "../../hooks/useClerkUserData";
import { api } from "../../../convex/_generated/api";
import CreateRoomForm from "../../features/room/CreateRoomForm";
import {
    Container,
    Box,
    Button,
    Grid,
    CircularProgress,
    Typography,
    Chip,
    Stack,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Breadcrumbs,
    Link,
} from "@mui/material";
import {
    Add,
    MoreVert,
    EditOutlined,
    DeleteOutline,
    Home as HomeIcon,
    NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import ConfirmModal from "../../components/ConfirmModal";
import UpdateRoomForm from "../../features/room/UpdateRoomForm";
import SearchRoomForm from "./SearchRoomForm";
import CreateInvoiceDialog from "../../features/room/CreateInvoiceDialog";

function formatVND(n) {
    if (n === undefined || n === null) return "-";
    try {
        return new Intl.NumberFormat("vi-VN").format(n);
    } catch {
        return `${n}`;
    }
}

function getAmenityIcon(type) {
    switch (type) {
        case "electricity":
        case "điện":
            return "⚡";
        case "water":
        case "nước":
            return "💧";
        case "internet":
            return "📶";
        case "trash":
        case "rác":
            return "🗑️";
        case "elevator":
        case "thang máy":
            return "🛗";
        case "management":
        case "quản lý":
            return "👥";
        default:
            return "🏠";
    }
}

function statusChip(status) {
    switch (status) {
        case "occupied":
            return { label: "Đang sử dụng", color: "primary" };
        case "maintenance":
            return { label: "Đang sửa", color: "warning" };
        default:
            return { label: "Trống", color: "success" };
    }
}

export default function RoomPage() {
    const { user } = useClerkUserData();
    const { dormId: routeDormId } = useParams();
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [roomAmenities, setRoomAmenities] = useState({}); // Store amenities by roomId
    const [loading, setLoading] = useState(false);

    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);

    const [landlordId, setLandlordId] = useState(null);
    const [createDormId, setCreateDormId] = useState(null);
    const [updateRoomId, setUpdateRoomId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuRoomId, setMenuRoomId] = useState(null);
    const openMenu = Boolean(menuAnchor);
    const handleOpenMenu = (event, roomId) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setMenuRoomId(roomId);
    };
    const handleCloseMenu = () => {
        setMenuAnchor(null);
        setMenuRoomId(null);
    };
    const handleMenuEdit = () => {
        if (menuRoomId) handleOpenUpdate(menuRoomId);
        handleCloseMenu();
    };
    const handleMenuDelete = () => {
        if (menuRoomId) {
            setDeleteId(menuRoomId);
            setOpenConfirm(true);
        }
        handleCloseMenu();
    };

    // Invoice dialog
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    // caches
    const [dormNames, setDormNames] = useState({});
    const [renterNames, setRenterNames] = useState({});

    useEffect(() => {
        const bootstrap = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const convexUser = await convexQueryOneTime(api.functions.users.getUserByClerkId, {
                    clerkUserId: user.id,
                });
                const lid = convexUser?.detail?._id || null;
                setLandlordId(lid);
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, [user?.id]);

    useEffect(() => {
        const loadRooms = async () => {
            if (!landlordId) return;
            setLoading(true);
            try {
                let data = [];
                if (routeDormId) {
                    data = await convexQueryOneTime(api.functions.rooms.listByDorm, { dormId: routeDormId });
                } else {
                    data = await convexQueryOneTime(api.functions.rooms.listByLandlord, { landlordId });
                }
                setRooms(data || []);

                // load renter names
                const renterIds = data.filter((room) => room.currentRenterId).map((r) => r.currentRenterId);
                if (renterIds.length > 0 && api.functions?.renters?.getById) {
                    const uniqueRenterIds = [...new Set(renterIds)];
                    const results = await Promise.allSettled(
                        uniqueRenterIds.map((renterId) =>
                            convexQueryOneTime(api.functions.renters.getById, { renterId }),
                        ),
                    );
                    const map = {};
                    results.forEach((res, idx) => {
                        const renterId = uniqueRenterIds[idx];
                        if (res.status === "fulfilled" && res.value) {
                            map[renterId] = res.value.name || `Người thuê ${renterId.slice(-4)}`;
                        } else {
                            console.warn("Failed to load renter", renterId, res.reason);
                            map[renterId] = `Người thuê ${renterId.slice(-4)}`;
                        }
                    });
                    setRenterNames(map);
                } else {
                    setRenterNames({});
                }

                // Load room amenities
                const roomIds = data.map((room) => room._id);
                console.log("Loading amenities for rooms:", roomIds);
                console.log("Available API functions:", api.functions.amentities);
                if (roomIds.length > 0) {
                    const amenityResults = await Promise.allSettled(
                        roomIds.map(async (roomId) => {
                            try {
                                console.log(`Calling listByRoom for room ${roomId}`);
                                const result = await convexQueryOneTime(api.functions.amentities.listByRoom, {
                                    roomId,
                                });
                                console.log(`Result for room ${roomId}:`, result);
                                return result;
                            } catch (error) {
                                console.error(`Error loading amenities for room ${roomId}:`, error);
                                throw error;
                            }
                        }),
                    );
                    const amenityMap = {};
                    amenityResults.forEach((res, idx) => {
                        const roomId = roomIds[idx];
                        if (res.status === "fulfilled" && res.value) {
                            console.log(`Amenities for room ${roomId}:`, res.value);
                            amenityMap[roomId] = res.value || [];
                        } else {
                            console.warn("Failed to load amenities for room", roomId, res.reason);
                            amenityMap[roomId] = [];
                        }
                    });
                    console.log("Final amenity map:", amenityMap);
                    setRoomAmenities(amenityMap);
                } else {
                    setRoomAmenities({});
                }

                // Optional: you can load dorm names similarly if you have an API
            } finally {
                setLoading(false);
            }
        };
        loadRooms();
    }, [landlordId, routeDormId]);

    const handleOpenCreate = (dormId = null) => {
        setCreateDormId(dormId ?? routeDormId ?? null);
        setOpenCreate(true);
    };

    const handleOpenUpdate = (roomId = null) => {
        setUpdateRoomId(roomId);
        setOpenUpdate(true);
    };

    const handleCloseCreate = () => setOpenCreate(false);
    const handleCloseUpdate = () => setOpenUpdate(false);

    const handleOpenInvoiceDialog = (roomId) => {
        setSelectedRoomId(roomId);
        setInvoiceDialogOpen(true);
    };
    const handleCloseInvoiceDialog = () => {
        setInvoiceDialogOpen(false);
        setSelectedRoomId(null);
    };

    const reloadRooms = async () => {
        if (!landlordId) return;
        setLoading(true);
        try {
            let data = [];
            if (routeDormId) {
                data = await convexQueryOneTime(api.functions.rooms.listByDorm, { dormId: routeDormId });
            } else {
                data = await convexQueryOneTime(api.functions.rooms.listByLandlord, { landlordId });
            }
            setRooms(data || []);

            const renterIds = data.filter((room) => room.currentRenterId).map((r) => r.currentRenterId);
            if (renterIds.length > 0 && api.functions?.renters?.getById) {
                const uniqueRenterIds = [...new Set(renterIds)];
                const results = await Promise.allSettled(
                    uniqueRenterIds.map((renterId) => convexQueryOneTime(api.functions.renters.getById, { renterId })),
                );
                const map = {};
                results.forEach((res, idx) => {
                    const renterId = uniqueRenterIds[idx];
                    if (res.status === "fulfilled" && res.value) {
                        map[renterId] = res.value.name || `Người thuê ${renterId.slice(-4)}`;
                    } else {
                        console.warn("Failed to load renter", renterId, res.reason);
                        map[renterId] = `Người thuê ${renterId.slice(-4)}`;
                    }
                });
                setRenterNames(map);
            } else {
                setRenterNames({});
            }

            // Load room amenities
            const roomIds = data.map((room) => room._id);
            console.log("Reloading amenities for rooms:", roomIds);
            if (roomIds.length > 0) {
                const amenityResults = await Promise.allSettled(
                    roomIds.map((roomId) => convexQueryOneTime(api.functions.amentities.listByRoom, { roomId })),
                );
                const amenityMap = {};
                amenityResults.forEach((res, idx) => {
                    const roomId = roomIds[idx];
                    if (res.status === "fulfilled" && res.value) {
                        console.log(`Reloaded amenities for room ${roomId}:`, res.value);
                        amenityMap[roomId] = res.value || [];
                    } else {
                        console.warn("Failed to reload amenities for room", roomId, res.reason);
                        amenityMap[roomId] = [];
                    }
                });
                console.log("Final reloaded amenity map:", amenityMap);
                setRoomAmenities(amenityMap);
            } else {
                setRoomAmenities({});
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRoomCreated = async () => {
        await reloadRooms();
        setOpenCreate(false);
    };

    const handleRoomUpdated = async () => {
        await reloadRooms();
        setOpenUpdate(false);
    };

    // When user confirms deletion
    const handleDeleteConfirmed = async () => {
        if (!deleteId) return;
        setLoading(true);
        try {
            await convexMutation(api.functions.rooms.remove, { roomId: deleteId });
            await reloadRooms();
            setOpenConfirm(false);
            setDeleteId(null);
        } catch (e) {
            alert(e?.message || "Xóa phòng thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelDelete = () => {
        setOpenConfirm(false);
        setDeleteId(null);
    };

    // Derived: rooms after applying current search and status filters
    const filteredRooms = rooms.filter((roomItem) => {
        if (statusFilter !== "all" && roomItem.status !== statusFilter) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        const codeStr = String(roomItem.code ?? "").toLowerCase();
        const renterName = renterNames[roomItem.currentRenterId] || "";
        const renterStr = renterName.toLowerCase();
        return codeStr.includes(q) || renterStr.includes(q);
    });

    return (
        <>
            <ConfirmModal
                show={openConfirm}
                onCancel={handleCancelDelete}
                onConfirm={handleDeleteConfirmed}
                title="Xóa phòng"
                message="Bạn có chắc chắn muốn xóa phòng này?"
            />

            <Container sx={{ py: 3 }}>
                {/* Breadcrumb Navigation */}
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
                    <Link
                        underline="hover"
                        color="inherit"
                        component="button"
                        onClick={() => navigate("/landlord/dorms")}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            "&:hover": {
                                color: "primary.main",
                            },
                        }}
                    >
                        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                        Danh sách Nhà Trọ
                    </Link>
                    <Typography color="text.primary" sx={{ fontWeight: 500 }}>
                        {routeDormId ? `Phòng của nhà trọ` : "Tất cả phòng"}
                    </Typography>
                </Breadcrumbs>

                {/* Header */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 3,
                        mt: 3,
                        width: "100%",
                        maxWidth: 990,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{ fontWeight: "bold", color: "black", mb: 0.5, fontFamily: "Roboto, Helvetica" }}
                        >
                            Quản lí phòng trọ
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ color: "#7b1fa2", fontSize: "13.9px", fontFamily: "Roboto, Helvetica" }}
                        >
                            Quản lí phòng trọ và căn hộ của bạn
                        </Typography>
                    </Box>
                    <Button
                        onClick={() => handleOpenCreate()}
                        startIcon={<Add />}
                        variant="contained"
                        sx={{
                            backgroundColor: "#7b1fa2",
                            textTransform: "none",
                            fontWeight: 500,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                            "&:hover": {
                                backgroundColor: "#6a1b9a",
                                boxShadow: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
                            },
                        }}
                    >
                        Thêm phòng
                    </Button>
                </Box>

                {/* Summary + Search */}
                {rooms.length > 0 && (
                    <Box sx={{ mb: 2, width: "100%", maxWidth: 990 }}>
                        {(() => {
                            const total = rooms.length;
                            const occupied = rooms.filter((r) => r.status === "occupied").length;
                            const vacant = rooms.filter((r) => r.status === "vacant").length;
                            const maintenance = rooms.filter((r) => r.status === "maintenance").length;
                            const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

                            const cardSx = {
                                border: "1px solid #e0e0e0",
                                borderRadius: 3,
                                px: 2.5,
                                py: 2,
                                backgroundColor: "white",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            };
                            const labelSx = { color: "text.secondary", fontSize: 14, fontWeight: 600 };
                            const valueSx = { mt: 0.5, fontWeight: 700, fontSize: 22 };

                            return (
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                                        gap: 2,
                                    }}
                                >
                                    <Box sx={cardSx}>
                                        <Typography sx={labelSx}>Tổng số phòng</Typography>
                                        <Typography sx={valueSx}>{total}</Typography>
                                    </Box>
                                    <Box sx={cardSx}>
                                        <Typography sx={labelSx}>Đang cho thuê</Typography>
                                        <Typography sx={valueSx}>{occupied}</Typography>
                                    </Box>
                                    <Box sx={cardSx}>
                                        <Typography sx={labelSx}>Còn trống</Typography>
                                        <Typography sx={valueSx}>{vacant}</Typography>
                                    </Box>
                                    <Box sx={cardSx}>
                                        <Typography sx={labelSx}>Tỷ lệ lấp đầy</Typography>
                                        <Typography sx={{ ...valueSx, color: "#7b1fa2" }}>{rate}%</Typography>
                                    </Box>
                                </Box>
                            );
                        })()}
                    </Box>
                )}

                <SearchRoomForm
                    search={search}
                    status={statusFilter}
                    onSearchChange={setSearch}
                    onStatusChange={setStatusFilter}
                />

                {/* Room Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }} alignItems="stretch" justifyContent="flex-start">
                    {filteredRooms.length === 0 ? (
                        <Grid item xs={12}>
                            <Typography align="center" color="text.secondary" sx={{ fontStyle: "italic" }}>
                                {rooms.length === 0 ? "Chưa có phòng nào" : "Không tìm thấy phòng phù hợp"}
                            </Typography>
                            {/* {rooms.length === 0 && !loading && (
                                <Box sx={{ textAlign: "center", mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => handleOpenCreate()}
                                        disabled={loading || !landlordId}
                                        sx={{
                                            backgroundColor: "#7b1fa2",
                                            "&:hover": { backgroundColor: "#6a1b9a" },
                                            textTransform: "none",
                                            fontFamily: "Inter, Helvetica",
                                            fontSize: "13.3px",
                                            fontWeight: 500,
                                        }}
                                    >
                                        Thêm phòng
                                    </Button>
                                </Box>
                            )} */}
                        </Grid>
                    ) : (
                        filteredRooms.map((roomItem) => {
                            const chip = statusChip(roomItem.status);
                            const createdMs = roomItem.createdAt ?? roomItem._creationTime;
                            const renterName = roomItem.currentRenterId ? renterNames[roomItem.currentRenterId] : null;
                            const avatarLetter = renterName ? renterName.charAt(0).toUpperCase() : null;

                            return (
                                <Grid item xs={12} sm={6} md={4} lg={4} xl={4} key={roomItem._id}>
                                    <Box
                                        tabIndex={0}
                                        sx={{
                                            position: "relative",
                                            border: "1px solid #dcdcdc",
                                            borderRadius: 3,
                                            p: 2.5,
                                            backgroundColor: "white",
                                            boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 1.5,
                                            height: "100%",
                                            minHeight: 220,
                                            transition:
                                                "border-color .2s ease, box-shadow .2s ease, transform .06s ease",
                                            "&:hover": {
                                                borderColor: "#7b1fa2",
                                                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                                                transform: "translateY(-1px)",
                                            },
                                            "&:focus-visible": {
                                                outline: "none",
                                                borderColor: "#7b1fa2",
                                                boxShadow: "0 0 0 3px rgba(123,31,162,0.18)",
                                            },
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handleOpenInvoiceDialog(roomItem._id)}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: "bold",
                                                    flex: 1,
                                                    pr: 4,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    fontSize: { xs: "1.05rem", sm: "1.1rem" },
                                                }}
                                                title={`Phòng ${roomItem.code}`}
                                            >
                                                Phòng {roomItem.code}
                                            </Typography>
                                            <Box
                                                sx={{
                                                    width: 152,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "flex-end",
                                                    columnGap: 0.5,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Chip
                                                    size="small"
                                                    label={chip.label}
                                                    color={chip.color}
                                                    sx={{ fontWeight: 500 }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleOpenMenu(e, roomItem._id)}
                                                    aria-label="room options"
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Box>
                                            {roomItem.currentRenterId ? (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "#7b1fa2",
                                                        fontWeight: 500,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    👤 {renterNames[roomItem.currentRenterId] || "Đang tải..."}
                                                </Typography>
                                            ) : (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                        fontStyle: "italic",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    👤 Chưa có người thuê
                                                </Typography>
                                            )}
                                        </Box>

                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            Tiền thuê:{" "}
                                            <span style={{ fontWeight: 700 }}>{formatVND(roomItem.price)}đ/tháng</span>
                                        </Typography>

                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            {(roomAmenities[roomItem._id] || [])
                                                .filter((amenity) => amenity.enabled !== false) // Only show enabled amenities
                                                .slice(0, 3)
                                                .map((amenity, index) => (
                                                    <Chip
                                                        key={index}
                                                        size="small"
                                                        label={`${getAmenityIcon(amenity.details?.type)} ${amenity.details?.name || "Tiện ích"}`}
                                                        variant="outlined"
                                                        sx={{
                                                            fontSize: "0.75rem",
                                                            "& .MuiChip-label": {
                                                                px: 1,
                                                            },
                                                        }}
                                                    />
                                                ))}
                                            {(roomAmenities[roomItem._id] || []).filter(
                                                (amenity) => amenity.enabled !== false,
                                            ).length > 3 && (
                                                <Chip
                                                    size="small"
                                                    label={`+${(roomAmenities[roomItem._id] || []).filter((amenity) => amenity.enabled !== false).length - 3} khác`}
                                                    variant="outlined"
                                                    color="primary"
                                                    sx={{ fontSize: "0.75rem" }}
                                                />
                                            )}
                                            {(roomAmenities[roomItem._id] || []).filter(
                                                (amenity) => amenity.enabled !== false,
                                            ).length === 0 && (
                                                <Chip
                                                    size="small"
                                                    label="Chưa có tiện ích"
                                                    variant="outlined"
                                                    color="default"
                                                    sx={{
                                                        fontSize: "0.75rem",
                                                        color: "text.secondary",
                                                        borderColor: "divider",
                                                    }}
                                                />
                                            )}
                                        </Stack>

                                        <Typography variant="body2" color="text.secondary">
                                            Ngày tạo:{" "}
                                            {createdMs ? new Date(createdMs).toLocaleDateString("vi-VN") : "-"}
                                        </Typography>
                                    </Box>
                                </Grid>
                            );
                        })
                    )}
                </Grid>

                <Menu
                    anchorEl={menuAnchor}
                    open={openMenu}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                    <MenuItem onClick={handleMenuEdit} disabled={loading || !landlordId}>
                        <ListItemIcon>
                            <EditOutlined fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Sửa</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleMenuDelete} disabled={loading || !landlordId} sx={{ color: "error.main" }}>
                        <ListItemIcon sx={{ color: "error.main" }}>
                            <DeleteOutline fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Xóa</ListItemText>
                    </MenuItem>
                </Menu>

                {loading && (
                    <Box
                        sx={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.1)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 9999,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                <CreateRoomForm
                    open={openCreate}
                    onClose={handleCloseCreate}
                    landlordId={landlordId}
                    dormId={createDormId}
                    onCreated={handleRoomCreated}
                />

                <UpdateRoomForm
                    open={openUpdate}
                    onClose={handleCloseUpdate}
                    landlordId={landlordId}
                    dormId={updateRoomId ? rooms.find((r) => r._id === updateRoomId)?.dormId : null}
                    roomId={updateRoomId}
                    roomData={updateRoomId ? rooms.find((r) => r._id === updateRoomId) : null}
                    onUpdate={handleRoomUpdated}
                />

                {invoiceDialogOpen && (
                    <CreateInvoiceDialog
                        open={invoiceDialogOpen}
                        onClose={handleCloseInvoiceDialog}
                        roomId={selectedRoomId}
                        onDialogClose={reloadRooms} // Add this line to trigger refresh
                    />
                )}
            </Container>
        </>
    );
}

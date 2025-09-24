import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { convexQueryOneTime, convexMutation } from "../../services/convexClient";
import useClerkUserData from "../../hooks/useClerkUserData";
import { api } from "../../../convex/_generated/api";
import CreateRoomForm from "../../features/room/CreateRoomForm";
import { Container, Box, Button, Grid, CircularProgress, Typography, Chip, Stack, Avatar } from "@mui/material";
import { Add } from "@mui/icons-material";

function formatVND(n) {
    if (n === undefined || n === null) return "-";
    try {
        return new Intl.NumberFormat("vi-VN").format(n);
    } catch {
        return `${n}`;
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

    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);

    const [openCreate, setOpenCreate] = useState(false);
    const [landlordId, setLandlordId] = useState(null);
    const [createDormId, setCreateDormId] = useState(null);

    // Cache dorm names: { [dormId]: name }
    const [dormNames, setDormNames] = useState({});
    // Optional: renter names if currentRenterId exists
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
                setRooms(data);

                // Load missing dorm names
                const missingDormIds = [...new Set(data.map((r) => r.dormId))].filter((id) => !dormNames[id]);
                if (missingDormIds.length > 0 && api.functions?.dorms?.getById) {
                    const entries = await Promise.all(
                        missingDormIds.map(async (id) => {
                            try {
                                const d = await convexQueryOneTime(api.functions.dorms.getById, { dormId: id });
                                return [id, d?.name || id];
                            } catch {
                                return [id, id];
                            }
                        }),
                    );
                    setDormNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
                }

                // Load renter names if any
                const renterIds = [...new Set(data.map((r) => r.currentRenterId).filter(Boolean))].filter(
                    (rid) => !renterNames[rid],
                );
                if (renterIds.length > 0 && api.functions?.renters?.getById) {
                    const entries = await Promise.all(
                        renterIds.map(async (rid) => {
                            try {
                                const r = await convexQueryOneTime(api.functions.renters.getById, { renterId: rid });
                                return [rid, r?.name || rid];
                            } catch {
                                return [rid, rid];
                            }
                        }),
                    );
                    setRenterNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
                }
            } finally {
                setLoading(false);
            }
        };
        loadRooms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [landlordId, routeDormId]);

    const handleOpenCreate = (dormId = null) => {
        setCreateDormId(dormId ?? routeDormId ?? null);
        setOpenCreate(true);
    };
    const handleCloseCreate = () => setOpenCreate(false);

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
            setRooms(data);
        } finally {
            setLoading(false);
        }
    };

    const handleRoomCreated = async () => {
        await reloadRooms();
        setOpenCreate(false);
    };

    const handleDelete = async (roomId) => {
        const ok = window.confirm("Xóa phòng này?");
        if (!ok) return;
        setLoading(true);
        try {
            await convexMutation(api.functions.rooms.remove, { roomId });
            await reloadRooms();
        } catch (e) {
            alert(e?.message || "Xóa phòng thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
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
                        mr: 1,
                    }}
                >
                    Thêm phòng
                </Button>
            </Box>

            {/* Room Cards */}
            <Grid style={{ cursor: "pointer" }} container spacing={2} sx={{ mb: 3 }} alignItems="stretch">
                {rooms.map((roomItem) => {
                    const chip = statusChip(roomItem.status);
                    const dormName = dormNames[roomItem.dormId] || roomItem.dormId;
                    const createdMs = roomItem.createdAt ?? roomItem._creationTime;
                    const renterName = roomItem.currentRenterId ? renterNames[roomItem.currentRenterId] : null;
                    const avatarLetter = renterName ? renterName.charAt(0).toUpperCase() : null;

                    return (
                        <Grid item xs={12} sm={6} md={6} key={roomItem._id}>
                            <Box
                                sx={{
                                    position: "relative",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 2,
                                    p: 2.5,
                                    backgroundColor: "white",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.25,
                                    height: "100%",
                                    minHeight: 240, // make the card longer
                                }}
                            >
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                        Phòng {roomItem.code}
                                    </Typography>
                                    <Chip size="small" label={chip.label} color={chip.color} sx={{ fontWeight: 500 }} />
                                </Stack>

                                {/* Optional renter row */}
                                {renterName && (
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: "#7b1fa2" }}>
                                            {avatarLetter}
                                        </Avatar>
                                        <Typography variant="body2">{renterName}</Typography>
                                    </Stack>
                                )}

                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    Tiền thuê hàng tháng:{" "}
                                    <span style={{ fontWeight: 700 }}>{formatVND(roomItem.price)}đ</span>
                                </Typography>

                                {/* Amenities chips (placeholder; hook up to roomAmenities if needed) */}
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip size="small" label="WiFi" variant="outlined" />
                                    <Chip size="small" label="Điều hòa" variant="outlined" />
                                    <Chip size="small" label="Bàn" variant="outlined" />
                                </Stack>

                                <Typography variant="body2" color="text.secondary">
                                    Khu trọ: {dormName}
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    Ngày tạo: {createdMs ? new Date(createdMs).toLocaleDateString("vi-VN") : "-"}
                                </Typography>

                                <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                                    <Button size="small" variant="outlined" disabled>
                                        Sửa
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        onClick={() => handleDelete(roomItem._id)}
                                    >
                                        Xóa
                                    </Button>
                                </Stack>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>

            {/* No Data */}
            {rooms.length === 0 && !loading && (
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        Chưa có phòng nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Bắt đầu bằng cách thêm phòng mới
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => handleOpenCreate()}
                        disabled={loading || !landlordId}
                        sx={{
                            backgroundColor: "#7b1fa2",
                            "&:hover": { backgroundColor: "#6a1b9a" },
                            textTransform: "none",
                        }}
                    >
                        Thêm phòng
                    </Button>
                </Box>
            )}

            {/* Loading Overlay */}
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
        </Container>
    );
}

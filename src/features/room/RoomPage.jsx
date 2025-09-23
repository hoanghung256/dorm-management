import { useEffect, useState } from "react";
import { convexQueryOneTime } from "../../services/convexClient";
import useClerkUserData from "../../hooks/useClerkUserData";
import { api } from "../../../convex/_generated/api";
import CreateRoomForm from "../../features/room/CreateRoomForm";
import { Container, Box, Button, Grid, CircularProgress, Snackbar, Alert, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";

function RoomPage() {
    const { user } = useClerkUserData();
    const [room, setRoom] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [landlordId, setLandlordId] = useState(null);

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
                if (lid) {
                    await getRoom(lid);
                } else {
                    setRoom([]);
                }
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, [user?.id]);

    const getRoom = async (lid = landlordId) => {
        if (!lid) return;
        const data = await convexQueryOneTime(api.functions.rooms.listByLandlord, { landlordId: lid });
        setRoom(data);
        setLoading(false);
    };

    const handleOpenCreate = () => setOpenCreate(true);
    const handleCloseCreate = () => setOpenCreate(false);
    const handleRoomCreated = async () => {
        await getRoom();
        setOpenCreate(false);
    };

    // const handleCloseSnackbar = () => {
    //     setLoading(false);
    // };

    const handleSeedData = async () => {
        setLoading(true);
        const roomData = await convexQueryOneTime(api.functions.rooms.listByLandlord, { landlordId: user.id });
        setRoom(roomData);
        setLoading(false);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: "bold",
                            color: "black",
                            mb: 0.5,
                            fontFamily: "Roboto, Helvetica",
                        }}
                    >
                        Quản lí phòng trọ
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: "#7b1fa2",
                            fontSize: "13.9px",
                            fontFamily: "Roboto, Helvetica",
                        }}
                    >
                        Quản lí phòng trọ và căn hộ của bạn
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenCreate}
                    disabled={loading}
                    sx={{
                        backgroundColor: "#7b1fa2",
                        "&:hover": {
                            backgroundColor: "#6a1b9a",
                        },
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
            <Grid container spacing={2}>
                {room.map((roomItem) => (
                    <Grid item xs={12} sm={6} md={4} key={roomItem._id}>
                        <Box
                            sx={{
                                border: "1px solid #e0e0e0",
                                borderRadius: 2,
                                p: 2,
                                backgroundColor: "white",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                                Phòng {roomItem.code}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Trạng thái:{" "}
                                <span
                                    style={{
                                        color:
                                            roomItem.status === "vacant"
                                                ? "#4caf50"
                                                : roomItem.status === "occupied"
                                                  ? "#f44336"
                                                  : "#ff9800",
                                    }}
                                >
                                    {roomItem.status === "vacant"
                                        ? "Trống"
                                        : roomItem.status === "occupied"
                                          ? "Đã thuê"
                                          : "Bảo trì"}
                                </span>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Ngày tạo: {new Date(roomItem.createdAt).toLocaleDateString("vi-VN")}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            {/* No Data */}
            {room.length === 0 && (
                <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        Chưa có phòng nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Bắt đầu bằng cách tạo dữ liệu mẫu hoặc thêm phòng mới
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={handleSeedData}
                        disabled={loading}
                        sx={{
                            backgroundColor: "#7b1fa2",
                            "&:hover": {
                                backgroundColor: "#6a1b9a",
                            },
                            textTransform: "none",
                        }}
                    >
                        Tạo dữ liệu mẫu
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

            {/* Snackbar for notifications */}
            {/* <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar> */}

            <CreateRoomForm
                open={openCreate}
                onClose={handleCloseCreate}
                landlordId={landlordId}
                onCreated={handleRoomCreated}
            />
        </Container>
    );
}

export default RoomPage;

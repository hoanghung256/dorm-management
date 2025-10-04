import { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper, Stack, Divider, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { convexQueryOneTime } from "../../services/convexClient";
import useConvexUserData from "../../hooks/useConvexUserData";

function DormInvoicePicker() {
    const user = useConvexUserData();
    const navigate = useNavigate();
    const [dorms, setDorms] = useState([]);

    useEffect(() => {
        if (user?.detail?._id) {
            getDorms();
        }
    }, [user]);

    const getDorms = async () => {
        const res = await convexQueryOneTime(api.functions.dorms.listDormsByLandlord, {
            landlordId: user.detail._id,
            page: 1,
            pageSize: 50,
        });
        setDorms(res.items || []);
    };

    const handleChooseDorm = (dormId) => {
        navigate(`/landlord/invoices/${dormId}`);
    };

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3}>
                Chọn Nhà Trọ để xem báo cáo hóa đơn
            </Typography>

            <Grid container spacing={3}>
                {dorms.map((d) => (
                    <Grid item xs={12} sm={6} md={4} key={d._id}>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                transition: "0.25s",
                                cursor: "pointer",
                                "&:hover": {
                                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                                    transform: "translateY(-3px)",
                                    borderColor: "primary.main",
                                },
                            }}
                            onClick={() => handleChooseDorm(d._id)}
                        >
                            <Stack spacing={2}>
                                {/* Header */}
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: "50%",
                                            bgcolor: "primary.light",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "primary.main",
                                            fontWeight: 700,
                                            fontSize: 18,
                                        }}
                                    >
                                        {d.name?.charAt(0) || "N"}
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={700} noWrap>
                                            {d.name || "(Không tên)"}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ fontStyle: d.address ? "normal" : "italic" }}
                                            noWrap
                                        >
                                            {d.address || "(Chưa cập nhật địa chỉ)"}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Divider />

                                {/* Footer */}
                                <Box textAlign="right">
                                    <Button variant="contained" size="small" onClick={() => handleChooseDorm(d._id)}>
                                        Xem báo cáo
                                    </Button>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default DormInvoicePicker;

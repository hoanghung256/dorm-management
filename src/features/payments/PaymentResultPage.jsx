import { useSearchParams } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { convexAction } from "../../services/convexClient";
import { useEffect, useMemo } from "react";
import useConvexUserData from "../../hooks/useConvexUserData";
import { Container, Box, Card, CardContent, Typography, Stack, Button, Alert, CircularProgress } from "@mui/material";

export default function PaymentResultPage() {
    const [searchParams] = useSearchParams();
    const orderCode = useMemo(() => searchParams.get("orderCode") || searchParams.get("id") || "", [searchParams]);
    const user = useConvexUserData();

    const tier = useMemo(() => {
        const sel = (searchParams.get("selected") || "").toLowerCase();
        return sel;
    }, [searchParams, user?.detail?.subscriptionTier]);

    useEffect(() => {
        const landlordId = user?.detail?._id;
        if (!orderCode || !landlordId) return;
        verifyPayment(orderCode, landlordId, tier);
    }, [orderCode, user?.detail?._id, tier]);

    const verifyPayment = async (orderCode, landlordId, tier) => {
        try {
            console.log("tier", landlordId, tier);
            const res = await convexAction(api.functions.payos.verifyPayOSPayment, { orderCode, landlordId, tier });
            console.log("verify", res);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Card variant="outlined">
                <CardContent>
                    <Stack spacing={2}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                            Kết quả thanh toán
                        </Typography>

                        {/* Show order code if available */}
                        {orderCode && (
                            <Typography variant="body2" color="text.secondary">
                                Mã giao dịch: <strong>{orderCode}</strong>
                            </Typography>
                        )}

                        <Typography variant="body1">Người dùng đăng kí thanh toán thành công.</Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                component="a"
                                href="/landlord/dorms"
                                sx={{ textTransform: "none" }}
                            >
                                Quay về trang quản lý phòng trọ
                            </Button>

                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => window.location.reload()}
                                sx={{ textTransform: "none" }}
                            >
                                Làm mới
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
}

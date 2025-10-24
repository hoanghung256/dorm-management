import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { convexAction } from "../../services/convexClient";
import { api } from "../../../convex/_generated/api";
import useConvexUserData from "../../hooks/useConvexUserData";

const plans = [
    {
        id: "basic",
        tier: "Basic",
        name: "Cơ bản",
        price: 49000,
        duration: "/tháng",
        suitable: "Quản lý 5-15 phòng",
    },
    {
        id: "professional",
        tier: "Pro",
        name: "Chuyên nghiệp",
        price: 79000,
        duration: "/tháng",
        suitable: "Chủ nhà có hơn 15 phòng",
    },
];

function planFromParam(selected) {
    if (!selected) return null;
    const norm = String(selected).toLowerCase();
    if (norm === "pro" || norm === "professional") return plans[1];
    if (norm === "basic") return plans[0];
    return null;
}

export default function PaymentServicePage() {
    const navigate = useNavigate();
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const selected = params.get("selected");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successDialog, setSuccessDialog] = useState(false);
    const [failureDialog, setFailureDialog] = useState(false);

    const user = useConvexUserData();
    const landlordId = user?.detail?._id;

    const selectedPlan = planFromParam(selected);

    useEffect(() => {
        // Check if redirected from PayOS
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const orderCode = urlParams.get("orderCode");
        const status = urlParams.get("status");

        if (code && orderCode && status) {
            if (status === "PAID") {
                setSuccessDialog(true);
            } else {
                setFailureDialog(true);
            }
        }
    }, []);

    const handlePayment = async () => {
        if (!selectedPlan || !landlordId) return;

        setLoading(true);
        setError("");

        try {
            console.log('[PaymentServicePage] Creating PayOS payment...', {
                landlordId,
                tier: selectedPlan.tier,
                amount: selectedPlan.price,
                description: `Thanh toán gói ${selectedPlan.name} - ${selectedPlan.duration}`
            });

            const result = await convexAction(api.functions.payOS.createPayOSPayment, {
                landlordId,
                tier: selectedPlan.tier,
                amount: selectedPlan.price,
                description: `Thanh toán gói ${selectedPlan.name} - ${selectedPlan.duration}`,
            });

            console.log('[PaymentServicePage] PayOS payment created:', result);

            if (!result.checkoutUrl) {
                throw new Error("Không nhận được URL thanh toán từ PayOS");
            }

            // Redirect to PayOS checkout
            window.location.href = result.checkoutUrl;
        } catch (err) {
            console.error('[PaymentServicePage] Payment creation error:', err);
            setError(err.message || "Có lỗi xảy ra khi tạo thanh toán");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessDialog(false);
        navigate("/landlord"); // Back to home
    };

    const handleFailureClose = () => {
        setFailureDialog(false);
        navigate("/landlord/payments/package"); // Back to package selection
    };

    if (!selectedPlan) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6">Gói không hợp lệ</Typography>
                <Button onClick={() => navigate("/landlord/payments/package")}>
                    Quay lại chọn gói
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 4 }}>
            <Card sx={{ maxWidth: 600, mx: "auto" }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom textAlign="center">
                        Xác nhận thanh toán
                    </Typography>

                    <Box sx={{ my: 3 }}>
                        <Typography variant="h6">{selectedPlan.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {selectedPlan.suitable}
                        </Typography>
                        <Typography variant="h5" color="primary" sx={{ mt: 1 }}>
                            {selectedPlan.price.toLocaleString()} đ {selectedPlan.duration}
                        </Typography>
                    </Box>

                    {error && (
                        <Typography color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={handlePayment}
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : "Thanh toán ngay"}
                    </Button>
                </CardContent>
            </Card>

            {/* Success Dialog */}
            <Dialog open={successDialog} onClose={handleSuccessClose}>
                <DialogTitle>Thanh toán thành công!</DialogTitle>
                <DialogContent>
                    <Typography>
                        Cảm ơn bạn đã thanh toán. Gói {selectedPlan.name} đã được kích hoạt.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSuccessClose}>Về trang chủ</Button>
                </DialogActions>
            </Dialog>

            {/* Failure Dialog */}
            <Dialog open={failureDialog} onClose={handleFailureClose}>
                <DialogTitle>Thanh toán thất bại</DialogTitle>
                <DialogContent>
                    <Typography>
                        Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFailureClose}>Thử lại</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

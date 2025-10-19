import React from "react";
import { Box, Container, Typography, Card, CardContent, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

// Placeholder payment service page (PayOS integration)
export default function PaymentServicePage() {
    const navigate = useNavigate();
    return (
        <Box sx={{ py: 4 }}>
            <Container maxWidth="md">
                <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", p: 4 }}>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                            Xác nhận thanh toán
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Đây là trang xử lý thanh toán (PayOS). Tích hợp xử lý thanh toán sẽ được thực hiện ở đây.
                        </Typography>

                        <Button variant="contained" color="primary" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                            Quay lại
                        </Button>
                        <Button variant="outlined" onClick={() => alert("Start payment flow (stub)")}>
                            Thanh toán (demo)
                        </Button>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

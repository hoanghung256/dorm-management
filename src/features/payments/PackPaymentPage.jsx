import React, { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
    AppBar,
    Toolbar,
    Container,
    Box,
    Stack,
    Card,
    CardContent,
    Typography,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Button,
    Radio,
    RadioGroup,
    FormControlLabel,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { convexAction } from "../../services/convexClient";
import { api } from "../../../convex/_generated/api";
import { PAYOS_CANCEL_URL, PAYOS_CHECKOUT_URL, PAYOS_RETURN_URL } from "../../constants/env";

const plans = [
    {
        id: "basic",
        tier: "Basic",
        name: "Cơ bản",
        price: "49,000",
        duration: "/tháng",
        suitable: "Quản lý 5-15 phòng",
        features: [
            "Quản lý tối đa 1 tòa nhà",
            "Quản lý tối đa 15 phòng",
            "Tự động nhắc nhở hạn tiền thuê nhà",
            "Quản lý người thuê",
            "Báo cáo hóa đơn cơ bản (PDF/Excel)",
        ],
        highlight: true,
    },
    {
        id: "professional",
        tier: "Pro",
        name: "Chuyên nghiệp",
        price: "79,000",
        duration: "/tháng",
        suitable: "Chủ nhà có hơn 15 phòng",
        features: [
            "Bao gồm toàn bộ tính năng gói Cơ bản",
            "Quản lý nhiều tòa nhà",
            "Không giới hạn số phòng",
            "Hợp đồng điện tử",
            "Báo cáo sự cố qua chat",
            "AI phân tích hình ảnh tình trạng thiết bị",
        ],
        highlight: false,
    },
];

function planFromParam(selected) {
    if (!selected) return null;
    const norm = String(selected).toLowerCase();
    if (norm === "pro" || norm === "professional") return plans[1];
    if (norm === "basic") return plans[0];
    return null;
}

export default function PackPaymentPage() {
    const navigate = useNavigate();
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const selected = params.get("selected");
    // const [openUICustomLoading, setOpenUICustomLoading] = useState(false);
    const [redirectLoading, setRedirectLoading] = useState(false);
    // const [openDialogLoading, setOpenDialogLoading] = useState(false);

    const initial = useMemo(() => planFromParam(selected)?.id ?? "", [selected]);
    const [selectedId, setSelectedId] = useState(initial);

    const selectedPlanIdRef = useRef("");
    const selectedPlanTierRef = useRef("");
    const priceRef = useRef(0);

    const CHECKOUT_URL = PAYOS_CHECKOUT_URL;
    const RETURN_URL = PAYOS_RETURN_URL;
    const CANCEL_URL = PAYOS_CANCEL_URL;

    useEffect(() => {
        setSelectedId(planFromParam(selected)?.id ?? "");
    }, [selected]);

    const selectedPlan = useMemo(
        () => plans.find((p) => p.id === selectedId) || planFromParam(selected) || null,
        [selectedId, selected],
    );

    useEffect(() => {
        if (selectedPlan) {
            selectedPlanIdRef.current = selectedPlan.id;
            selectedPlanTierRef.current = selectedPlan.tier;
            // strip non-digits to get numeric price (e.g., "49,000" -> 49000)
            priceRef.current = Number(String(selectedPlan.price).replace(/[^\d]/g, ""));
        } else {
            selectedPlanIdRef.current = "";
            selectedPlanTierRef.current = "";
            priceRef.current = 0;
        }
    }, [selectedPlan]);

    const handleChoose = (id) => setSelectedId(id);
    const handleBack = () => navigate(-1);

    const getCheckoutUrl = async () => {
        // build order body
        // send request to backend
        // receive checkout url
        try {
            const orderData = {
                tier: selectedPlanTierRef.current,
                price: Number(priceRef.current),
                returnUrl: RETURN_URL,
                cancelUrl: CANCEL_URL,
            };
            let response = await convexAction(api.functions.payos.createPayOSCheckoutUrl, { orderData });
            // if (!response || response.error != 0) throw new Error("Call Api failed: ");
            console.log("che", response);
            const checkoutUrl = response;
            window.location.href = checkoutUrl;
        } catch (error) {
            console.error("Error redirecting to payment link:", error);
            alert("Failed to redirect to payment link");
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: (t) => t.palette.background.default }}>
            <AppBar position="static" elevation={0} color="transparent">
                <Toolbar sx={{ gap: 1 }}>
                    <Button startIcon={<ArrowBackRoundedIcon />} onClick={handleBack} sx={{ textTransform: "none" }}>
                        Trở về
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <Chip
                        size="small"
                        color="secondary"
                        icon={<StarRoundedIcon />}
                        label="Chọn gói & thanh toán"
                        sx={{ fontWeight: 500 }}
                    />
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ py: 4 }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Stack spacing={3}>
                            <Typography variant="h4" fontWeight={800} textAlign="center">
                                Xác nhận gói dịch vụ
                            </Typography>
                            <Typography variant="body1" color="text.secondary" textAlign="center">
                                Tài khoản mới bắt đầu ở gói Free với đầy đủ tính năng của gói Cơ bản trong 30 ngày.{" "}
                                <br />
                                Khi hết hạn hoặc chạm giới hạn, bạn có thể nâng cấp để tiếp tục sử dụng.
                            </Typography>

                            {!selectedPlan && (
                                <RadioGroup value={selectedId} onChange={(_, val) => handleChoose(val)} name="plan">
                                    {plans.map((p) => (
                                        <Box
                                            key={p.id}
                                            sx={{
                                                border: "1px solid",
                                                borderColor: (t) =>
                                                    selectedId === p.id ? t.palette.primary.main : t.palette.divider,
                                                borderRadius: 2,
                                                p: 2,
                                                mb: 2,
                                                cursor: "pointer",
                                            }}
                                            onClick={() => handleChoose(p.id)}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <FormControlLabel
                                                    value={p.id}
                                                    control={<Radio />}
                                                    label=""
                                                    sx={{ mr: 1 }}
                                                />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography fontWeight={700}>{p.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {p.suitable}
                                                    </Typography>
                                                </Box>
                                                <Typography fontWeight={800}>
                                                    {p.price}
                                                    <Typography component="span" color="text.secondary">
                                                        {p.duration}
                                                    </Typography>
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    ))}
                                </RadioGroup>
                            )}

                            {selectedPlan && (
                                <Box>
                                    <Typography variant="h5" fontWeight={800}></Typography>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Plan Overview */}
                                    <Stack spacing={1}>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography fontWeight={600}>Gói đã chọn</Typography>
                                            <Typography>{selectedPlan.name}</Typography>
                                        </Stack>

                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography fontWeight={600}>Phí dịch vụ</Typography>
                                            <Typography>
                                                {selectedPlan.price} đ {selectedPlan.duration}
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography fontWeight={600}>Ưu đãi</Typography>
                                            <Typography color="success.main">0 đ</Typography>
                                        </Stack>
                                    </Stack>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Included Features */}
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                        Bao gồm:
                                    </Typography>
                                    <List dense sx={{ py: 0 }}>
                                        {selectedPlan.features.map((f, i) => (
                                            <ListItem key={i} sx={{ py: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    <CheckRoundedIcon color="success" fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primaryTypographyProps={{ variant: "body2" }}
                                                    primary={f}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Total */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h6" fontWeight={800}>
                                            Tổng thanh toán
                                        </Typography>
                                        <Typography variant="h5" fontWeight={900} color="primary">
                                            {selectedPlan.price} đ
                                        </Typography>
                                    </Stack>

                                    {/* Action Buttons */}
                                    <Stack spacing={1.5} direction={{ xs: "column", sm: "row" }} sx={{ mt: 3 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={getCheckoutUrl}
                                            disabled={redirectLoading}
                                            className="!bg-[#5D5FEF] !normal-case"
                                            fullWidth
                                            sx={{ textTransform: "none", fontWeight: 700 }}
                                        >
                                            Tiếp tục thanh toán
                                            {redirectLoading ? (
                                                <>
                                                    {" "}
                                                    &nbsp; <CircularProgress className="!text-white" size={20} />
                                                </>
                                            ) : (
                                                ""
                                            )}
                                        </Button>
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Stack, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import GeneralHeader from "./GeneralHeader";
import GeneralFooter from "./GeneralFooter";
import { useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useRouteError } from "react-router-dom";
import { Typography, Button } from "@mui/material";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function LandlordLayout() {
    return (
        <ConvexProvider client={convex}>
            <GeneralHeader />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "100vh",
                    paddingTop: "75px",
                    position: "relative",
                }}
            >
                <Stack
                    direction="row"
                    spacing={4}
                    sx={{
                        flex: 1,
                        px: { xs: 1.5, md: 3 },
                        py: 2,
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <Sidebar />
                    <Box
                        component="main"
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            position: "relative",
                            zIndex: 1,
                        }}
                    >
                        <Outlet />
                    </Box>
                </Stack>
            </Box>
            <GeneralFooter />
        </ConvexProvider>
    );
}

export default LandlordLayout;

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const isInvoiceSection = /^\/landlord\/invoices(\/|$)/.test(location.pathname);
    const isDormSection = /^\/landlord\/dorms(\/|$)/.test(location.pathname) && !isInvoiceSection;
    const isChatSection = /^\/landlord\/chat(\/|$)/.test(location.pathname);

    const items = useMemo(
        () => [
            { key: "dorms", label: "Quản lý Phòng trọ", to: "/landlord/dorms", icon: <HomeRoundedIcon /> },
            { key: "invoices", label: "Quản lý Hóa đơn", to: "/landlord/invoices", icon: <ReceiptLongRoundedIcon /> },
            // { key: "chat", label: "Chat", to: "/landlord/chat", icon: <SettingsRoundedIcon /> },
        ],
        [],
    );

    const isActive = (item) => {
        if (item.key === "invoices") return isInvoiceSection;
        if (item.key === "dorms") return isDormSection;
        if (item.key === "chat") return isChatSection;
        return location.pathname.startsWith(item.to);
    };

    const handleNavigate = (item) => {
        if (item.to) navigate(item.to);
    };

    return (
        <Box
            component="aside"
            sx={{
                width: { xs: 0, md: 240 },
                display: { xs: "none", md: "block" },
                flexShrink: 0,
                position: "sticky",
                top: 72,
                alignSelf: "flex-start",
                maxHeight: "calc(100vh - 72px)",
            }}
        >
            <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {items.map((item) => {
                    const active = isActive(item);
                    return (
                        <ListItemButton
                            key={item.key}
                            onClick={() => handleNavigate(item)}
                            sx={{
                                borderRadius: 2,
                                py: 1.5,
                                boxShadow: active ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
                                bgcolor: active ? "#f1e4ff" : "transparent",
                                color: active ? "#5e35b1" : "inherit",
                                "&:hover": {
                                    bgcolor: active ? "#e9d6ff" : "rgba(0,0,0,0.04)",
                                },
                                transition: "background-color .18s, box-shadow .18s",
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 36,
                                    color: active ? "#6a1b9a" : "rgba(0,0,0,0.54)",
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                        </ListItemButton>
                    );
                })}
            </List>
        </Box>
    );
}

export function RouteErrorBoundary() {
    const err = useRouteError();
    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Có lỗi xảy ra
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {(err && (err.statusText || err.message)) || "Unknown error"}
            </Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>
                Tải lại
            </Button>
        </Box>
    );
}

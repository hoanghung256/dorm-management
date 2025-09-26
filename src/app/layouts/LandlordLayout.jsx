import { Outlet } from "react-router-dom";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Stack, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import GeneralHeader from "./GeneralHeader";
import GeneralFooter from "./GeneralFooter";

function LandlordLayout() {
    return (
        <>
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
        </>
    );
}

export default LandlordLayout;

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const items = useMemo(
        () => [
            { key: "rooms", label: "Quản lí phòng trọ", to: "/landlord/dorms", icon: <HomeRoundedIcon /> },
            { key: "reports", label: "Báo cáo hóa đơn", to: null, icon: <ReceiptLongRoundedIcon /> },
            { key: "info", label: "Thông tin phòng trọ", to: null, icon: <SettingsRoundedIcon /> },
        ],
        [],
    );

    const isActive = (to) => (to ? location.pathname.startsWith(to) : false);

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
                {items.map(({ key, label, to, icon }) => {
                    const active = isActive(to);
                    return (
                        <ListItemButton
                            key={key}
                            onClick={() => to && navigate(to)}
                            disabled={!to}
                            sx={{
                                borderRadius: 2,
                                py: 1.5,
                                boxShadow: active ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                                bgcolor: active ? "#f1e4ff" : "transparent",
                                color: active ? "#5e35b1" : "inherit",
                                "&:hover": { bgcolor: active ? "#e9d6ff" : "rgba(0,0,0,0.04)" },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36, color: active ? "#6a1b9a" : "rgba(0,0,0,0.54)" }}>
                                {icon}
                            </ListItemIcon>
                            <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600 }} />
                        </ListItemButton>
                    );
                })}
            </List>
        </Box>
    );
}

export { Sidebar };

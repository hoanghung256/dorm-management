import { Toolbar, Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import GeneralHeader, { NAVBAR_HEIGHT } from "./GeneralHeader";
import GeneralFooter from "./GeneralFooter";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Stack, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

function GeneralLayout() {
    return (
        <>
            <GeneralHeader />

            <Toolbar sx={{ minHeight: NAVBAR_HEIGHT }} />
            {/* <SideBar /> */}

            <Box
                sx={{
                    display: "flex",
                    minHeight: "100vh",
                    flexDirection: "column",
                    bgcolor: "background.default",
                    position: "relative",
                }}
            >
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        py: 0,
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <Container maxWidth="lg" sx={{ padding: 0 }}>
                        <Outlet />
                    </Container>
                </Box>
            </Box>

            <GeneralFooter />
        </>
    );
}

export default GeneralLayout;

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const items = useMemo(
        () => [
            { key: "rooms", label: "Quản lí phòng trọ", to: "/landlord/dorms", icon: <HomeRoundedIcon /> },
            { key: "reports", label: "Báo cáo hóa đơn", to: "/landlord/invoices", icon: <ReceiptLongRoundedIcon /> },
            { key: "info", label: "Thông tin phòng trọ", to: null, icon: <SettingsRoundedIcon /> },
        ],
        [],
    );

    const isActive = (to) => (to ? location.pathname.startsWith(to) : false);

    return (
        <Box component="aside" sx={{ width: 260, flexShrink: 0 }}>
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

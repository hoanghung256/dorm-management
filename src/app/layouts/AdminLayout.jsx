import React, { useMemo, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Stack, List, ListItemButton, ListItemIcon, ListItemText, Typography, Button } from "@mui/material";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import GeneralHeader from "./GeneralHeader";
import GeneralFooter from "./GeneralFooter";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import useConvexUserData from "../../hooks/useConvexUserData";
import { useTheme } from "@mui/material";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function AdminLayout() {
    const user = useConvexUserData();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();

    useEffect(() => {
        // If we don't have user data yet, send to login-callback to ensure user is created
        if (user === null) {
            // If already on the login-callback page, don't redirect again
            if (location.pathname !== "/login-callback") navigate("/login-callback");
            return;
        }
        // If we have a user but not admin, redirect home
        if (user && user.role !== "admin") {
            navigate("/");
        }
    }, [user, navigate, location.pathname]);

    return (
        <ConvexProvider client={convex}>
            <GeneralHeader />

            <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingTop: "75px" }}>
                <Stack direction="row" spacing={4} sx={{ flex: 1, px: { xs: 1.5, md: 3 }, py: 2 }}>
                    <AdminSidebar />
                    <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
                        <Outlet />
                    </Box>
                </Stack>
            </Box>

            <GeneralFooter />
        </ConvexProvider>
    );
}

export default AdminLayout;

function AdminSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const items = useMemo(
        () => [
            { key: "users", label: "Users", to: "/admin", icon: <PeopleOutlineRoundedIcon /> },
            { key: "subscriptions", label: "Subscriptions", to: "/admin/subscriptions", icon: <PaymentsRoundedIcon /> },
            { key: "revenue", label: "Revenue", to: "/admin/revenue", icon: <InsightsRoundedIcon /> },
        ],
        [],
    );

    const isActive = (item) => location.pathname === item.to || location.pathname.startsWith(item.to + "/");

    return (
        <Box
            component="aside"
            sx={{
                width: { xs: 0, md: 240 },
                display: { xs: "none", md: "block" },
                flexShrink: 0,
                position: "sticky",
                top: 72,
            }}
        >
            <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {items.map((item) => {
                    const active = isActive(item);
                    return (
                        <ListItemButton
                            key={item.key}
                            onClick={() => navigate(item.to)}
                            sx={{ borderRadius: 2, py: 1.5, bgcolor: active ? "#f1e4ff" : "transparent" }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                        </ListItemButton>
                    );
                })}
            </List>
        </Box>
    );
}

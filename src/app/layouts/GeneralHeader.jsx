import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    Stack,
    Button,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { UserButton } from "@clerk/clerk-react";
import React, { useState } from "react";
import useClerkUserData from "../../hooks/useClerkUserData";
import webIcon from "../../assets/icons/tubbies-icon.png";

const NAVBAR_HEIGHT = 75;

export default function GeneralHeader() {
    const { user } = useClerkUserData();
    const [activeButton, setActiveButton] = useState("home");
    const [defaultActive, setDefaultActive] = useState("home");
    const [mobileOpen, setMobileOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { label: "Trang chủ", value: "home", href: "/" },
        { label: "Liên hệ", value: "contact", href: "/#contact" },
        { label: "Về chúng tôi", value: "about", href: "/#about" },
    ];

    if (!user) {
        menuItems.push({ label: "Đăng nhập", value: "login", href: "/login" });
    }

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.03)",
                    height: `${NAVBAR_HEIGHT}px`,
                    width: "100%",
                    zIndex: 1200,
                    top: 0,
                    left: 0,
                    right: 0,
                }}
            >
                <Toolbar
                    sx={{
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                        minHeight: NAVBAR_HEIGHT,
                        height: `${NAVBAR_HEIGHT}px`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        px: { xs: 3, md: 12.5 },
                        position: "relative",
                        width: "100%",
                    }}
                >
                    {/* Logo Section */}
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                            fontSize: "17px",
                            fontWeight: 700,
                            letterSpacing: "0.1px",
                            justifyContent: "flex-start",
                        }}
                    >
                        <Box component="img" src={webIcon} alt="Logo" sx={{ width: "60px", height: "60px" }} />
                        <Box
                            sx={{
                                display: "flex",
                                minWidth: "240px",
                                margin: "auto 0",
                                alignItems: "flex-start",
                                justifyContent: "flex-start",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    color: "black",
                                    fontSize: "17px",
                                    letterSpacing: "0.10px",
                                    lineHeight: "normal",
                                }}
                            >
                                Dorm Management Solution
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Desktop Navigation */}
                    {!isMobile && (
                        <Stack
                            direction="row"
                            spacing={4}
                            alignItems="center"
                            onMouseLeave={() => setActiveButton(defaultActive)}
                            sx={{ fontSize: "16px", fontWeight: 500 }}
                        >
                            {menuItems.map((item) => (
                                <Button
                                    key={item.value}
                                    href={item.href}
                                    className={
                                        activeButton === item.value ? "nav-button-active" : "nav-button-inactive"
                                    }
                                    onMouseEnter={() => setActiveButton(item.value)}
                                    onFocus={() => setActiveButton(item.value)}
                                    onClick={() => setDefaultActive(item.value)}
                                    sx={{
                                        minWidth: "98px",
                                        height: "40px",
                                        px: 2,
                                        borderRadius: "8px",
                                        fontWeight: 700,
                                        fontSize: "16px",
                                        textTransform: "none",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                            {user && (
                                <Box sx={{ position: "relative", zIndex: 1250 }}>
                                    <UserButton afterSignOutUrl="/" />
                                </Box>
                            )}
                        </Stack>
                    )}

                    {/* Mobile Hamburger Icon */}
                    {isMobile && (
                        <IconButton
                            edge="end"
                            color="#7b1fa2"
                            aria-label="menu"
                            onClick={handleDrawerToggle}
                            sx={{ ml: 1 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    "& .MuiDrawer-paper": {
                        width: 240,
                        paddingTop: `${NAVBAR_HEIGHT}px`,
                        boxSizing: "border-box",
                        backgroundColor: "#7b1fa2",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                    },
                }}
            >
                <List sx={{ color: "white", backgroundColor: "#7b1fa2" }}>
                    {menuItems.map((item) => (
                        <ListItem key={item.value} disablePadding>
                            <ListItemButton
                                component="a"
                                href={item.href}
                                onClick={() => {
                                    setDefaultActive(item.value);
                                    setActiveButton(item.value);
                                    setMobileOpen(false);
                                }}
                            >
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                    {user && (
                        <ListItem>
                            <UserButton afterSignOutUrl="/" />
                        </ListItem>
                    )}
                </List>
            </Drawer>
        </>
    );
}

export { NAVBAR_HEIGHT };

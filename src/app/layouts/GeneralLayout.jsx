import { AppBar, Toolbar, Box, Container, Typography, IconButton, Stack, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { UserButton } from "@clerk/clerk-react";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import useClerkUserData from "../../hooks/useClerkUserData";
import webIcon from "../../assets/icons/tubbies-icon.png";

const NAVBAR_HEIGHT = 75; // Updated to match design height

function GeneralLayout() {
    const { user } = useClerkUserData();
    const [activeButton, setActiveButton] = useState("home");
    const [defaultActive, setDefaultActive] = useState("home");

    return (
        <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: "column", bgcolor: "background.default" }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.03)",
                    height: `${NAVBAR_HEIGHT}px`,
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
                        <Box
                            component="img"
                            src={webIcon}
                            alt="Logo"
                            sx={{
                                width: "60px",
                                height: "60px",
                            }}
                        />
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
                                    fontFamily: "'Poppins', Helvetica",
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

                    {/* Navigation Section */}
                    <Stack
                        direction="row"
                        spacing={4}
                        alignItems="center"
                        onMouseLeave={() => setActiveButton(defaultActive)}
                        sx={{
                            fontSize: "16px",
                            fontWeight: 500,
                        }}
                    >
                        <Button
                            href="/"
                            className={activeButton === "home" ? "nav-button-active" : "nav-button-inactive"}
                            onMouseEnter={() => setActiveButton("home")}
                            onFocus={() => setActiveButton("home")}
                            onClick={() => setDefaultActive("home")}
                            sx={{
                                minWidth: "98px",
                                height: "40px",
                                px: 2,
                                borderRadius: "8px",
                                fontFamily: "'Poppins', Helvetica",
                                fontWeight: 700,
                                fontSize: "16px",
                                textTransform: "none",
                                transition: "all 0.2s",
                            }}
                        >
                            Trang chủ
                        </Button>
                        <Button
                            href="#contact"
                            className={activeButton === "contact" ? "nav-button-active" : "nav-button-inactive"}
                            onMouseEnter={() => setActiveButton("contact")}
                            onFocus={() => setActiveButton("contact")}
                            onClick={() => setDefaultActive("contact")}
                            sx={{
                                minWidth: "98px",
                                height: "40px",
                                px: 2,
                                borderRadius: "8px",
                                fontFamily: "'Poppins', Helvetica",
                                fontWeight: 700,
                                fontSize: "16px",
                                textTransform: "none",
                                transition: "all 0.2s",
                            }}
                        >
                            Liên hệ
                        </Button>
                        <Button
                            href="#about"
                            className={activeButton === "about" ? "nav-button-active" : "nav-button-inactive"}
                            onMouseEnter={() => setActiveButton("about")}
                            onFocus={() => setActiveButton("about")}
                            onClick={() => setDefaultActive("about")}
                            sx={{
                                minWidth: "98px",
                                height: "40px",
                                px: 2,
                                borderRadius: "8px",
                                fontFamily: "'Poppins', Helvetica",
                                fontWeight: 700,
                                fontSize: "16px",
                                textTransform: "none",
                                transition: "all 0.2s",
                            }}
                        >
                            Về chúng tôi
                        </Button>
                        {user ? (
                            <UserButton afterSignOutUrl="/" />
                        ) : (
                            <Button
                                href="/login"
                                className={activeButton === "login" ? "nav-button-active" : "nav-button-inactive"}
                                onMouseEnter={() => setActiveButton("login")}
                                onFocus={() => setActiveButton("login")}
                                onClick={() => setDefaultActive("login")}
                                sx={{
                                    minWidth: "98px",
                                    height: "40px",
                                    px: 2,
                                    borderRadius: "8px",
                                    fontFamily: "'Poppins', Helvetica",
                                    fontWeight: 700,
                                    fontSize: "16px",
                                    textTransform: "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                Đăng nhập
                            </Button>
                        )}
                    </Stack>
                </Toolbar>
            </AppBar>
            <Toolbar sx={{ minHeight: NAVBAR_HEIGHT }} /> {/* spacer below fixed AppBar */}
            <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>
            <Box
                component="footer"
                sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                    py: 3,
                    textAlign: "center",
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    © 2025 DormManagement. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
}

export default GeneralLayout;

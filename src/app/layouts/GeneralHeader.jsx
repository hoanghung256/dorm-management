import { AppBar, Toolbar, Box, Typography, Stack, Button } from "@mui/material";
import { UserButton } from "@clerk/clerk-react";
import { useState } from "react";
import useClerkUserData from "../../hooks/useClerkUserData";
import webIcon from "../../assets/icons/tubbies-icon.png";

const NAVBAR_HEIGHT = 75;

export default function GeneralHeader() {
    const { user } = useClerkUserData();
    const [activeButton, setActiveButton] = useState("home");
    const [defaultActive, setDefaultActive] = useState("home");

    return (
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

                {/* Navigation Section */}
                <Stack
                    direction="row"
                    spacing={4}
                    alignItems="center"
                    onMouseLeave={() => setActiveButton(defaultActive)}
                    sx={{ fontSize: "16px", fontWeight: 500 }}
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
                            fontWeight: 700,
                            fontSize: "16px",
                            textTransform: "none",
                            transition: "all 0.2s",
                        }}
                    >
                        Về chúng tôi
                    </Button>
                    {user ? (
                        <Box sx={{ position: "relative", zIndex: 1250 }}>
                            <UserButton afterSignOutUrl="/" />
                        </Box>
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
    );
}

export { NAVBAR_HEIGHT };

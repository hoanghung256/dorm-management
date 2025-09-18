import { AppBar, Toolbar, Box, Container, Typography, IconButton, Stack } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { UserButton } from "@clerk/clerk-react";
import { Outlet } from "react-router-dom";

const NAVBAR_HEIGHT = 64;

function GeneralLayout() {
    return (
        <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: "column", bgcolor: "background.default" }}>
            <AppBar
                position="fixed"
                elevation={1}
                color="primary"
                sx={{
                    backgroundImage: (theme) =>
                        `linear-gradient(200deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }}
            >
                <Toolbar sx={{ minHeight: NAVBAR_HEIGHT, display: "flex", justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton
                            edge="start"
                            color="inherit"
                            size="large"
                            aria-label="menu"
                            sx={{ display: { md: "none" } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" fontWeight={600} sx={{ letterSpacing: 0.5 }}>
                            DormManagement
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                        {/* Placeholder for future nav items */}
                        <UserButton afterSignOutUrl="/login" />
                    </Stack>
                </Toolbar>
            </AppBar>
            <Toolbar sx={{ minHeight: NAVBAR_HEIGHT }} /> {/* spacer below fixed AppBar */}
            <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
}

export default GeneralLayout;

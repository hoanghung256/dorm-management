import { Outlet } from "react-router-dom";
import { Box, Container, Toolbar } from "@mui/material";
import GeneralHeader, { NAVBAR_HEIGHT } from "./GeneralHeader";
import GeneralFooter from "./GeneralFooter";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function RenterLayout() {
    return (
        <ConvexProvider client={convex}>
            <GeneralHeader />

            <Toolbar sx={{ minHeight: NAVBAR_HEIGHT }} />

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
        </ConvexProvider>
    );
}

export default RenterLayout;

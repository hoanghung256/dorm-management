import { Box, Typography } from "@mui/material";

export default function GeneralFooter() {
    return (
        <Box
            component="footer"
            sx={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                borderTop: "1px solid rgba(0, 0, 0, 0.1)",
                py: 3,
                textAlign: "center",
                position: "relative",
                zIndex: 1100,
                width: "100%",
            }}
        >
            <Typography variant="body2" color="text.secondary">
                © 2025 DormManagement. All rights reserved.
            </Typography>
        </Box>
    );
}

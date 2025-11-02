import { useState } from "react";
import { Box, TextField, InputAdornment, Button, Menu, MenuItem } from "@mui/material";
import { Search as SearchIcon, FilterList as FilterIcon } from "@mui/icons-material";

/**
 * SearchRoomForm
 * - search by room code or renter name
 * - filter by status (all, vacant, occupied, maintenance)
 */
export default function SearchRoomForm({ search = "", status = "all", onSearchChange, onStatusChange }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);
    const handleCloseMenu = () => setAnchorEl(null);

    const handlePickStatus = (value) => {
        onStatusChange?.(value);
        handleCloseMenu();
    };

    const statusLabel = {
        all: "Tất cả trạng thái",
        vacant: "Trống",
        occupied: "Đang cho thuê",
        maintenance: "Bảo trì",
    }[status];

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                gap: 1.5,
                alignItems: "center",
                mb: 2,
                width: "100%",
            }}
        >
            <TextField
                value={search}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Tìm phòng theo số phòng hoặc người thuê"
                size="small"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                }}
            />

            <Button
                variant="outlined"
                onClick={handleOpenMenu}
                startIcon={<FilterIcon />}
                size="small"
                sx={{
                    whiteSpace: "nowrap",
                    justifySelf: { sm: "end" },
                    minWidth: "auto",
                    px: 2,
                }}
            >
                Lọc
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleCloseMenu}
                disablePortal={true}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                }}
                sx={{
                    zIndex: 1300,
                    "& .MuiPaper-root": {
                        mt: 0.5,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        minWidth: 200,
                    },
                }}
            >
                <MenuItem onClick={() => handlePickStatus("all")}>Tất cả trạng thái</MenuItem>
                <MenuItem onClick={() => handlePickStatus("vacant")}>Trống</MenuItem>
                <MenuItem onClick={() => handlePickStatus("occupied")}>Đang cho thuê</MenuItem>
                <MenuItem onClick={() => handlePickStatus("maintenance")}>Bảo trì</MenuItem>
            </Menu>
        </Box>
    );
}

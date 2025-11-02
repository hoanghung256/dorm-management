import React, { useMemo, useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    CircularProgress,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Chip,
    Stack,
    Button,
} from "@mui/material";
import { convexQueryOneTime } from "../../services/convexClient";
import { api } from "../../../convex/_generated/api";

// Admin dashboard: list all users with non-sensitive fields and subscription summary for landlords
export default function AdminDashboard() {
    const [users, setUsers] = useState(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        (async () => {
            try {
                const data = await convexQueryOneTime(api.functions.admin.listAllUsersForAdmin);
                if (mounted) setUsers(data || []);
            } catch (e) {
                console.error("Failed to fetch admin users:", e);
                if (mounted) setUsers([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => (mounted = false);
    }, []);

    const [filterRole, setFilterRole] = useState("all");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!users) return null;
        const q = users.filter((u) => {
            if (filterRole !== "all" && u.role !== filterRole) return false;
            if (!search) return true;
            const s = search.toLowerCase();
            return (
                (u.name || "").toLowerCase().includes(s) ||
                (u.email || "").toLowerCase().includes(s) ||
                (u._id || "").toString().toLowerCase().includes(s)
            );
        });
        return q;
    }, [users, filterRole, search]);

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Admin — Users
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                    <TextField
                        label="Search by name, email or id"
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ minWidth: 240 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id="filter-role-label">Role</InputLabel>
                        <Select
                            labelId="filter-role-label"
                            value={filterRole}
                            label="Role"
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="landlord">Landlords</MenuItem>
                            <MenuItem value="renter">Renters</MenuItem>
                            <MenuItem value="admin">Admins</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ flex: 1 }} />

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                            setSearch("");
                            setFilterRole("all");
                        }}
                    >
                        Reset
                    </Button>
                </Stack>
            </Paper>

            <Paper>
                <TableContainer>
                    {loading ? (
                        <Box p={4} display="flex" justifyContent="center">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Subscription / Summary</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(filtered || []).map((u) => (
                                    <TableRow key={u._id}>
                                        <TableCell>{u.name || "—"}</TableCell>
                                        <TableCell>{u.email || "—"}</TableCell>
                                        <TableCell>
                                            <Chip label={u.role || "unknown"} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            {u.role === "landlord" && u.subscription ? (
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2">
                                                        Tier:{" "}
                                                        <strong>{u.subscription.subscriptionTier || "Free"}</strong>
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Dorm limit: {u.subscription.dormLimit ?? "unlimited"} — Room
                                                        limit: {u.subscription.roomLimit ?? "unlimited"}
                                                    </Typography>
                                                </Stack>
                                            ) : u.role === "renter" && u.renter ? (
                                                <Typography variant="body2">
                                                    Active: {u.renter.active ? "Yes" : "No"}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    —
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <Button size="small" variant="outlined">
                                                    Details
                                                </Button>
                                                <Button size="small" color="error" variant="outlined">
                                                    Disable
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(filtered || []).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                No users match the filter.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>
            </Paper>
        </Box>
    );
}

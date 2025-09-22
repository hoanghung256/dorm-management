import { useState, useMemo, useEffect } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    IconButton,
    Stack,
    Paper,
    Chip,
    Tooltip,
    Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { api } from "../../../convex/_generated/api";
import useConvexUserData from "../../hooks/useConvexUserData";
import { convexQueryOneTime } from "../../services/convexClient";
import CreateDormModal from "./CreateDormModal";

function ManageDormPage() {
    const user = useConvexUserData();

    const [pageData, setPageData] = useState({ items: [], page: 1, pageSize: 5, total: 0, totalPages: 0 });
    const [openDialog, setOpenDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (user?.detail?._id) {
            getDorms();
        }
    }, [user]);

    const getDorms = async () => {
        const res = await convexQueryOneTime(api.functions.dorms.listDormsByLandlord, {
            landlordId: user.detail._id,
            page: 1,
            pageSize: 10,
            search: searchTerm || undefined,
        });
        setPageData(res);
    };

    const openCreate = () => {
        setOpenDialog(true);
    };

    return (
        <>
            <CreateDormModal
                landlordId={user?.detail?._id}
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                refresh={getDorms}
            />
            <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h5" fontWeight={600}>
                        Danh sách Nhà Trọ
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Làm mới">
                            <IconButton onClick={getDorms}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={openCreate}
                            disabled={!user?.detail?._id}
                        >
                            Thêm
                        </Button>
                    </Stack>
                </Stack>

                {pageData?.items.length === 0 && user?.detail?._id && (
                    <Typography variant="body2" sx={{ py: 2 }}>
                        Chưa có trọ nào.
                    </Typography>
                )}

                <Stack spacing={2}>
                    {pageData?.items.map((d) => (
                        <Paper
                            key={d._id}
                            variant="outlined"
                            sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" fontSize={18}>
                                    {d.name}
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Sửa">
                                        <IconButton size="small" onClick={() => openEdit(d)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(d)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Địa chỉ: {d.address || "-"}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Chip
                                    size="small"
                                    label={`Ngày chốt: ${d.involveDueDate}`}
                                    color="primary"
                                    variant="outlined"
                                />
                                {d.createdAt && (
                                    <Chip
                                        size="small"
                                        label={
                                            "Tạo: " +
                                            new Date(d.createdAt).toLocaleDateString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })
                                        }
                                        variant="outlined"
                                    />
                                )}
                            </Stack>
                        </Paper>
                    ))}
                </Stack>

                {/* {nextCursor && (
                <Box mt={3} textAlign="center">
                    <Button onClick={handleLoadMore} variant="outlined">
                        Tải thêm
                    </Button>
                </Box>
            )} */}

                <Divider sx={{ mt: 4 }} />
            </Box>
        </>
    );
}

export default ManageDormPage;

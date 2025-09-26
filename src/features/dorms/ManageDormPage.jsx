import { useState, useMemo, useEffect, use } from "react";
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
import BuildIcon from "@mui/icons-material/Build";
import HomeIcon from "@mui/icons-material/Home";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom"; // Add Button
import { useNavigate } from "react-router-dom"; // Add Button
import { api } from "../../../convex/_generated/api";
import useConvexUserData from "../../hooks/useConvexUserData";
import { convexMutation, convexQueryOneTime } from "../../services/convexClient";
import CreateDormModal from "./CreateDormModal";
import AddAmenitiesModal from "./AddAmenitiesModal";
import ConfirmModal from "../../components/ConfirmModal";

function ManageDormPage() {
    const user = useConvexUserData();
    const navigate = useNavigate(); // Add Button

    const [pageData, setPageData] = useState({ items: [], page: 1, pageSize: 5, total: 0, totalPages: 0 });
    const [isShowEditDormModal, setIsShowEditDormModal] = useState(false);
    // const [searchTerm, setSearchTerm] = useState("");
    const [editDormId, setEditDormId] = useState(null);
    const [isShowEditAmenitesModal, setIsShowEditAmenitesModal] = useState(false);
    const [editAmenities, setEditAmenities] = useState([]);
    const [editDorm, setEditDorm] = useState(null);
    const [isShowConfirmDeleteModal, setIsShowConfirmDeleteModal] = useState(false);
    const [deletingDormId, setDeletingDormId] = useState(null);

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
            search: undefined,
        });
        setPageData(res);
    };

    const openCreate = () => {
        setIsShowEditDormModal(true);
        setEditDorm(null);
    };

    const openEditAmenities = (dormId, dormAmenities) => {
        setIsShowEditAmenitesModal(true);
        setEditAmenities(dormAmenities || []);
        setEditDormId(dormId);
    };

    const openEditDorm = (dorm) => {
        setEditDorm(dorm);
        setIsShowEditDormModal(true);
    };

    const handleOpenDeleteConfirmModal = (dormId) => {
        setDeletingDormId(dormId);
        setIsShowConfirmDeleteModal(true);
    };

    const handleDelete = async () => {
        await convexMutation(api.functions.dorms.deleteDorm, { dormId: deletingDormId });
        setIsShowConfirmDeleteModal(false);
        setDeletingDormId(null);
        getDorms();
    };

    return (
        <>
            <CreateDormModal
                landlordId={user?.detail?._id}
                open={isShowEditDormModal}
                editDorm={editDorm}
                onClose={() => {
                    setIsShowEditDormModal(false);
                    setEditDorm(null);
                }}
                refresh={getDorms}
            />
            <AddAmenitiesModal
                dormId={editDormId}
                open={isShowEditAmenitesModal}
                existingAmenities={editAmenities}
                refresh={getDorms}
                onClose={() => {
                    setIsShowEditAmenitesModal(false);
                    setEditDormId(null);
                    setEditAmenities([]);
                }}
            />
            <ConfirmModal
                show={isShowConfirmDeleteModal}
                message={"Bạn có chắc muốn xóa trọ này? Hành động này không thể hoàn tác."}
                title={"Xác nhận xóa trọ"}
                onCancel={() => {
                    setIsShowConfirmDeleteModal(false);
                    setDeletingDormId(null);
                }}
                onConfirm={handleDelete}
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
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {/* NEW: Navigate to rooms of this dorm */}
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<MeetingRoomIcon fontSize="small" />}
                                        onClick={() => navigate(`/landlord/dorms/${d._id}`)}
                                    >
                                        Quản lý phòng
                                    </Button>
                                    <Tooltip title="Sửa vật tư">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            sx={{ mr: 1 }}
                                            onClick={() => openEditAmenities(d._id, d.amenities)}
                                        >
                                            <BuildIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Sửa thông tin trọ">
                                        <IconButton size="small" color="secondary" onClick={() => openEditDorm(d)}>
                                            <HomeIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleOpenDeleteConfirmModal(d._id)}
                                        >
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

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
    Grid,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
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
import SaveDormModal from "./SaveDormModal";
import SaveAmenitiesModal from "./SaveAmenitiesModal";
import ConfirmModal from "../../components/ConfirmModal";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";

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
            <SaveDormModal
                landlordId={user?.detail?._id}
                open={isShowEditDormModal}
                editDorm={editDorm}
                onClose={() => {
                    setIsShowEditDormModal(false);
                    setEditDorm(null);
                }}
                refresh={getDorms}
            />
            <SaveAmenitiesModal
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

                <Box
                    sx={{
                        padding: { xs: 0, md: 1 },
                    }}
                >
                    <Grid container spacing={4}>
                        {pageData?.items.map((d) => (
                            <Grid item sm={6} key={d._id}>
                                <Paper
                                    elevation={4}
                                    sx={{
                                        p: 3,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        justifyContent: "space-between",
                                        width: 400,
                                        minHeight: "340px",
                                        height: "100%",
                                        borderRadius: 5,
                                        position: "relative",
                                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                        transition: "transform 0.2s, box-shadow 0.2s",
                                        "&:hover": {
                                            transform: "translateY(-4px)",
                                            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                                        },
                                    }}
                                >
                                    {/* HÀNG 1: TÊN VÀ NÚT HÀNH ĐỘNG (HEADER CỦA CARD) */}
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        spacing={1}
                                    >
                                        {/* Tên Nhà Trọ */}
                                        <Typography variant="h6" fontSize={20} fontWeight={700} sx={{ pr: 1 }}>
                                            {d.name}
                                        </Typography>

                                        {/* Cụm nút Hành động (Quản lý phòng, Sửa, Xóa) */}
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                                            <ActionMenu
                                                d={d}
                                                navigateToRoomsPage={() => navigate(`/landlord/dorms/${d._id}`)}
                                                openEditAmenities={openEditAmenities}
                                                openEditDorm={openEditDorm}
                                                handleDelete={handleDelete}
                                            />
                                        </Stack>
                                    </Stack>
                                    <Divider /> {/* Đường phân cách mỏng */}
                                    {/* BỐ CỤC DỌC MỚI CHO THÔNG TIN CHI TIẾT */}
                                    <Stack spacing={3}>
                                        {/* 1. Địa chỉ */}
                                        <Stack spacing={0.5}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                Địa chỉ
                                            </Typography>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Box
                                                    component="span"
                                                    sx={{ fontSize: "1rem", color: "text.secondary" }}
                                                >
                                                    📍
                                                </Box>
                                                <Typography variant="body1">{d.address || "-"}</Typography>
                                            </Stack>
                                        </Stack>

                                        {/* 3. Thông tin Chip (Ngày chốt và Ngày tạo) */}
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }} // Xếp ngang trên màn hình lớn, xếp dọc trên màn hình nhỏ
                                            justifyContent="space-between"
                                            alignItems={{ xs: "flex-start", sm: "flex-end" }}
                                            spacing={2}
                                            sx={{ mt: "auto" }} // ĐẨY XUỐNG DƯỚI CÙNG
                                        >
                                            {/* Cột Trái: Thông tin Chip (Ngày chốt và Ngày tạo) */}
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                    Thông tin ngày
                                                </Typography>
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                    <Chip
                                                        size="small"
                                                        label={
                                                            d.involveDueDate
                                                                ? `Chốt ngày ${d.involveDueDate} hàng tháng`
                                                                : "Ngày chốt: Chưa đặt"
                                                        }
                                                        variant="filled"
                                                        sx={{ width: "fit-content", height: 24, fontSize: "0.8rem" }}
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
                                                            sx={{
                                                                width: "fit-content",
                                                                height: 24,
                                                                fontSize: "0.8rem",
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

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

function ActionMenu({ d, openEditAmenities, openEditDorm, handleDelete, navigateToRoomsPage }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Tooltip title="Tùy chọn">
                <IconButton
                    size="small"
                    onClick={handleClick}
                    aria-controls={open ? "action-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                >
                    <MoreVertIcon />
                </IconButton>
            </Tooltip>
            <Menu
                id="action-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: { minWidth: 160 },
                }}
            >
                <MenuItem onClick={navigateToRoomsPage}>
                    <ListItemIcon>
                        <MeetingRoomIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Quản lý phòng" />
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        openEditAmenities(d._id, d.amenities);
                        handleClose();
                    }}
                >
                    <ListItemIcon>
                        <BuildIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Sửa vật tư" />
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        openEditDorm(d);
                        handleClose();
                    }}
                >
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Sửa thông tin trọ" />
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        handleDelete(d);
                        handleClose();
                    }}
                >
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Xóa" />
                </MenuItem>
            </Menu>
        </>
    );
}

export default ManageDormPage;

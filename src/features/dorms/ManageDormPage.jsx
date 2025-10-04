import { useState, useEffect } from "react";
import {
    Box,
    Button,
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
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import useConvexUserData from "../../hooks/useConvexUserData";
import { convexMutation, convexQueryOneTime } from "../../services/convexClient";
import SaveDormModal from "./SaveDormModal";
import SaveAmenitiesModal from "./SaveAmenitiesModal";
import ConfirmModal from "../../components/ConfirmModal";

function ManageDormPage() {
    const user = useConvexUserData();
    const navigate = useNavigate();
    // NEW: helper to go to rooms page for a dorm
    const goToDormRooms = (dormId) => navigate(`/landlord/dorms/${dormId}`);

    const [pageData, setPageData] = useState({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 });
    const [isShowEditDormModal, setIsShowEditDormModal] = useState(false);
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
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                    width="100%"
                    maxWidth={990}
                >
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 0.5 }}>
                            Danh sách nhà trọ
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#7b1fa2", fontSize: "14px" }}>
                            Chọn nhà trọ để quản lý
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
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

                {pageData.items.length === 0 && user?.detail?._id && (
                    <Typography variant="body2" sx={{ py: 2 }}>
                        Chưa có trọ nào.
                    </Typography>
                )}
                <Box sx={{ p: { xs: 0, md: 1 } }}>
                    <Grid container spacing={3}>
                        {pageData.items.map((d) => (
                            <Grid item xs={12} sm={6} md={4} key={d._id}>
                                <Paper
                                    elevation={3}
                                    role="button"
                                    onClick={() => goToDormRooms(d._id)}
                                    sx={{
                                        p: 2.5,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 1.5,
                                        height: "100%",
                                        borderRadius: 4,
                                        position: "relative",
                                        boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
                                        transition: "transform 0.2s, box-shadow 0.2s",
                                        background: "linear-gradient(180deg,#ffffff 0%,#f9f6fc 100%)",
                                        cursor: "pointer",
                                        "&:hover": {
                                            transform: "translateY(-3px)",
                                            boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                                        },
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                        <Typography variant="h6" fontSize={18} fontWeight={700} sx={{ pr: 1 }} noWrap>
                                            {d.name || "(Không tên)"}
                                        </Typography>
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                                            <ActionMenu
                                                d={d}
                                                openEditAmenities={openEditAmenities}
                                                openEditDorm={openEditDorm}
                                                handleDelete={() => handleOpenDeleteConfirmModal(d._id)}
                                            />
                                        </Stack>
                                    </Stack>
                                    <Box
                                        sx={{
                                            width: "100%",
                                            borderRadius: 3,
                                            overflow: "hidden",
                                            aspectRatio: "4 / 2.4",
                                            backgroundColor: "#ede7f6",
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src="/dorm-placeholder.svg"
                                            alt={d.name || "Dorm"}
                                            loading="lazy"
                                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    </Box>
                                    <Divider />
                                    <Stack spacing={1.25} sx={{ flexGrow: 1 }}>
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
                                                <Typography variant="body1" sx={{ fontSize: 14 }}>
                                                    {d.address || "(Chưa cập nhật)"}
                                                </Typography>
                                            </Stack>
                                        </Stack>
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
                                                    sx={{ width: "fit-content", height: 22, fontSize: "0.65rem" }}
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
                                                        sx={{ width: "fit-content", height: 22, fontSize: "0.65rem" }}
                                                    />
                                                )}
                                            </Stack>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
                <Divider sx={{ mt: 4 }} />
            </Box>
        </>
    );
}

function ActionMenu({ d, openEditAmenities, openEditDorm, handleDelete }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (e) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
    };
    const handleClose = (e) => {
        if (e) e.stopPropagation();
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
                PaperProps={{ sx: { minWidth: 160 } }}
                onClick={(e) => e.stopPropagation()} // block bubbling
            >
                <MenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        openEditAmenities(d._id, d.amenities);
                        handleClose(e);
                    }}
                >
                    <ListItemIcon>
                        <BuildIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Quản lý vật tư" />
                </MenuItem>
                <MenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        openEditDorm(d);
                        handleClose(e);
                    }}
                >
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Quản lý thông tin trọ" />
                </MenuItem>
                <MenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(); // already bound with dormId
                        handleClose(e);
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

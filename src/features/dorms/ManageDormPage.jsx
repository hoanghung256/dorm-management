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
    Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom"; // Add Button
import { useNavigate } from "react-router-dom"; // Add Button
import { api } from "../../../convex/_generated/api";
import useConvexUserData from "../../hooks/useConvexUserData";
import { convexQueryOneTime } from "../../services/convexClient";
import CreateDormModal from "./CreateDormModal";

function ManageDormPage() {
    const user = useConvexUserData();
    const navigate = useNavigate(); // Add Button

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

                <Box sx={{ 
                    
                    padding: { xs: 0, md: 1 }
                }}>
                    <Grid container spacing={4}>
                        {pageData?.items.map((d) => (
                            <Grid 
                                item 
                                     
                                sm={6}      
                                key={d._id}
                            >
                                <Paper
                                    elevation={4} 
                                    sx={{ 
                                        p: 3, 
                                        display: "flex", 
                                        flexDirection: "column", 
                                        gap: 2,
                                        width: '550px',
                                        minHeight: '340px',
                                        height: '100%', 
                                        borderRadius: 5,
                                        position: 'relative',
                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                                        },
                                    }}
                                >
                                    
                                    
                                    {/* HÀNG 1: TÊN VÀ NÚT HÀNH ĐỘNG (HEADER CỦA CARD) */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                        {/* Tên Nhà Trọ */}
                                        <Typography variant="h6" fontSize={20} fontWeight={700} sx={{ pr: 1 }}>
                                            {d.name}
                                        </Typography>
                                        
                                        {/* Cụm nút Hành động (Quản lý phòng, Sửa, Xóa) */}
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                                            
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

                                    <Divider /> {/* Đường phân cách mỏng */}

                                    {/* BỐ CỤC DỌC MỚI CHO THÔNG TIN CHI TIẾT */}
                                    <Stack spacing={3}> 
                                        
                                        {/* 1. Địa chỉ */}
                                        <Stack spacing={0.5}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                Địa chỉ
                                            </Typography>
                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Box component="span" sx={{ fontSize: '1rem', color: 'text.secondary' }}>📍</Box> 
                                                <Typography variant="body1">
                                                    {d.address || "-"}
                                                </Typography>
                                            </Stack>
                                        </Stack>

                                        {/* 2. Mô tả (đặt ngay dưới địa chỉ) */}
                                        <Stack spacing={0.5}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                Mô tả
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                color="text.primary" 
                                                // 🌟 ĐOẠN CODE CẦN THIẾT ĐỂ CẮT NỘI DUNG VÀ KHÔNG KÉO DÀI THẺ
                                                sx={{ 
                                                    fontStyle: 'italic',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3, // Giới hạn TỐI ĐA 3 dòng
                                                    WebkitBoxOrient: 'vertical',
                                                }}
                                            >
                                                {d.description || "Ký túc xá sinh viên Sunrise là hình mẫu lý tưởng cho cuộc sống hiện đại, tiện nghi và an toàn, đặc biệt được thiết kế để tối ưu hóa trải nghiệm học tập và sinh hoạt của sinh viên. Với phương châm 'Nhà là nơi để trở về, và học tập là nơi để phát triển,' chúng tôi cam kết cung cấp một môi trường sống chất lượng cao, vượt xa tiêu chuẩn nhà trọ thông thường."}
                                            </Typography>
                                        </Stack>
                                        
                                        {/* 3. Thông tin Chip (Ngày chốt và Ngày tạo) */}
                                       <Stack 
                                            direction={{ xs: 'column', sm: 'row' }} // Xếp ngang trên màn hình lớn, xếp dọc trên màn hình nhỏ
                                            justifyContent="space-between" 
                                            alignItems={{ xs: 'flex-start', sm: 'flex-end' }} 
                                            spacing={2}
                                            sx={{ mt: 'auto' }} // ĐẨY XUỐNG DƯỚI CÙNG
                                        >
                                            {/* Cột Trái: Thông tin Chip (Ngày chốt và Ngày tạo) */}
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                    Thông tin ngày
                                                </Typography>
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                    <Chip
                                                        size="small"
                                                        label={d.involveDueDate ? `Chốt: Ngày ${d.involveDueDate}` : "Ngày chốt: Chưa đặt"}
                                                        
                                                        variant="filled" 
                                                        sx={{ width: 'fit-content', height: 24, fontSize: '0.8rem' }}
                                                    />
                                                    {d.createdAt && (
                                                        <Chip
                                                            size="small"
                                                            label={"Tạo: " + new Date(d.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", })}
                                                            variant="outlined"
                                                            sx={{ width: 'fit-content', height: 24, fontSize: '0.8rem' }}
                                                        />
                                                    )}
                                                </Stack>
                                            </Stack>

                                            {/* Cột Phải: NÚT "PHÒNG" (HÀNH ĐỘNG) */}
                                            <Button
                                                size="large" // Tăng kích thước nút ở cuối card
                                                variant="contained"
                                                startIcon={<MeetingRoomIcon />}
                                                onClick={() => navigate(`/landlord/dorms/${d._id}`)}
                                                sx={{ minWidth: 120, py: 1 }}
                                            >
                                                Quản lý phòng
                                            </Button>
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

export default ManageDormPage;

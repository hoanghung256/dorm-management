import { useEffect, useState } from "react";
import { useClerkUserData } from "../../../../hooks/useClerkUserData";
import { convexMutation, convexQueryOneTime } from "../../../../services/convexClient";
import { api } from "../../../../../convex/_generated/api";
import { Button, TextField, MenuItem, Stack, Typography, Paper, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserData } from "../../../../store/authSlice";

function LoginCallback() {
    const { user } = useClerkUserData();
    const [fetchedUser, setFetchedUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isCheckingUserExist, setIsCheckingUserExist] = useState(true);
    const [form, setForm] = useState({
        clerkUserId: "",
        name: "",
        email: "",
        role: "",
        birthDate: "",
        phone: "",
        hometown: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        if (user) {
            setForm((f) => ({
                ...f,
                clerkUserId: user.id,
                name: user.fullName || "",
                email: user.emailAddresses[0]?.emailAddress || "",
            }));
        }
    }, [user]);

    useEffect(() => {
        if (user && !fetchedUser) {
            (async () => {
                setIsCheckingUserExist(true);
                await checkIfUserExists(user.id);
                setIsCheckingUserExist(false);
            })();
        }
        if (fetchedUser) {
            if (fetchedUser.role === "landlord") navigate("/");
            if (fetchedUser.role === "renter") navigate("/");
        }
    }, [user, fetchedUser]);

    const checkIfUserExists = async (clerkId) => {
        try {
            const existingUser = await convexQueryOneTime(api.functions.users.getUserByClerkId, {
                clerkUserId: clerkId,
            });
            dispatch(setUserData(existingUser));
            setFetchedUser(existingUser);
        } catch (e) {
            console.error(e);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.name || !form.email || !form.role) {
            setError("Vui lòng nhập đầy đủ các trường bắt buộc.");
            return;
        }
        if (!user) return;
        setSubmitting(true);
        try {
            await convexMutation(api.functions.users.createUser, {
                clerkUserId: user.id,
                name: form.name,
                email: form.email,
                role: form.role,
                birthDate: form.birthDate || null,
                phone: form.phone,
                hometown: form.hometown,
            });
            await checkIfUserExists(user.id);
        } catch (e) {
            setError("Tạo người dùng thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

    return isCheckingUserExist ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <Typography variant="h6">Đang kiểm tra thông tin người dùng...</Typography>
        </Box>
    ) : !isCheckingUserExist && !fetchedUser ? (
        <Box display="flex" justifyContent="center" mt={4} px={2}>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 520, width: "100%" }}>
                <Typography variant="h5" mb={2} fontWeight={600}>
                    Thiết lập tài khoản
                </Typography>
                <Typography variant="body2" mb={3}>
                    Vui lòng điền thông tin bên dưới để hoàn tất.
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Họ và tên"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            disabled
                            fullWidth
                        />
                        <TextField
                            select
                            label="Vai trò"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            required
                            fullWidth
                        >
                            <MenuItem value="">Chọn vai trò</MenuItem>
                            <MenuItem value="landlord">Chủ trọ</MenuItem>
                            <MenuItem value="renter">Người thuê</MenuItem>
                        </TextField>
                        <TextField
                            label="Ngày sinh"
                            name="birthDate"
                            type="date"
                            value={form.birthDate}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="Số điện thoại"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            fullWidth
                        />
                        <TextField
                            label="Quê quán"
                            name="hometown"
                            value={form.hometown}
                            onChange={handleChange}
                            multiline
                            minRows={2}
                            fullWidth
                        />
                        {error && (
                            <Typography color="error" variant="body2">
                                {error}
                            </Typography>
                        )}
                        <Button type="submit" variant="contained" color="primary" loading={submitting}>
                            Hoàn tất
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Box>
    ) : null;
}

export default LoginCallback;

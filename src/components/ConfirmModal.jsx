import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Button,
    IconButton,
    Box,
} from "@mui/material";
import { Close } from "@mui/icons-material";

function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmText = "Xác nhận", cancelText = "Hủy" }) {
    return (
        <Dialog
            open={show}
            onClose={onCancel}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    minWidth: 420,
                    maxWidth: 500,
                    mx: 2,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                    backgroundImage: "none",
                },
            }}
            sx={{
                "& .MuiBackdrop-root": {
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(2px)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pb: 2,
                    pt: 3,
                    px: 3,
                    fontWeight: "bold",
                    fontSize: "1.3rem",
                    fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                    color: "#333",
                }}
            >
                {title}
                <IconButton
                    onClick={onCancel}
                    sx={{
                        color: "grey.400",
                        ml: 1,
                        "&:hover": {
                            backgroundColor: "grey.100",
                            color: "grey.600",
                        },
                    }}
                >
                    <Close fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 0, pb: 3, px: 3 }}>
                <DialogContentText
                    sx={{
                        color: "#666",
                        fontSize: "1rem",
                        lineHeight: 1.6,
                        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                        fontWeight: 400,
                    }}
                >
                    {message}
                </DialogContentText>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1.5, justifyContent: "flex-end" }}>
                <Button
                    onClick={onCancel}
                    variant="outlined"
                    sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
                        fontWeight: 500,
                        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                        borderColor: "#e0e0e0",
                        color: "#666",
                        minWidth: 100,
                        "&:hover": {
                            borderColor: "#bdbdbd",
                            backgroundColor: "#f5f5f5",
                        },
                    }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
                        fontWeight: 500,
                        fontFamily: "Inter, Roboto, Helvetica, Arial, sans-serif",
                        backgroundColor: "#7b1fa2",
                        minWidth: 100,
                        boxShadow: "0 4px 12px rgba(123, 31, 162, 0.3)",
                        "&:hover": {
                            backgroundColor: "#6a1b9a",
                            boxShadow: "0 6px 16px rgba(123, 31, 162, 0.4)",
                        },
                    }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmModal;

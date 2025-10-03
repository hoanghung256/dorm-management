import { TextField, Typography, Box } from "@mui/material";

// Hàm format số tiền thành text tiếng Việt
export const formatCurrencyToText = (amount) => {
    if (!amount || amount === 0) return "";
    
    const units = ["", "nghìn", "triệu", "tỷ"];
    let result = "";
    let unitIndex = 0;
    
    let num = Math.abs(amount);
    
    while (num > 0 && unitIndex < units.length) {
        const chunk = num % 1000;
        if (chunk > 0) {
            const chunkText = chunk.toString();
            result = `${chunkText} ${units[unitIndex]} ${result}`.trim();
        }
        num = Math.floor(num / 1000);
        unitIndex++;
    }
    
    return result + " đồng";
};

// Hàm format số có dấu chấm
export const formatNumber = (num) => {
    if (!num || num === 0) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Hàm parse số từ string có dấu chấm
export const parseNumber = (str) => {
    if (!str) return 0;
    return parseInt(str.replace(/\./g, "")) || 0;
};

// Component TextField cho tiền tệ
export const CurrencyTextField = ({ 
    label = "Giá (VNĐ)", 
    value, 
    onChange, 
    placeholder = "0",
    helperText,
    showTextAmount = true,
    ...props 
}) => {
    const handleChange = (e) => {
        // Xóa tất cả ký tự không phải số
        const numericValue = e.target.value.replace(/[^\d]/g, "");
        const parsedValue = parseInt(numericValue) || 0;
        onChange(parsedValue);
    };

    return (
        <Box>
            <TextField
                label={label}
                placeholder={placeholder}
                value={formatNumber(value)}
                onChange={handleChange}
                InputProps={{
                    inputProps: { 
                        style: { textAlign: 'right' }
                    }
                }}
                helperText={helperText}
                {...props}
            />
            {showTextAmount && value > 0 && (
                <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                        fontSize: '0.65rem',
                        fontStyle: 'italic',
                        display: 'block',
                        mt: 0.5,
                        lineHeight: 1.2
                    }}
                >
                    💰 {formatCurrencyToText(value)}
                </Typography>
            )}
        </Box>
    );
};

export default CurrencyTextField;
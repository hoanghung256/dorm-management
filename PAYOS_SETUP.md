# PayOS Integration Setup Guide

## Các lỗi đã được fix

### 1. Type mismatch cho orderCode
- **Vấn đề**: PayOS API expect orderCode dạng string nhưng schema database expect number
- **Giải pháp**: Convert orderCode thành string khi gửi lên PayOS API, nhưng lưu dạng number trong database

### 2. PayOS Webhook Handler
- **Vấn đề**: Webhook handler không xử lý được orderCode dạng string từ PayOS
- **Giải pháp**: Thêm logic convert orderCode từ string sang number khi xử lý webhook

### 3. Signature Generation
- **Vấn đề**: Signature generation có thể bị lỗi nếu có ký tự đặc biệt
- **Giải pháp**: Clean tất cả input để loại bỏ ký tự '|' có thể gây conflict
- **Thứ tự trường**: Theo PayOS docs: `amount|orderCode|description|returnUrl|cancelUrl`

### 4. Error Handling
- **Vấn đề**: Error handling không đủ chi tiết để debug
- **Giải pháp**: Thêm comprehensive logging và error handling

## Cấu hình Environment Variables

Thêm các biến môi trường sau vào `.env.local`:

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
PAYOS_BASE_URL=https://api-merchant.payos.vn
PAYOS_RETURN_URL=https://tubbiestech.site/landlord/payments/package/confirm
PAYOS_CANCEL_URL=https://tubbiestech.site/landlord/payments/package

# Convex Configuration
CONVEX_DEPLOYMENT=your_convex_deployment
CONVEX_SITE_URL=your_convex_site_url
```

## Testing PayOS Integration

1. **Test Payment Creation**:
   - Chạy app và thử tạo payment
   - Kiểm tra console logs để xem PayOS API response
   - Verify rằng checkoutUrl được tạo thành công

2. **Test Webhook Handler**:
   - Sử dụng PayOS webhook test tool
   - Gửi test webhook với status "PAID"
   - Kiểm tra database để verify subscription được tạo

## Các file đã được cập nhật

- `convex/functions/payOS.js` - Fixed type mismatches, signature generation, và improved error handling
- `src/features/payments/PaymentServicePage.jsx` - Added better logging
- `PAYOS_SETUP.md` - Documentation và troubleshooting guide

## PayOS API Request Format

### Request Body (JSON):
```json
{
  "orderCode": "string",
  "amount": number,
  "description": "string", 
  "returnUrl": "string",
  "cancelUrl": "string"
}
```

### Request Headers:
```
x-client-id: your_client_id
x-api-key: your_api_key
x-signature: generated_signature
Content-Type: application/json
```

### Signature Generation:
```
stringToSign = "amount|orderCode|description|returnUrl|cancelUrl"
signature = HMAC-SHA256(checksumKey, stringToSign)
```

## Lưu ý quan trọng

1. **Credentials**: Đảm bảo PayOS credentials được cấu hình đúng trong environment variables
2. **URLs**: Verify return và cancel URLs match với PayOS configuration
3. **Testing**: Test trong sandbox environment trước khi deploy production
4. **Monitoring**: Monitor logs để catch errors early

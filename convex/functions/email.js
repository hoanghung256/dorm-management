// convex/functions/email.js
// Provider-agnostic email sender stub. Replace implementation with your provider.
import { action, internalAction, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "../_generated/api";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@example.com";

export const sendEmail = internalAction({
    args: {
        to: v.array(v.string()),
        subject: v.string(),
        html: v.string(),
    },
    handler: async (_ctx, { to, subject, html }) => {
        try {
            const resend = new Resend(RESEND_API_KEY);
            console.log(RESEND_API_KEY);

            const result = await resend.emails.send({
                from: SENDER_EMAIL,
                to,
                subject,
                html,
            });

            return { success: true, id: result.id || `dev-${Date.now()}` };
        } catch (error) {
            console.error("Failed to send email:", error);
            throw new Error("Failed to send email");
        }
    },
});

export const generateInvoiceEmailTemplate = (invoiceData) => {
    const { roomCode, dormName, period, totalAmount, items = [], renterName } = invoiceData;
    const startDate = new Date(period.start);
    const month = startDate.getMonth() + 1;
    const year = startDate.getFullYear();

    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hóa đơn mới - Phòng ${roomCode}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #7b1fa2; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 12px; }
        .invoice-table th { background-color: #f5f5f5; }
        .total-row { background-color: #e8f5e8; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Hóa đơn mới - Phòng ${roomCode}</h1>
          <p>Tháng ${month}/${year}</p>
        </div>
        
        <div class="content">
          <p>Xin chào <strong>${renterName || "Quý khách"}</strong>,</p>
          
          <p>Bạn có hóa đơn mới cho phòng ${roomCode}:</p>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Khoản thu</th>
                <th>Số tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tiền phòng tháng ${month}/${year}</td>
                <td style="text-align: right">${totalAmount.toLocaleString("vi-VN")}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td><strong>Tổng cộng</strong></td>
                <td style="text-align: right"><strong>${totalAmount.toLocaleString("vi-VN")} VNĐ</strong></td>
              </tr>
            </tfoot>
          </table>
          
          <p><strong>Vui lòng thanh toán trước ngày 15 hàng tháng.</strong></p>
        </div>
        
        <div style="text-align: center; padding: 15px; background-color: #f0f0f0;">
          <p>Trân trọng,<br><strong>Ban quản lý</strong></p>
        </div>
      </div>
    </body>
    </html>`;
};

export const sendInvoiceNotification = internalAction({
    args: {
        invoiceId: v.id("invoices"),
        roomCode: v.string(),
        renterEmail: v.string(),
        renterName: v.string(),
        period: v.object({
            start: v.number(),
            end: v.number(),
        }),
        totalAmount: v.number(),
    },
    handler: async (ctx, args) => {
        try {
            const emailData = {
                roomCode: args.roomCode,
                renterName: args.renterName,
                period: args.period,
                totalAmount: args.totalAmount,
            };
            console.log("DA VAO HAM EMAIL");

            const html = generateInvoiceEmailTemplate(emailData);
            const startDate = new Date(args.period.start);
            const month = startDate.getMonth() + 1;
            const year = startDate.getFullYear();

            console.log("Sending invoice email to:", args.renterEmail);
            await ctx.scheduler.runAfter(0, internal.functions.email.sendEmail, {
                to: [args.renterEmail],
                subject: `Hóa đơn mới - Phòng ${args.roomCode} (Tháng ${month}/${year})`,
                html: html,
            });
        } catch (error) {
            console.error("Error sending invoice email:", error);
            throw error;
        }
    },
});

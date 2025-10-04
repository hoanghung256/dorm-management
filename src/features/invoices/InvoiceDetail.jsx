import React from "react";
import { exportInvoice } from "../../services/excel/exportInvoice";

export default function InvoiceDetail({ invoice, items = [], landlord, renter }) {
    const onExport = async () => {
        const blob = await exportInvoice({ invoice, items, landlord, renter });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoice?.period || ""}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!invoice) return <div>Không có hóa đơn nào được chọn</div>;
    return (
        <div>
            <h3>Hóa đơn {invoice.period}</h3>
            <div>Trạng thái: {invoice.status}</div>
            <div>Tổng cộng: {invoice.totalAmount}</div>
            <button onClick={onExport}>Xuất ra Excel</button>
        </div>
    );
}

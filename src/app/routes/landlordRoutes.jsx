import ChatPage from "../../features/chat/ChatPage";
import ManageDormPage from "../../features/dorms/ManageDormPage";
import RoomPage from "../../features/room/RoomPage";
import DormInvoiceReport from "../../features/invoices/DormInvoiceReport";
import DormInvoicePicker from "../../features/invoices/DormInvoicePicker";
import PackPaymentPage from "../../features/payments/PackPaymentPage";
import PaymentResultPage from "../../features/payments/PaymentResultPage";

export const landlordRoutes = [
    { path: "/landlord/dorms", element: <ManageDormPage /> },
    { path: "/landlord/chat", element: <ChatPage /> },
    { path: "/landlord/invoices", element: <DormInvoicePicker /> },
    { path: "/landlord/dorms/:dormId", element: <RoomPage /> },
    { path: "/landlord/invoices/:dormId", element: <DormInvoiceReport /> },
    { path: "/landlord/payments/package", element: <PackPaymentPage /> },
    { path: "/landlord/payments/package/result", element: <PaymentResultPage /> },
];

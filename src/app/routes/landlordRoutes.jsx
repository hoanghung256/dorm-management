import ChatPage from "../../features/chat/ChatPage";
import ManageDormPage from "../../features/dorms/ManageDormPage";
import RoomPage from "../../features/room/RoomPage";

export const landlordRoutes = [
    { path: "/landlord/dorms", element: <ManageDormPage /> },
    { path: "/landlord/chat", element: <ChatPage /> },
    { path: "/landlord/rooms", element: <RoomPage /> },
];

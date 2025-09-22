import ChatPage from "../../features/chat/ChatPage";
import ManageDormPage from "../../features/dorms/ManageDormPage";
import RoomPage from "../../features/room/RoomPage";

export const landlordRoutes = [
    { path: "/dorms", element: <ManageDormPage /> },
    { path: "/chat", element: <ChatPage /> },
    { path: "/room", element: <RoomPage /> },
];

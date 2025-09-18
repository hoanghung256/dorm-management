import ChatPage from "../../features/chat/ChatPage";
import RoomPage from "../../features/room/RoomPage";

export const landlordRoutes = [
    { path: "/chat", element: <ChatPage /> },
    { path: "/room", element: <RoomPage /> },
];

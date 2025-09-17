import ProtectedRoute from "../../components/ProtectedRoute";
import ChatPage from "../../features/chat/ChatPage";
import App from "../../App";

export const chatRoutes = [
    { path: "/", element: <App /> },
    {
        element: <ProtectedRoute />,
        children: [{ path: "/chat", element: <ChatPage /> }],
    },
];

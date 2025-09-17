import ProtectedRoute from "../../components/ProtectedRoute";
import RoomPage from "../../features/room/RoomPage";

export const roomRoutes = [
    {
        element: <ProtectedRoute />,
        children: [{ path: "/room", element: <RoomPage /> }],
    },
];

import ProtectedRoute from "../../components/ProtectedRoute";
import LoginCallback from "../../features/auth/pages/Login/LoginCallback";
import LoginPage from "../../features/auth/pages/Login/LoginPage";
import SignUpPage from "../../features/auth/pages/SignUpPage";

export const authRoutes = [
    { path: "/login", element: <LoginPage /> },
    { path: "/signup", element: <SignUpPage /> },
    {
        element: <ProtectedRoute />,
        children: [{ path: "/login-callback", element: <LoginCallback /> }],
    },
];

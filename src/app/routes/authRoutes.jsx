import ProtectedRoute from "../../components/ProtectedRoute";
import LoginPage from "../../features/auth/pages/login/LoginPage";
import SignUpPage from "../../features/auth/pages/SignUpPage";
import LoginCallback from "../../features/auth/pages/login/LoginCallback";

export const authRoutes = [
    { path: "/login", element: <LoginPage /> },
    { path: "/signup", element: <SignUpPage /> },
    {
        element: <ProtectedRoute />,
        children: [{ path: "/login-callback", element: <LoginCallback /> }],
    },
];

import { Navigate, Outlet } from "react-router-dom";
import useToken from "../hooks/useToken";

function ProtectedRoute() {
    const { token, isSignedIn } = useToken();

    if (isSignedIn === false) {
        return <Navigate to={"/login"} replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;

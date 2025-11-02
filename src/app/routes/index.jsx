import ProtectedRoute from "../../components/ProtectedRoute";
import AuthLayout from "../layouts/AuthLayout";
import GeneralLayout from "../layouts/GeneralLayout";
import LandlordLayout from "../layouts/LandlordLayout";
import RenterLayout from "../layouts/RenterLayout";
import AdminLayout from "../layouts/AdminLayout";
import { authRoutes } from "./authRoutes";
import { landingRoutes } from "./landingRoutes";
import { landlordRoutes } from "./landlordRoutes";
import { renterRoutes } from "./renterRoutes";
import { adminRoutes } from "./adminRoutes";

export const routes = [
    { element: <AuthLayout />, children: authRoutes },
    {
        element: <GeneralLayout />,
        children: landingRoutes,
    },
    {
        element: (
            // <ProtectedRoute>
            <LandlordLayout />
            // </ProtectedRoute>
        ),
        children: landlordRoutes,
    },
    {
        element: (
            // <ProtectedRoute>
            <RenterLayout />
            // </ProtectedRoute>
        ),
        children: renterRoutes,
    },
    {
        element: (
            // <ProtectedRoute>
            <AdminLayout />
            // </ProtectedRoute>
        ),
        children: adminRoutes,
    },
];

import AuthLayout from "../layouts/AuthLayout";
import DefaultLayout from "../layouts/DefaultLayout";
import { authRoutes } from "./authRoutes";
import { chatRoutes } from "./chatRoutes";
import { landingRoutes } from "./ladningRoutes";
import { roomRoutes } from "./roomRoutes";

export const routes = [
    { element: <AuthLayout />, children: authRoutes },
    { element: <DefaultLayout />, children: [...landingRoutes, ...chatRoutes, ...roomRoutes] },
];

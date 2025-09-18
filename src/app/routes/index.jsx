import AuthLayout from "../layouts/AuthLayout";
import GeneralLayout from "../layouts/GeneralLayout";
import { authRoutes } from "./authRoutes";
import { chatRoutes } from "./chatRoutes";
import { landingRoutes } from "./landingRoutes";
import { roomRoutes } from "./roomRoutes";

export const routes = [
    { element: <AuthLayout />, children: authRoutes },
    { element: <GeneralLayout />, children: [...landingRoutes, ...chatRoutes, ...roomRoutes] },
];

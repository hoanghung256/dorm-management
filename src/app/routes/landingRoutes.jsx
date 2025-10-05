import LandingPage from "../../features/landing/landingPage";
import ProductPage from "../../features/landing/ProductPage";
import TestFbImage from "../../features/test/TestFbImage";

export const landingRoutes = [
    { path: "/", element: <LandingPage /> },
    { path: "/product", element: <ProductPage /> },
    { path: "/test", element: <TestFbImage /> },
];

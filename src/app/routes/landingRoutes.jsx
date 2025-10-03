

import LandingPage from "../../features/landing/landingPage";
import ProductPage from "../../features/landing/ProductPage";

export const landingRoutes = [
    { path: "/", element: <LandingPage /> },
    { path: "/product", element: <ProductPage /> },
];
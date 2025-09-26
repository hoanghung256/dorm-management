import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { routes } from "./app/routes/index.jsx";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./store/index.js";
import { CLERK_PUBLISHABLE_KEY } from "./constants/env.js";
import { ClerkProvider } from "@clerk/clerk-react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import theme from "./styles/theme.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";

const router = createBrowserRouter(routes);
const store = configureStore({ reducer: rootReducer });

createRoot(document.getElementById("root")).render(
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}
            localization={{
                signIn: {
                  start: {
                    title: 'Đăng nhập vào hệ thống DMS',
                    subtitle: 'Vui lòng nhập thông tin đăng nhập của bạn để tiếp tục.',
                    actionText: 'Bạn chưa có tài khoản ?',
                    actionLink: 'Đăng ký',
                  }
                },
                signUp: {
                  start: {
                    title: 'Chào mừng bạn đến với DMS',
                    subtitle: 'Vui lòng điền thông tin của bạn vào bên dưới để đăng ký.',
                    actionText: 'Bạn đã có tài khoản?',
                    actionLink: 'Đăng nhập ngay',
                  }
                }
            }}>
            <Provider store={store}>
                <RouterProvider router={router} />
                <Toaster position="top-right" />
            </Provider>
        </ClerkProvider>
    </ThemeProvider>,
);

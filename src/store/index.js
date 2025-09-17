import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./authSlice.js";

export const rootReducer = combineReducers({
    auth: authReducer,
});

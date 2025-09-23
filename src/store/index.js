import { combineReducers } from "@reduxjs/toolkit";

import authReducer from "./authSlice.js";
import roomReducer from "./roomSlice.js";

export const rootReducer = combineReducers({
    auth: authReducer,
    room: roomReducer,
});

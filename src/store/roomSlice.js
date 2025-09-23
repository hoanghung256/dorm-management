import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    rooms: [],
};

const roomSlice = createSlice({
    name: "room",
    initialState: initialState,
    reducers: {
        setRooms(state, value) {
            state.rooms = value.payload;
        },
    },
});

export const { setRooms } = roomSlice.actions;
export default roomSlice.reducer;

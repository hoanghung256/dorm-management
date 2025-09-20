import { useEffect, useState } from "react";
import { convexQueryOneTime } from "../../services/convexClient";
import { api } from "../../../convex/_generated/api";

function RoomPage() {
    const { user } = useUserData();
    const [room, setRoom] = useState([]);

    useEffect(() => {
        getRoom();
    }, []);

    const getRoom = async () => {
        const room = await convexQueryOneTime(api.functions.rooms.listByLandlord, { landlordId: user.id });
        setRoom(room);
    };

    return <div>Helo</div>;
}

export default RoomPage;

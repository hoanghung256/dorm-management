import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { convexQueryOneTime } from "../services/convexClient";
import { api } from "../../convex/_generated/api";
import { setUserData } from "../store/authSlice";
import useClerkUserData from "./useClerkUserData";

/**
 * Returns user data from Redux.
 * If missing (null/undefined) it tries to refetch from Convex (by clerkUserId) and
 * stores it back into Redux.
 *
 * Usage:
 * const user = useConvexUserData();
 */
const useConvexUserData = () => {
    const reduxUser = useSelector((state) => state.auth.userData);
    const dispatch = useDispatch();
    const clerkUser = useClerkUserData(); // assumes this provides { id, ... }
    const [loading, setLoading] = useState(false);
    const attemptedRef = useRef(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (loading) return;
            if (!clerkUser?.id) return;
            if (reduxUser) return;
            if (attemptedRef.current) return; // prevent repeated attempts if not found
            attemptedRef.current = true;
            try {
                setLoading(true);
                const data = await convexQueryOneTime(api.functions.users.getUserByClerkId, {
                    clerkUserId: clerkUser.id,
                });
                if (data) {
                    dispatch(setUserData(data));
                }
            } catch (e) {
                console.error("Failed to refetch userData:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [reduxUser, clerkUser, dispatch, loading]);

    return reduxUser;
};

export default useConvexUserData;

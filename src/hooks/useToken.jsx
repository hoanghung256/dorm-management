import { useAuth } from "@clerk/clerk-react";
import { useCallback, useEffect, useState } from "react";

function useToken() {
    const { getToken, isSignedIn } = useAuth();
    const [token, setToken] = useState(null);

    const refresh = useCallback(
        async (options) => {
            if (!isSignedIn) {
                setToken(null);
                return null;
            }
            try {
                const t = await getToken(options);
                setToken(t);
                return t;
            } catch (e) {
                setToken(null);
                return null;
            }
        },
        [getToken, isSignedIn],
    );

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { token, isSignedIn };
}

export default useToken;

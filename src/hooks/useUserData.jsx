import { useUser, useAuth } from "@clerk/clerk-react";
import { useCallback, useMemo } from "react";

/**
 * useUserData
 * Wraps Clerk hooks to expose a convenient, memoized user object + helpers.
 */
export function useUserData() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken, signOut } = useAuth();

    const refetchUser = useCallback(async () => {
        if (user) {
            await user.reload();
        }
    }, [user]);

    const data = useMemo(() => {
        if (!isLoaded || !isSignedIn || !user) {
            return {
                isLoaded,
                isSignedIn: false,
                user: null,
                userId: null,
                fullName: "",
                firstName: "",
                lastName: "",
                emailPrimary: "",
                emails: [],
                imageUrl: "",
                publicMetadata: {},
                unsafeMetadata: {},
                signOut,
                getToken,
                refetchUser,
            };
        }

        const primaryEmailObj = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
        const emails = user.emailAddresses.map((e) => e.emailAddress);

        return {
            isLoaded,
            isSignedIn: true,
            user,
            userId: user.id,
            fullName: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" "),
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            emailPrimary: primaryEmailObj?.emailAddress || emails[0] || "",
            emails,
            imageUrl: user.imageUrl,
            publicMetadata: user.publicMetadata || {},
            unsafeMetadata: user.unsafeMetadata || {},
            signOut,
            getToken,
            refetchUser,
        };
    }, [isLoaded, isSignedIn, user, signOut, getToken, refetchUser]);

    return data;
}

export default useUserData;

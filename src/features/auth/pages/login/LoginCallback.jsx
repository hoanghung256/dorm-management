import { useEffect, useState } from "react";
import useUserData from "../../../../hooks/useUserData";
import { convexQuery } from "../../../../services/convexClient";
import { api } from "../../../../../convex/_generated/api";
import Button from "@mui/material/Button";

function LoginCallback() {
    const { user } = useUserData();
    const [fetchedUser, setFetchedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState();

    useEffect(() => {
        if (user) {
            checkIfUserExists(user.id);
        }
        if (fetchedUser) {
        } else {
            createUser();
        }
    }, [user, fetchedUser]);

    useEffect(() => {
        console.log("Fetched user:", fetchedUser);
    }, [fetchedUser]);

    const checkIfUserExists = async (clerkId) => {
        const existingUser = await convexQuery(api.functions.users.getUserByClerkId, { clerkUserId: clerkId });
        setFetchedUser(existingUser);
    };

    const createUser = async () => {
        await convexQuery(api.functions.users.createUser, {
            clerkUserId: user.id,
            name: user.name || "No Name",
            email: user.email || "No Email",
        });
    };

    return (
        <>
            fetchedUser && (
            <div>
                <h2>Welcome, {fetchedUser.name || "User"}!</h2>
                <p>Your email: {fetchedUser.email}</p>
                <div>
                    <h3>Choose your role:</h3>
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                        <option value="">Select role</option>
                        <option value="landlord">Landlord</option>
                        <option value="renter">Renter</option>
                    </select>
                </div>
                {selectedRole && <p>You selected: {selectedRole}</p>}
                <Button variant="contained" color="primary" disabled={!selectedRole}>
                    Continue
                </Button>
            </div>
            )
        </>
    );
}

export default LoginCallback;

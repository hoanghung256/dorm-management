import React, { useEffect, useState } from "react";
import { convexQueryOneTime } from "../../services/convexClient";

export default function NotificationsPage({ landlordId }) {
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const list = await convexQueryOneTime(
                    import.meta.env.VITE_CONVEX_FUNC_NOTIFS_LIST || "notifications:listByLandlord",
                    { landlordId },
                );
                if (!mounted) return;
                setItems(list);
            } catch (e) {
                setError(e?.message || "Failed to load notifications");
            } finally {
                setLoading(false);
            }
        }
        if (landlordId) load();
        return () => {
            mounted = false;
        };
    }, [landlordId]);

    if (loading) return <div>Loading…</div>;
    if (error) return <div style={{ color: "red" }}>{error}</div>;

    return (
        <div>
            <h3>Notifications</h3>
            <ul>
                {items.map((n) => (
                    <li key={n._id}>
                        <strong>{n.title}</strong>: {n.content}
                    </li>
                ))}
            </ul>
        </div>
    );
}

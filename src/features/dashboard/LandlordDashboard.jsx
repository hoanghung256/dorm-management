import { useEffect, useState } from "react";
import { convexQueryOneTimeOneTime } from "../../services/convexClient";
// dynamic import path to Convex functions is required by Convex client

export default function LandlordDashboard({ landlordId }) {
    const [metrics, setMetrics] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const [m, r] = await Promise.all([
                    convexQueryOneTimeOneTime(import.meta.env.VITE_CONVEX_FUNC_ADMIN_REVENUE || "admin:revenueByTier", {
                        period: undefined,
                    }),
                    convexQueryOneTimeOneTime(import.meta.env.VITE_CONVEX_FUNC_ROOMS_LIST || "rooms:listByLandlord", {
                        landlordId,
                    }),
                ]);
                if (!mounted) return;
                setMetrics(m);
                setRooms(r);
            } catch (e) {
                setError(e?.message || "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        }
        if (landlordId) load();
        return () => {
            mounted = false;
        };
    }, [landlordId]);

    if (loading) return <div>Loading dashboard…</div>;
    if (error) return <div style={{ color: "red" }}>{error}</div>;

    return (
        <div style={{ padding: 16 }}>
            <h2>Dashboard</h2>
            <section>
                <h3>Revenue by Tier</h3>
                <ul>
                    {metrics.map((m) => (
                        <li key={m.tier}>
                            {m.tier}: {m.total}
                        </li>
                    ))}
                </ul>
            </section>
            <section>
                <h3>Your Rooms</h3>
                <ul>
                    {rooms.map((r) => (
                        <li key={r._id}>
                            {r.code} — {r.status}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

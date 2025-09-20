import React, { useEffect, useState } from "react";
import { convexQueryOneTime } from "../../services/convexClient";

export default function InvoiceList({ roomId }) {
    const [invoices, setInvoices] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const list = await convexQueryOneTime(
                    import.meta.env.VITE_CONVEX_FUNC_INVOICES_LIST || "invoices:listByRoomAndPeriod",
                    { roomId },
                );
                if (!mounted) return;
                setInvoices(list);
            } catch (e) {
                setError(e?.message || "Failed to load invoices");
            } finally {
                setLoading(false);
            }
        }
        if (roomId) load();
        return () => {
            mounted = false;
        };
    }, [roomId]);

    if (loading) return <div>Loading…</div>;
    if (error) return <div style={{ color: "red" }}>{error}</div>;

    return (
        <div>
            <h3>Invoices</h3>
            <ul>
                {invoices.map((i) => (
                    <li key={i._id}>
                        {i.period} — {i.status} — {i.totalAmount}
                    </li>
                ))}
            </ul>
        </div>
    );
}

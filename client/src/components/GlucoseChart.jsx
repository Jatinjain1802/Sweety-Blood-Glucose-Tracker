
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

function GlucoseChart({ readings = [] }) {
    const chartData = [...readings]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((reading) => ({
            date: String(reading.date).slice(0, 10),
            value: Number(reading.value),
            slot: reading.slot,
        }));

    if (chartData.length === 0) {
        return <p>No glucose readings available for this month.</p>;
    }

    return (
        <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="value"
                        name="Glucose (mg/dl)"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default GlucoseChart;

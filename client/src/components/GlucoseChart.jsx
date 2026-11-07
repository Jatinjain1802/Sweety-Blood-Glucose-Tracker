import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

/**
 * Custom Tooltip Component for Recharts
 * -------------------------------------
 * Learning point for React:
 * Recharts passes `active`, `payload`, and `label` props into custom tooltip components.
 * By creating our own Tooltip component, we have full control over HTML markup,
 * styling, and badge logic instead of being stuck with default unstyled boxes.
 */
function CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const val = Number(data.value);

        const statusLabel =
            val < 70
                ? "Low"
                : val <= 140
                ? "Normal"
                : val <= 199
                ? "Elevated"
                : "High";

        const statusColor =
            val < 70
                ? "#2563eb"
                : val <= 140
                ? "#059669"
                : val <= 199
                ? "#d97706"
                : "#dc2626";

        return (
            <div className="chart-tooltip">
                <div className="chart-tooltip-header">
                    <span className="tooltip-date">📅 {data.date}</span>
                    {data.slot && <span className="tooltip-slot">{data.slot}</span>}
                </div>
                <div className="chart-tooltip-body">
                    <div className="tooltip-val-group">
                        <span className="tooltip-val">{data.value}</span>
                        <span className="tooltip-unit">mg/dL</span>
                    </div>
                    <span
                        className="tooltip-badge"
                        style={{ color: statusColor, borderColor: statusColor }}
                    >
                        ● {statusLabel}
                    </span>
                </div>
            </div>
        );
    }
    return null;
}

/**
 * GlucoseChart Component
 * ----------------------
 * Displays blood glucose readings as a smooth area curve over time.
 *
 * Design features:
 * - Monotone curve with sweet rose brand gradient fill
 * - Reference guidelines for clinical normal range (70 - 140 mg/dL)
 * - Custom interactive tooltip with slot badges and status levels
 * - Responsive container that adapts fluidly to desktop and mobile screens
 */
function GlucoseChart({ readings = [] }) {
    // Sort chronologically and format data for Recharts
    const chartData = [...readings]
        .sort((a, b) => {
            const dateComp = new Date(a.date) - new Date(b.date);
            if (dateComp !== 0) return dateComp;
            return (a.id || 0) - (b.id || 0);
        })
        .map((reading) => {
            const dateStr = String(reading.date).slice(0, 10);
            return {
                ...reading,
                date: dateStr,
                value: Number(reading.value),
                slot: reading.slot,
                // Display short format for clean X-axis labeling
                displayLabel: `${dateStr.slice(5)}`,
            };
        });

    return (
        <section className="card chart-card">
            <div className="chart-card-header">
                <div>
                    <div className="chart-title-group">
                        <span className="chart-icon">📈</span>
                        <h3 className="card-heading">Glucose Trend Analysis</h3>
                    </div>
                    <p className="card-subheading">
                        Visualizing blood glucose trajectory and fluctuations across this period
                    </p>
                </div>

                {/* Target Range Reference Legend */}
                <div className="chart-legend">
                    <span className="legend-indicator">
                        <span className="legend-dot normal"></span> Target (70 - 140)
                    </span>
                    <span className="legend-indicator">
                        <span className="legend-dot high"></span> High (&gt; 140)
                    </span>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3 className="empty-title">No chart data available</h3>
                    <p className="empty-desc">
                        There are no glucose readings logged for this timeframe yet to plot a trend.
                    </p>
                </div>
            ) : (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={340}>
                        <AreaChart
                            data={chartData}
                            margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
                        >
                            <defs>
                                <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                            <XAxis
                                dataKey="displayLabel"
                                tickLine={false}
                                stroke="#94a3b8"
                                fontSize={12}
                                dy={8}
                            />

                            <YAxis
                                domain={["dataMin - 15", "dataMax + 20"]}
                                tickLine={false}
                                stroke="#94a3b8"
                                fontSize={12}
                                dx={-4}
                            />

                            {/* Clinical guideline lines */}
                            <ReferenceLine
                                y={140}
                                stroke="#f59e0b"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                            />
                            <ReferenceLine
                                y={70}
                                stroke="#3b82f6"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            <Area
                                type="monotone"
                                dataKey="value"
                                name="Glucose (mg/dL)"
                                stroke="#e11d48"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#glucoseGradient)"
                                dot={{
                                    r: 4,
                                    fill: "#e11d48",
                                    strokeWidth: 2,
                                    stroke: "#ffffff",
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: "#be123c",
                                    stroke: "#ffffff",
                                    strokeWidth: 2,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

export default GlucoseChart;

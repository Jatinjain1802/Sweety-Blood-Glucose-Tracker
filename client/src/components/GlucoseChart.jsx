import { useState, useMemo } from "react";
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Cell,
    Legend,
} from "recharts";

/**
 * ============================================================================
 * 🌸 SWEETY — MULTI-MODAL GLUCOSE CHART COMPONENT
 * ============================================================================
 *
 * 🎓 React & Data Visualization Concepts Explained:
 *
 * 1. Multi-Modal View Modes (`useState`):
 *    - Instead of locking users into one chart, we offer 4 distinct visual perspectives:
 *      a) Area: Smooth continuous waveform with gradient fill (visual trend feel)
 *      b) Line: Precise data plot highlighting individual peaks & valleys
 *      c) Bar (Readings): Discrete bar comparison showing absolute heights
 *      d) Bar (Slot Averages): Meal-specific comparison (Fasting vs Breakfast vs Lunch vs Dinner)
 *      e) Distribution (Time-in-Range): Clinical breakdown into Low, Normal, Elevated, High
 *
 * 2. Data Transformation & Memoization (`useMemo`):
 *    - Transforming arrays of readings (sorting, grouping by meal slot, calculating
 *      percentages) can be computationally repetitive on re-renders.
 *    - `useMemo` caches the calculated metrics and only recalculates when `readings` change!
 *
 * 3. Clinical ADA Status Color Coding:
 *    - Normal (70 - 140 mg/dL): Emerald Green (#10b981)
 *    - Elevated (141 - 199 mg/dL): Amber Orange (#f59e0b)
 *    - High (>= 200 mg/dL): Rose Red (#e11d48)
 *    - Low (< 70 mg/dL): Indigo Blue (#3b82f6)
 * ============================================================================
 */

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        const item = payload[0];
        const data = item.payload;

        // If rendering Slot Averages or Distribution
        if (data.isDistribution) {
            return (
                <div className="chart-tooltip">
                    <div className="chart-tooltip-header">
                        <span className="tooltip-slot">{data.category}</span>
                    </div>
                    <div className="chart-tooltip-body">
                        <div className="tooltip-val-group">
                            <span className="tooltip-val">{data.count}</span>
                            <span className="tooltip-unit">readings ({data.percentage}%)</span>
                        </div>
                        <p className="tooltip-hint">{data.rangeDesc}</p>
                    </div>
                </div>
            );
        }

        if (data.isSlotAverage) {
            return (
                <div className="chart-tooltip">
                    <div className="chart-tooltip-header">
                        <span className="tooltip-slot">{data.slot}</span>
                    </div>
                    <div className="chart-tooltip-body">
                        <div className="tooltip-val-group">
                            <span className="tooltip-val">{data.average}</span>
                            <span className="tooltip-unit">mg/dL avg</span>
                        </div>
                        <span className="tooltip-sub">Based on {data.count} reading(s)</span>
                    </div>
                </div>
            );
        }

        const val = Number(data.value);
        const statusLabel =
            val < 70
                ? "Low (<70)"
                : val <= 140
                ? "Normal (70-140)"
                : val <= 199
                ? "Elevated (141-199)"
                : "High (200+)";

        const statusColor =
            val < 70
                ? "#3b82f6"
                : val <= 140
                ? "#10b981"
                : val <= 199
                ? "#f59e0b"
                : "#e11d48";

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

function GlucoseChart({ readings = [] }) {
    // Current visualization mode: "area" | "line" | "bar" | "slots" | "distribution"
    const [chartMode, setChartMode] = useState("area");

    // Chronologically sorted timeline data
    const timelineData = useMemo(() => {
        return [...readings]
            .sort((a, b) => {
                const dateComp = new Date(a.date) - new Date(b.date);
                if (dateComp !== 0) return dateComp;
                return (a.id || 0) - (b.id || 0);
            })
            .map((reading) => {
                const dateStr = String(reading.date).slice(0, 10);
                const val = Number(reading.value);
                return {
                    ...reading,
                    date: dateStr,
                    value: val,
                    slot: reading.slot,
                    displayLabel: `${dateStr.slice(5)}`,
                    barColor:
                        val < 70
                            ? "#3b82f6"
                            : val <= 140
                            ? "#10b981"
                            : val <= 199
                            ? "#f59e0b"
                            : "#e11d48",
                };
            });
    }, [readings]);

    // Group readings by Meal Slot to calculate mealtime averages
    const slotAveragesData = useMemo(() => {
        const slots = [
            "Morning fasting",
            "After breakfast",
            "After lunch",
            "After dinner",
        ];

        return slots
            .map((slotName) => {
                const matches = readings.filter((r) => r.slot === slotName);
                if (matches.length === 0) return null;

                const avg = Math.round(
                    matches.reduce((acc, curr) => acc + Number(curr.value), 0) /
                        matches.length
                );

                return {
                    slot: slotName,
                    shortSlot: slotName.replace("After ", ""),
                    average: avg,
                    count: matches.length,
                    isSlotAverage: true,
                    color:
                        avg < 70
                            ? "#3b82f6"
                            : avg <= 140
                            ? "#10b981"
                            : avg <= 199
                            ? "#f59e0b"
                            : "#e11d48",
                };
            })
            .filter(Boolean);
    }, [readings]);

    // Calculate Time-In-Range (TIR) Distribution
    const distributionData = useMemo(() => {
        const total = readings.length;
        if (total === 0) return [];

        let low = 0;
        let normal = 0;
        let elevated = 0;
        let high = 0;

        readings.forEach((r) => {
            const v = Number(r.value);
            if (v < 70) low++;
            else if (v <= 140) normal++;
            else if (v <= 199) elevated++;
            else high++;
        });

        return [
            {
                category: "Low",
                count: low,
                percentage: Math.round((low / total) * 100),
                rangeDesc: "Below 70 mg/dL (Hypoglycemia risk)",
                color: "#3b82f6",
                isDistribution: true,
            },
            {
                category: "In Target",
                count: normal,
                percentage: Math.round((normal / total) * 100),
                rangeDesc: "70 – 140 mg/dL (ADA Normal range)",
                color: "#10b981",
                isDistribution: true,
            },
            {
                category: "Elevated",
                count: elevated,
                percentage: Math.round((elevated / total) * 100),
                rangeDesc: "141 – 199 mg/dL (Pre-diabetic/post-meal peak)",
                color: "#f59e0b",
                isDistribution: true,
            },
            {
                category: "High",
                count: high,
                percentage: Math.round((high / total) * 100),
                rangeDesc: "200+ mg/dL (Hyperglycemia range)",
                color: "#e11d48",
                isDistribution: true,
            },
        ];
    }, [readings]);

    // Quick stats summary
    const stats = useMemo(() => {
        if (readings.length === 0) return null;
        const values = readings.map((r) => Number(r.value));
        const highest = Math.max(...values);
        const lowest = Math.min(...values);
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        const inTargetCount = readings.filter(
            (r) => Number(r.value) >= 70 && Number(r.value) <= 140
        ).length;
        const timeInRange = Math.round((inTargetCount / readings.length) * 100);

        return { highest, lowest, avg, timeInRange };
    }, [readings]);

    return (
        <section className="card chart-card">
            {/* Header with Title and Mode Switcher */}
            <div className="chart-card-header">
                <div>
                    <div className="chart-title-group">
                        <span className="chart-icon">📈</span>
                        <h3 className="card-heading">Visual Glucose Analytics</h3>
                    </div>
                    <p className="card-subheading">
                        Interactive multi-view charts showing trends, meal comparisons, and distribution
                    </p>
                </div>

                {/* View Mode Buttons */}
                <div className="chart-mode-buttons" role="group" aria-label="Chart view type">
                    <button
                        type="button"
                        className={`btn-chart-mode ${chartMode === "area" ? "active" : ""}`}
                        onClick={() => setChartMode("area")}
                        title="Area Trend View"
                    >
                        📈 Area
                    </button>
                    <button
                        type="button"
                        className={`btn-chart-mode ${chartMode === "line" ? "active" : ""}`}
                        onClick={() => setChartMode("line")}
                        title="Line Trend View"
                    >
                        📉 Line
                    </button>
                    <button
                        type="button"
                        className={`btn-chart-mode ${chartMode === "bar" ? "active" : ""}`}
                        onClick={() => setChartMode("bar")}
                        title="Bar View per Reading"
                    >
                        📊 Bar
                    </button>
                    <button
                        type="button"
                        className={`btn-chart-mode ${chartMode === "slots" ? "active" : ""}`}
                        onClick={() => setChartMode("slots")}
                        title="Compare Meal Slot Averages"
                    >
                        🍽️ Slot Averages
                    </button>
                    <button
                        type="button"
                        className={`btn-chart-mode ${chartMode === "distribution" ? "active" : ""}`}
                        onClick={() => setChartMode("distribution")}
                        title="Time in Target Range Breakdown"
                    >
                        🎯 Target Range
                    </button>
                </div>
            </div>

            {/* Quick Metrics Banner */}
            {stats && (
                <div className="chart-quick-metrics">
                    <div className="metric-chip">
                        <span className="chip-label">Average</span>
                        <strong>{stats.avg}</strong> <small>mg/dL</small>
                    </div>
                    <div className="metric-chip">
                        <span className="chip-label">Peak</span>
                        <strong>{stats.highest}</strong> <small>mg/dL</small>
                    </div>
                    <div className="metric-chip">
                        <span className="chip-label">Lowest</span>
                        <strong>{stats.lowest}</strong> <small>mg/dL</small>
                    </div>
                    <div className="metric-chip highlight-target">
                        <span className="chip-label">Time-In-Range</span>
                        <strong className="text-emerald">{stats.timeInRange}%</strong>
                    </div>
                </div>
            )}

            {readings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3 className="empty-title">No chart data available</h3>
                    <p className="empty-desc">
                        There are no glucose readings logged matching the selected filters.
                    </p>
                </div>
            ) : (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={340}>
                        {/* 1. AREA CHART VIEW */}
                        {chartMode === "area" && (
                            <AreaChart
                                data={timelineData}
                                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
                            >
                                <defs>
                                    <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.28} />
                                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="displayLabel" tickLine={false} stroke="#94a3b8" fontSize={12} />
                                <YAxis domain={[40, "auto"]} tickLine={false} stroke="#94a3b8" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={140} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Max Target: 140", fill: "#059669", fontSize: 11, position: "top" }} />
                                <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: "Min Target: 70", fill: "#2563eb", fontSize: 11, position: "bottom" }} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    name="Glucose Level"
                                    stroke="#e11d48"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#glucoseGradient)"
                                    activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2, fill: "#e11d48" }}
                                />
                            </AreaChart>
                        )}

                        {/* 2. LINE CHART VIEW */}
                        {chartMode === "line" && (
                            <LineChart
                                data={timelineData}
                                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="displayLabel" tickLine={false} stroke="#94a3b8" fontSize={12} />
                                <YAxis domain={[40, "auto"]} tickLine={false} stroke="#94a3b8" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={140} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Upper Target (140)", fill: "#059669", fontSize: 11 }} />
                                <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: "Lower Target (70)", fill: "#2563eb", fontSize: 11 }} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    name="Glucose (mg/dL)"
                                    stroke="#e11d48"
                                    strokeWidth={3}
                                    dot={{ r: 4, stroke: "#e11d48", strokeWidth: 2, fill: "#ffffff" }}
                                    activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 2, fill: "#be123c" }}
                                />
                            </LineChart>
                        )}

                        {/* 3. BAR CHART (INDIVIDUAL READINGS) */}
                        {chartMode === "bar" && (
                            <BarChart
                                data={timelineData}
                                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="displayLabel" tickLine={false} stroke="#94a3b8" fontSize={12} />
                                <YAxis domain={[0, "auto"]} tickLine={false} stroke="#94a3b8" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={140} stroke="#10b981" strokeDasharray="4 4" />
                                <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="4 4" />
                                <Bar dataKey="value" name="Glucose (mg/dL)" radius={[6, 6, 0, 0]}>
                                    {timelineData.map((entry, index) => (
                                        <Cell key={`bar-${index}`} fill={entry.barColor} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}

                        {/* 4. SLOT AVERAGES BAR CHART */}
                        {chartMode === "slots" && (
                            <BarChart
                                data={slotAveragesData}
                                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="shortSlot" tickLine={false} stroke="#94a3b8" fontSize={12} />
                                <YAxis domain={[0, "auto"]} tickLine={false} stroke="#94a3b8" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={140} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Target (140)", fill: "#059669", fontSize: 11 }} />
                                <Bar dataKey="average" name="Slot Average (mg/dL)" radius={[8, 8, 0, 0]}>
                                    {slotAveragesData.map((entry, index) => (
                                        <Cell key={`slot-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}

                        {/* 5. TIME-IN-RANGE DISTRIBUTION CHART */}
                        {chartMode === "distribution" && (
                            <BarChart
                                data={distributionData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 30, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" unit="%" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="percentage" name="% of Total Readings" radius={[0, 8, 8, 0]}>
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`dist-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>

                    {/* Chart Legend & Target Ranges */}
                    <div className="chart-legend-footer">
                        <span className="legend-indicator">
                            <span className="legend-dot dot-low" /> Low (&lt;70 mg/dL)
                        </span>
                        <span className="legend-indicator">
                            <span className="legend-dot dot-normal" /> Normal (70–140 mg/dL)
                        </span>
                        <span className="legend-indicator">
                            <span className="legend-dot dot-elevated" /> Elevated (141–199 mg/dL)
                        </span>
                        <span className="legend-indicator">
                            <span className="legend-dot dot-high" /> High (200+ mg/dL)
                        </span>
                    </div>
                </div>
            )}
        </section>
    );
}

export default GlucoseChart;

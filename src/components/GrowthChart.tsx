import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { formatBaht } from "@/lib/utils";

/**
 * The balance growth chart, split into its own module so the (large) charting
 * library is lazy-loaded after the dashboard's hero content has already
 * painted, instead of blocking first render.
 */
export function GrowthChart({
  data,
  tickInterval,
}: {
  data: { date: string; balance: number }[];
  tickInterval: number;
}) {
  return (
    <div className="-mx-2 mt-2 h-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-growth-500)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-growth-500)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
          />
          <Tooltip
            formatter={(v) => [`฿${formatBaht(Number(v))}`, "ยอดรวม"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--color-line)",
              background: "var(--color-surface)",
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--color-growth-500)"
            strokeWidth={2.5}
            fill="url(#growthFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default GrowthChart;


import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

function RevenueChart({ data = [] }) {
  const formattedData = data.map((item) => ({
    month: item.month,
    revenue: Number(item.revenue) || 0
  }));

  return (
    <section className="analytics-revenue-card">

      <div className="analytics-chart-header">
        <div>
          <span className="analytics-eyebrow">
            FINANCIAL OVERVIEW
          </span>
          <h2>Monthly Revenue</h2>
          <p>Track your practice revenue over time.</p>
        </div>

        <div className="analytics-chart-icon">
          ₹
        </div>
      </div>

      {formattedData.length === 0 ? (
        <div className="analytics-no-data">
          <span>📈</span>
          <p>No revenue data available.</p>
        </div>
      ) : (
        <div className="analytics-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{
                top: 15,
                right: 15,
                left: 10,
                bottom: 5
              }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#eee8f7"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#82778f", fontSize: 12 }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#82778f", fontSize: 12 }}
                tickFormatter={(value) =>
                  `₹${value.toLocaleString("en-IN")}`
                }
              />

              <Tooltip
                cursor={{ fill: "#f5f0ff" }}
                formatter={(value) => [
                  `₹${Number(value).toLocaleString("en-IN")}`,
                  "Revenue"
                ]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #e9e0f7",
                  boxShadow: "0 5px 18px rgba(70, 48, 110, 0.10)"
                }}
              />

              <Bar
                dataKey="revenue"
                fill="#9474df"
                radius={[7, 7, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </section>
  );
}

export default RevenueChart;


import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import StatCard from "../../components/analytics/StatCard";
import RevenueChart from "../../components/analytics/RevenueChart";
import "./Analytics.css";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await axiosInstance.get("/analytics");
        setAnalytics(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <main className="analytics-page">
        <div className="analytics-state">
          <div className="analytics-loader"></div>
          <p>Loading analytics...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="analytics-page">
        <div className="analytics-state analytics-error">
          <h3>Unable to load analytics</h3>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="analytics-page">
        <div className="analytics-state">
          <h3>No analytics data available</h3>
          <p>Your practice statistics will appear here.</p>
        </div>
      </main>
    );
  }

  const access = analytics.featureAccess || {};

  const isAdvanced =
    access.advancedAnalytics === true ||
    analytics.noShowRate !== undefined;

  const hasClientRetention =
    access.clientRetentionAnalytics === true &&
    analytics.clientRetention !== undefined;

  const hasPackageAnalytics =
    access.packageAnalytics === true &&
    analytics.packagePerformance !== undefined;

  const hasPaymentAnalytics =
    access.paymentAnalytics === true &&
    analytics.outstandingPayments !== undefined;

  const hasAppointmentInsights =
    access.appointmentInsights === true &&
    Array.isArray(analytics.popularAppointmentDays);

  const revenueData = (analytics.revenueTrend || []).map((item) => ({
    month: `${item._id.month}/${item._id.year}`,
    revenue: item.revenue
  }));

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const retentionValue =
    typeof analytics.clientRetention === "object"
      ? analytics.clientRetention.repeatClientRate ??
        analytics.clientRetention.rate ??
        analytics.clientRetention.repeatClients ??
        "—"
      : analytics.clientRetention;

  return (
    <main className="analytics-page">

      {/* Page Header */}
      <div className="analytics-header">
        <div>
          <span className="analytics-eyebrow">
            PRACTICE OVERVIEW
          </span>
          <h1>Practice Analytics</h1>
          <p>
            Track your practice performance and understand your growth.
          </p>
        </div>
      </div>

      {/* Basic Analytics - All Plans */}
      <section className="analytics-stats-grid">
        <StatCard
          title="Active Clients"
          value={analytics.activeClients}
          description="Currently active clients"
          icon="👥"
        />

        <StatCard
          title="Total Sessions"
          value={analytics.totalSessions}
          description="Total sessions recorded"
          icon="📅"
        />

        <StatCard
          title="New Clients This Month"
          value={analytics.newClientsThisMonth ?? 0}
          description="Recently joined clients"
          icon="✨"
        />

        <StatCard
          title="Sessions This Month"
          value={analytics.sessionsThisMonth ?? 0}
          description="Sessions scheduled this month"
          icon="📊"
        />
      </section>

      {/* Pro and Premium Analytics */}
      {isAdvanced ? (
        <div className="analytics-advanced-section">

          <h2>Advanced Practice Analytics</h2>

          <section className="analytics-stats-grid">
            <StatCard
              title="Completed Sessions"
              value={analytics.completedSessions ?? 0}
              description="Successfully completed sessions"
              icon="✅"
            />

            <StatCard
              title="Cancelled Sessions"
              value={analytics.cancelledSessions ?? 0}
              description="Cancelled appointments"
              icon="❌"
            />

            <StatCard
              title="No-Show Rate"
              value={`${analytics.noShowRate ?? 0}%`}
              description={`${analytics.noShowSessions ?? 0} no-show sessions`}
              icon="📉"
            />

            <StatCard
              title="Total Revenue"
              value={formatCurrency(analytics.totalRevenue)}
              description="Revenue from successful practice payments"
              icon="💰"
            />
          </section>

          <RevenueChart data={revenueData} />

          {/* Premium Analytics */}
          {(hasClientRetention ||
            hasPackageAnalytics ||
            hasPaymentAnalytics ||
            hasAppointmentInsights) && (
            <section className="analytics-premium-section">

              <h2>Premium Practice Insights</h2>

              {/* Client Retention */}
              {hasClientRetention && (
                <section className="analytics-stats-grid">
                  <StatCard
                    title="Repeat Client Insights"
                    value={
                      typeof retentionValue === "number" &&
                      retentionValue <= 100
                        ? `${retentionValue}%`
                        : retentionValue
                    }
                    description="Clients returning for additional sessions"
                    icon="🔁"
                  />
                </section>
              )}

              {/* Package Analytics */}
              {hasPackageAnalytics && (
                <>
                  <h3>Package Performance</h3>

                  <section className="analytics-stats-grid">
                    <StatCard
                      title="Total Package Sales"
                      value={analytics.totalPackageSales ?? 0}
                      description="Successfully sold packages"
                      icon="📦"
                    />
                  </section>

                  {Array.isArray(analytics.packagePerformance) &&
                    analytics.packagePerformance.length > 0 && (
                      <div className="analytics-insights-list">
                        {analytics.packagePerformance.map((item, index) => (
                          <div
                            className="analytics-insight-row"
                            key={item.packageName || item._id || index}
                          >
                            <strong>
                              {item.packageName || item.name || "Package"}
                            </strong>
                            <span>
                              {item.totalSales ?? item.sales ?? 0} sales
                            </span>
                            <span>
                              {formatCurrency(item.revenue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </>
              )}

              {/* Payment Analytics */}
              {hasPaymentAnalytics && (
                <>
                  <h3>Payment Insights</h3>

                  <section className="analytics-stats-grid">
                    <StatCard
                      title="Outstanding Payments"
                      value={formatCurrency(
                        analytics.outstandingPayments?.amount
                      )}
                      description={`${analytics.outstandingPayments?.count ?? 0} pending payments`}
                      icon="💳"
                    />
                  </section>
                </>
              )}

              {/* Appointment Insights */}
              {hasAppointmentInsights && (
                <>
                  <h3>Popular Appointment Days</h3>

                  <div className="analytics-insights-list">
                    {analytics.popularAppointmentDays.length === 0 ? (
                      <p>No appointment insights available yet.</p>
                    ) : (
                      analytics.popularAppointmentDays.map((item, index) => (
                        <div
                          className="analytics-insight-row"
                          key={item.day || index}
                        >
                          <strong>{item.day}</strong>
                          <span>
                            {item.totalSessions} sessions
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

            </section>
          )}
        </div>
      ) : (
        /* Free Plan Upgrade Section */
        <section className="analytics-upgrade-card">
          <div className="upgrade-icon">✦</div>

          <span className="analytics-eyebrow">
            ADVANCED FEATURES
          </span>

          <h2>Unlock Advanced Analytics</h2>

          <p>
            Upgrade to Pro to access revenue trends, completed sessions,
            cancellations and detailed appointment attendance statistics.
            Premium also unlocks additional practice insights.
          </p>

          <a
            href="/dashboard#subscription"
            className="analytics-upgrade-button"
          >
            View Upgrade Options
            <span>→</span>
          </a>
        </section>
      )}

    </main>
  );
}

export default Analytics;

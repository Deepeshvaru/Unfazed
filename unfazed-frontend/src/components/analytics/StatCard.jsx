
function StatCard({ title, value, description, icon }) {
  return (
    <section className="analytics-stat-card">

      <div className="analytics-stat-top">
        <div className="analytics-stat-icon">
          {icon}
        </div>

        <span className="analytics-stat-indicator">
          Practice
        </span>
      </div>

      <div className="analytics-stat-content">
        <h3>{title}</h3>
        <h2>{value ?? "—"}</h2>
        <p>{description}</p>
      </div>

    </section>
  );
}

export default StatCard;

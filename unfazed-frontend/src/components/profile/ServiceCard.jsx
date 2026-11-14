
function ServiceCard({ service }) {
  return (
    <article className="service-card">
      <div className="service-icon">✦</div>

      <h3 className="service-name">
        {service.name || "Therapy Session"}
      </h3>

      <p className="service-description">
        {service.description || "Professional therapy session."}
      </p>

      {service.sessionsCount && (
        <p className="service-sessions">
          {service.sessionsCount} sessions
        </p>
      )}

      {service.price !== undefined && (
        <div className="service-price-row">
          <span className="service-price">
            ₹{Number(service.price).toLocaleString("en-IN")}
          </span>
          <span className="service-price-label">Package price</span>
        </div>
      )}
    </article>
  );
}

export default ServiceCard;

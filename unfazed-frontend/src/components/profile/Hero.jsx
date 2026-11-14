
function Hero({ therapist }) {
  return (
    <section className="profile-hero">
      <div className="profile-hero-decoration profile-hero-decoration-one" />
      <div className="profile-hero-decoration profile-hero-decoration-two" />

      <div className="profile-hero-content">
        <span className="profile-hero-badge">
          YOUR SPACE FOR WELL-BEING
        </span>

        <div className="profile-avatar">
          {(therapist?.name || "T").charAt(0).toUpperCase()}
        </div>

        <h1 className="profile-hero-name">
          {therapist?.name || "Therapist"}
        </h1>

        <p className="profile-hero-description">
          {therapist?.bio || "Welcome to my professional profile."}
        </p>

        {therapist?.languages?.length > 0 && (
          <div className="profile-hero-languages">
            <span>Languages:</span>
            {therapist.languages.join(" · ")}
          </div>
        )}
      </div>
    </section>
  );
}

export default Hero;

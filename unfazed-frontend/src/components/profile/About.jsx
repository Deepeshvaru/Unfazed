
function About({ therapist }) {
  return (
    <section className="about-card">
      <div className="section-heading-group">
        <span className="section-eyebrow">GET TO KNOW YOUR THERAPIST</span>
        <h2 className="section-title">About Me</h2>
      </div>

      <p className="about-description">
        {therapist?.bio || "Profile information coming soon."}
      </p>

      <div className="about-divider" />

      <div className="about-details-grid">
        <div className="about-detail">
          <h3 className="about-subheading">Specializations</h3>

          {therapist?.specializations?.length > 0 ? (
            <div className="profile-tag-list">
              {therapist.specializations.map((item, index) => (
                <span className="profile-tag" key={index}>
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="profile-muted">No specializations added yet.</p>
          )}
        </div>

        <div className="about-detail">
          <h3 className="about-subheading">Languages</h3>

          {therapist?.languages?.length > 0 ? (
            <div className="profile-tag-list">
              {therapist.languages.map((language, index) => (
                <span className="profile-tag profile-language-tag" key={index}>
                  {language}
                </span>
              ))}
            </div>
          ) : (
            <p className="profile-muted">Not specified</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default About;

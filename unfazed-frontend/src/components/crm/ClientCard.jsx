
import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN");
}

function ClientCard({ data, onClose }) {
  const client = data?.client;

  const [showIntake, setShowIntake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedClient, setSavedClient] = useState(client);

  const [form, setForm] = useState({
    age: client?.age || "",
    gender: client?.gender || "",
    occupation: client?.occupation || "",
    presentingConcern: client?.presentingConcern || "",
    relevantHistory: client?.relevantHistory || "",
    therapyGoals: client?.therapyGoals || "",
    consentGiven: false
  });

  if (!client) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const submitIntake = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await axiosInstance.put(
        `/clients/${client._id}/intake`,
        {
          ...form,
          age: form.age ? Number(form.age) : undefined
        }
      );

      setSavedClient(response.data.client);
      setSuccess("Intake information submitted successfully.");
      setShowIntake(false);
      setForm((previous) => ({
        ...previous,
        consentGiven: false
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to submit intake information."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <button type="button" onClick={onClose}>
        Back to Clients
      </button>

      {success && <p>{success}</p>}
      {error && <p role="alert">{error}</p>}

      {showIntake ? (
        <>
          <h2>Client Intake Form</h2>
          <p>Please complete this form before submitting.</p>

          <form onSubmit={submitIntake}>
            <label>
              Age
              <input
                type="number"
                name="age"
                min="1"
                max="120"
                value={form.age}
                onChange={handleChange}
              />
            </label>

            <label>
              Gender
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">
                  Prefer not to say
                </option>
              </select>
            </label>

            <label>
              Occupation
              <input
                type="text"
                name="occupation"
                value={form.occupation}
                onChange={handleChange}
              />
            </label>

            <label>
              Presenting Concern
              <textarea
                name="presentingConcern"
                value={form.presentingConcern}
                onChange={handleChange}
                placeholder="What would you like support with?"
                required
              />
            </label>

            <label>
              Relevant History
              <textarea
                name="relevantHistory"
                value={form.relevantHistory}
                onChange={handleChange}
                placeholder="Share any relevant background information."
              />
            </label>

            <label>
              Therapy Goals
              <textarea
                name="therapyGoals"
                value={form.therapyGoals}
                onChange={handleChange}
                placeholder="What would you like to work towards?"
              />
            </label>

            <label>
              <input
                type="checkbox"
                name="consentGiven"
                checked={form.consentGiven}
                onChange={handleChange}
                required
              />
              I have read and agree to the intake information being
              submitted to my therapist.
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Intake"}
            </button>

            <button
              type="button"
              onClick={() => setShowIntake(false)}
            >
              Cancel
            </button>
          </form>
        </>
      ) : (
        <>
          <h2>{savedClient.name}</h2>
          <p>Email: {savedClient.email}</p>
          <p>Phone: {savedClient.phone || "Not provided"}</p>
          <p>Status: {savedClient.status}</p>
          <p>Age: {savedClient.age || "Not provided"}</p>
          <p>Gender: {savedClient.gender || "Not provided"}</p>
          <p>Occupation: {savedClient.occupation || "Not provided"}</p>

          <hr />

          <h3>Intake Information</h3>
          <p>
            Presenting concern: {savedClient.presentingConcern || "Not submitted"}
          </p>
          <p>
            Relevant history: {savedClient.relevantHistory || "Not submitted"}
          </p>
          <p>
            Therapy goals: {savedClient.therapyGoals || "Not submitted"}
          </p>
          <p>
            Consent: {savedClient.consentGiven ? "Recorded" : "Not recorded"}
          </p>
          <p>Consent date: {formatDate(savedClient.consentAt)}</p>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setForm({
                age: savedClient.age || "",
                gender: savedClient.gender || "",
                occupation: savedClient.occupation || "",
                presentingConcern: savedClient.presentingConcern || "",
                relevantHistory: savedClient.relevantHistory || "",
                therapyGoals: savedClient.therapyGoals || "",
                consentGiven: false
              });
              setShowIntake(true);
            }}
          >
            {savedClient.intakeSubmittedAt ? "Update Intake" : "Open Intake Form"}
          </button>

          <hr />

          <h3>Appointment History ({data.sessions?.length || 0})</h3>

          {data.sessions?.length ? (
            <ul>
              {data.sessions.map((session) => (
                <li key={session._id}>
                  {formatDate(session.date)} — {session.startTime} to{" "}
                  {session.endTime} — {session.status}
                </li>
              ))}
            </ul>
          ) : (
            <p>No linked appointments found.</p>
          )}

          <hr />

          <h3>Payment History ({data.payments?.length || 0})</h3>

          {data.payments?.length ? (
            <ul>
              {data.payments.map((payment) => (
                <li key={payment._id}>
                  {payment.currency || "INR"} {payment.amount} —{" "}
                  {payment.status} — {formatDate(payment.createdAt)}
                </li>
              ))}
            </ul>
          ) : (
            <p>No linked payments found.</p>
          )}
        </>
      )}
    </section>
    
  );
}

export default ClientCard;

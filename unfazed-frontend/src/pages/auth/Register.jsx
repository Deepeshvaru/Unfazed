
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Register() {
  const { register, registerClient } = useAuth();
  const navigate = useNavigate();

 const [searchParams] = useSearchParams();

const accountType =
  searchParams.get("type") === "client" ? "client" : "therapist";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const form = { name, email, password };

      if (accountType === "therapist") {
        await register(form);
        navigate("/dashboard");
      } else {
        await registerClient(form);
        navigate("/portal");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-brand">
        <h1>UNFAZED</h1>
        <p>Build your private practice with confidence.</p>
      </div>

      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join the Unfazed platform.</p>

        <form onSubmit={handleSubmit}>
        

          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to={`/login?type=${accountType}`}>Sign In</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;

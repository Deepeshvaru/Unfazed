
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const { login, loginClient } = useAuth();
  const navigate = useNavigate();

 const [searchParams] = useSearchParams();

const accountType =
  searchParams.get("type") === "client" ? "client" : "therapist";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (accountType === "therapist") {
        await login(email, password);
        navigate("/dashboard");
      } else {
        await loginClient(email, password);
        navigate("/portal");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-brand">
        <h1>UNFAZED</h1>
        <p>Your practice. Your space. Your impact.</p>
      </div>

      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your Unfazed account.</p>

        <form onSubmit={handleSubmit}>
        

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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to={`/register?type=${accountType}`}>Create Account</Link>
        </p>
      </div>
    </main>
  );
}

export default Login;

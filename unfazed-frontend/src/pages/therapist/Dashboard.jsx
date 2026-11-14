
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";
import useEntitlement from "../../hooks/useEntitlement";
import "./Dashboard.css";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Dashboard() {
  const location = useLocation();
  const { therapist, updateTherapist } = useAuth();

  const {
    plan,
    planConfig,
    loading: subscriptionLoading,
    error: subscriptionError,
    refreshSubscription
  } = useEntitlement();

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planError, setPlanError] = useState("");
  const [changingPlan, setChangingPlan] = useState("");
  const [planMessage, setPlanMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    specializations: "",
    languages: ""
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentPage = location.pathname;

  useEffect(() => {
    if (therapist) {
      setFormData({
        name: therapist.name || "",
        bio: therapist.bio || "",
        specializations: (therapist.specializations || []).join(", "),
        languages: (therapist.languages || []).join(", ")
      });
    }
  }, [therapist]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        setPlanError("");

        const { data } = await axiosInstance.get("/subscriptions/plans");
        setPlans(data);
      } catch (err) {
        setPlanError(
          err.response?.data?.message ||
          "Unable to load subscription plans."
        );
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const profileData = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        specializations: formData.specializations
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        languages: formData.languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      };

      const { data } = await axiosInstance.put(
        "/therapists/profile",
        profileData
      );

      const updatedTherapist = data.therapist || {
        ...therapist,
        ...profileData
      };

      updateTherapist(updatedTherapist);
      setMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err.response || err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePlan = async (tier) => {
    try {
      setChangingPlan(tier);
      setPlanError("");
      setPlanMessage("");

      if (tier === "free") {
        const { data } = await axiosInstance.put(
          "/subscriptions/change",
          { tier: "free" }
        );

        await refreshSubscription();
        setPlanMessage(data.message || "Free plan activated.");
        return;
      }

      const { data } = await axiosInstance.post(
        "/subscriptions/create-order",
        { tier }
      );

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout.");
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Unfazed",
        description: `${tier.toUpperCase()} Subscription`,
        order_id: data.orderId,

        prefill: {
          name: therapist?.name || "",
          email: therapist?.email || ""
        },

        handler: async function (response) {
          try {
            setPlanError("");
            setPlanMessage("Verifying payment...");

            const verification = await axiosInstance.post(
              "/subscriptions/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            );

            await refreshSubscription();

            setPlanMessage(
              verification.data.message ||
              "Subscription activated successfully!"
            );
          } catch (err) {
            setPlanMessage("");

            setPlanError(
              err.response?.data?.message ||
              "Payment verification failed. Your plan has not been activated."
            );
          }
        },

        modal: {
          ondismiss: function () {
            setPlanMessage("");
            setPlanError(
              "Checkout was closed. Your subscription has not been changed."
            );
          }
        },

        theme: {
          color: "#6C63FF"
        }
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (response) {
        setPlanMessage("");

        setPlanError(
          response.error?.description ||
          "Payment failed. Your subscription has not been changed."
        );
      });

      checkout.open();
    } catch (err) {
      setPlanError(
        err.response?.data?.message ||
        err.message ||
        "Unable to process subscription."
      );
    } finally {
      setChangingPlan("");
    }
  };

  // Dashboard overview
  if (currentPage === "/dashboard") {
    return (
      <div className="dashboard-page">
        <h1>Welcome, {therapist?.name || "Therapist"}!</h1>
        <p>Here's your practice workspace.</p>

        <section>
          <h2>Practice Overview</h2>
          <p>
            Manage your clients, appointments, clinical notes and
            practice performance from one place.
          </p>
        </section>

        <section>
          <h2>Your Profile</h2>
          <p>Name: {therapist?.name || "Not available"}</p>
          <p>Email: {therapist?.email || "Not available"}</p>

          <p>
            Public link:{" "}
            <a
              href={`/${therapist?.slug || ""}`}
              target="_blank"
              rel="noreferrer"
            >
              /{therapist?.slug || "your-slug"}
            </a>
          </p>

          <Link to="/profile">Edit Profile</Link>
        </section>

        <section>
          <h2>Current Subscription</h2>

          {subscriptionLoading ? (
            <p>Loading subscription...</p>
          ) : (
            <>
              <p>
                Plan: <strong>{planConfig?.name || plan}</strong>
              </p>
              {subscriptionError && <p>{subscriptionError}</p>}
              <Link to="/subscription">Manage Subscription</Link>
            </>
          )}
        </section>

        <section>
          <h2>Manage Your Practice</h2>

          <div>
            <h3>Clients</h3>
            <p>Manage your client records.</p>
            <Link to="/clients">View Clients</Link>
          </div>

          <div>
            <h3>Schedule</h3>
            <p>Manage your appointments.</p>
            <Link to="/schedule">View Schedule</Link>
          </div>

          <div>
            <h3>Clinical Notes</h3>
            <p>Manage your session notes.</p>
            <Link to="/notes">View Notes</Link>
          </div>

          <div>
            <h3>Analytics</h3>
            <p>View your practice performance.</p>
            <Link to="/analytics">View Analytics</Link>
          </div>

          <div>
            <h3>Payments & Packages</h3>
            <p>Create therapy packages and manage client payments.</p>
            <Link to="/payments">Manage Payments</Link>
          </div>
        </section>
      </div>
    );
  }

  // Edit Profile page
  if (currentPage === "/profile") {
    return (
      <div className="profile-page">
        <h1>My Profile</h1>
        <p>Manage your professional therapist profile.</p>

        <section>
          <h2>Profile Information</h2>

          <p>Email: {therapist?.email || "Not available"}</p>
          <p>
            Public link:{" "}
            <a
              href={`/${therapist?.slug || ""}`}
              target="_blank"
              rel="noreferrer"
            >
              /{therapist?.slug || "your-slug"}
            </a>
          </p>
        </section>

        <section>
          <h2>Edit Your Profile</h2>

          <form onSubmit={handleSubmit}>
            <div>
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>About / Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="5"
              />
            </div>

            <div>
              <label>Specializations</label>
              <input
                type="text"
                name="specializations"
                value={formData.specializations}
                onChange={handleChange}
                placeholder="Anxiety, Stress, Depression"
              />
              <small>Separate multiple specializations with commas.</small>
            </div>

            <div>
              <label>Languages</label>
              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleChange}
                placeholder="English, Hindi, Marathi"
              />
              <small>Separate multiple languages with commas.</small>
            </div>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>

            {message && <p>{message}</p>}
            {error && <p role="alert">{error}</p>}
          </form>
        </section>
      </div>
    );
  }

  // Subscription page
  if (currentPage === "/subscription") {
    return (
      <div className="subscription-page">
        <h1>Subscription Plans</h1>
        <p>Choose the plan that suits your practice.</p>

        {subscriptionLoading || plansLoading ? (
          <p>Loading subscription details...</p>
        ) : (
          <>
            <section>
              <h2>Your Current Plan</h2>
              <p>
                <strong>{planConfig?.name || plan}</strong>
              </p>
            </section>

            {subscriptionError && <p role="alert">{subscriptionError}</p>}
            {planError && <p role="alert">{planError}</p>}
            {planMessage && <p>{planMessage}</p>}

            <section>
              <h2>Available Plans</h2>

              {plans.map((item) => (
                <article key={item._id}>
                  <h3>{item.name.toUpperCase()}</h3>

                  <h2>
                    ₹{Number(item.price).toLocaleString("en-IN")}
                  </h2>

                  <p>
                    Maximum clients:{" "}
                    {item.limits?.maxClients === -1
                      ? "Unlimited"
                      : item.limits?.maxClients ?? "Not specified"}
                  </p>

                  <p>
                    Analytics: {item.analyticsLevel || "basic"}
                  </p>

                  <p>Available features:</p>

                  <ul>
                    {(item.features || []).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>

                  <p>
                    Note templates:{" "}
                    {(item.noteTemplates || ["basic"]).join(", ")}
                  </p>

                  <button
                    type="button"
                    disabled={plan === item.name || changingPlan !== ""}
                    onClick={() => handleChangePlan(item.name)}
                  >
                    {changingPlan === item.name
                      ? "Processing..."
                      : plan === item.name
                      ? "Current Plan"
                      : item.name === "free"
                      ? "Select Free Plan"
                      : `Upgrade to ${item.name.toUpperCase()}`}
                  </button>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    );
  }

  return null;
}

export default Dashboard;

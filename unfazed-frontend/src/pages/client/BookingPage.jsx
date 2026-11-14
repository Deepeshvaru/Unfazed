
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./BookingPage.css";

import Hero from "../../components/profile/Hero";
import About from "../../components/profile/About";
import ServiceCard from "../../components/profile/ServiceCard";
import Calendar from "../../components/scheduling/Calendar";
import SlotPicker from "../../components/scheduling/SlotPicker";
import { useAuth } from "../../context/AuthContext";

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function loadRazorpayScript() {
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
}

function BookingPage() {
  const { isClient, client } = useAuth();
  const { slug } = useParams();
  const bookingRef = useRef(null);

  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [date, setDate] = useState(getTomorrow());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [sessionType, setSessionType] = useState("online");

  const [intake, setIntake] = useState({
    age: "",
    gender: "",
    occupation: "",
    presentingConcern: "",
    relevantHistory: "",
    therapyGoals: ""
  });

  const [consentGiven, setConsentGiven] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  const updateIntake = (field, value) => {
    setIntake((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  // Fetch therapist profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await axiosInstance.get(`/therapists/${slug}`);
        setTherapist(data.therapist || data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Therapist profile could not be found."
        );
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProfile();
    } else {
      setError("No therapist selected.");
      setLoading(false);
    }
  }, [slug]);

  // Fetch active packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);

        const { data } = await axiosInstance.get(
          `/payments/public/packages/${slug}`
        );

        setPackages(data.packages || []);
      } catch (err) {
        console.error("Package loading error:", err);
        setPackages([]);
      } finally {
        setPackagesLoading(false);
      }
    };

    if (slug) fetchPackages();
  }, [slug]);

  // Update page metadata
  useEffect(() => {
    if (!therapist) return;

    document.title = `${therapist.name || "Therapist"} | Unfazed`;

    let description = document.querySelector(
      'meta[name="description"]'
    );

    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }

    description.content =
      therapist.bio || "View therapist profile on Unfazed.";
  }, [therapist]);

  // Fetch available slots
  useEffect(() => {
    if (!slug || !date) return;

    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        setBookingError("");
        setSelectedSlot(null);

        const { data } = await axiosInstance.get(
          `/scheduling/public/${slug}/availability`,
          { params: { date } }
        );

        setSlots(data.slots || []);
      } catch (err) {
        setSlots([]);

        setBookingError(
          err.response?.data?.message ||
          "Could not load available appointment slots."
        );
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [slug, date]);

  // Create order, open Razorpay and verify payment
  const makePackagePayment = async () => {
    const loaded = await loadRazorpayScript();

    if (!loaded) {
      throw new Error("Razorpay could not be loaded. Please try again.");
    }

    const { data: order } = await axiosInstance.post(
      "/payments/client/create-order",
      {
        packageId: selectedPackage._id,
        slug
      }
    );

    return new Promise((resolve, reject) => {
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Unfazed",
        description: `Purchase ${order.packageName}`,
        order_id: order.orderId,

        prefill: {
          name: client?.name || "",
          email: client?.email || ""
        },

        theme: {
          color: "#7650bd"
        },

        handler: async (response) => {
          try {
            const { data } = await axiosInstance.post(
              "/payments/client/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            );

            resolve(data);
          } catch (err) {
            reject(
              new Error(
                err.response?.data?.message ||
                "Payment verification failed."
              )
            );
          }
        },

        modal: {
          ondismiss: () => {
            reject(new Error("Payment was cancelled."));
          }
        }
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        reject(
          new Error(
            response.error?.description ||
            "Payment failed. Please try again."
          )
        );
      });

      checkout.open();
    });
  };

  // Book appointment, with optional package purchase
  const handleBooking = async (e) => {
    e.preventDefault();

    if (!selectedSlot) {
      setBookingError("Please select an appointment time.");
      return;
    }

    if (!isClient && (!clientName.trim() || !clientEmail.trim())) {
      setBookingError("Please enter your name and email.");
      return;
    }

    if (!intake.presentingConcern.trim()) {
      setBookingError(
        "Please describe the main reason for seeking therapy."
      );
      return;
    }

    if (
      intake.age &&
      (
        !Number.isInteger(Number(intake.age)) ||
        Number(intake.age) < 1 ||
        Number(intake.age) > 120
      )
    ) {
      setBookingError("Please enter a valid age.");
      return;
    }

    if (!consentGiven) {
      setBookingError("Please provide consent before booking.");
      return;
    }

    if (selectedPackage && !isClient) {
      setBookingError(
        "Please log in as a client before purchasing a package."
      );
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");
      setMessage("");

      if (selectedPackage) {
        await makePackagePayment();
      }

      const bookingUrl = isClient
        ? `/scheduling/client/${slug}/book`
        : `/scheduling/public/${slug}/book`;

      const bookingData = {
        date,
        startTime: selectedSlot.startTime,
        duration: selectedSlot.duration,
        sessionType,
        age: intake.age ? Number(intake.age) : undefined,
        gender: intake.gender,
        occupation: intake.occupation,
        presentingConcern: intake.presentingConcern,
        relevantHistory: intake.relevantHistory,
        therapyGoals: intake.therapyGoals,
        consentGiven
      };

      if (!isClient) {
        bookingData.clientName = clientName;
        bookingData.clientEmail = clientEmail;
      }

      const { data } = await axiosInstance.post(
        bookingUrl,
        bookingData
      );

      setMessage(
        selectedPackage
          ? "Payment successful! Your package is activated and your appointment is booked."
          : data.message || "Appointment booked successfully!"
      );

      setClientName("");
      setClientEmail("");
      setSelectedSlot(null);
      setSelectedPackage(null);

      const response = await axiosInstance.get(
        `/scheduling/public/${slug}/availability`,
        { params: { date } }
      );

      setSlots(response.data.slots || []);
    } catch (err) {
      setBookingError(
        err.response?.data?.message ||
        err.message ||
        "Booking failed. Please try again."
      );

      try {
        const response = await axiosInstance.get(
          `/scheduling/public/${slug}/availability`,
          { params: { date } }
        );

        setSlots(response.data.slots || []);
      } catch {
        setSlots([]);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const services = therapist?.services || [];

  if (loading) {
    return (
      <main className="public-profile-page">
        <p className="profile-status">Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="public-profile-page">
        <p className="profile-status profile-status-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="public-profile-page">
      <Hero therapist={therapist} />

      <div className="profile-content">
        <About therapist={therapist} />

        {services.length > 0 && (
          <section className="profile-section">
            <div className="section-heading-group">
              <span className="section-eyebrow">WHAT I OFFER</span>
              <h2 className="section-title">Services</h2>
              <p className="section-description">
                Explore the professional services available to support you.
              </p>
            </div>

            <div className="service-list">
              {services.map((service, index) => (
                <ServiceCard
                  key={service._id || index}
                  service={service}
                />
              ))}
            </div>
          </section>
        )}

        <section className="profile-section">
          <div className="section-heading-group">
            <span className="section-eyebrow">FLEXIBLE OPTIONS</span>
            <h2 className="section-title">Available Packages</h2>
            <p className="section-description">
              Choose a package if you would like to purchase multiple sessions.
            </p>
          </div>

          {packagesLoading ? (
            <p className="profile-muted">Loading packages...</p>
          ) : packages.length === 0 ? (
            <p className="profile-muted">
              No active packages are available currently.
            </p>
          ) : (
            <div className="package-grid">
              {packages.map((item) => {
                const isSelected = selectedPackage?._id === item._id;

                return (
                  <article
                    key={item._id}
                    className={`package-card ${isSelected ? "package-card-selected" : ""}`}
                  >
                    {isSelected && (
                      <span className="package-selected-label">
                        Selected
                      </span>
                    )}

                    <h3 className="package-name">{item.name}</h3>

                    <p className="package-description">
                      {item.description || "A structured therapy package."}
                    </p>

                    <div className="package-price">
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </div>

                    <div className="package-details">
                      <span>{item.sessionsCount} sessions</span>
                      <span>Valid for {item.validityDays} days</span>
                    </div>

                    <button
                      type="button"
                      className={isSelected ? "profile-button profile-button-outline" : "profile-button"}
                      onClick={() => {
                        setSelectedPackage(isSelected ? null : item);
                        setBookingError("");
                      }}
                    >
                      {isSelected ? "Remove Selection" : "Select Package"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {selectedPackage && (
            <div className="selected-package-message">
              Selected: <strong>{selectedPackage.name}</strong>
              {" — "}₹{Number(selectedPackage.price).toLocaleString("en-IN")}
            </div>
          )}

          {selectedPackage && !isClient && (
            <p className="profile-alert profile-alert-error">
              Log in as a client to purchase this package. You can still book
              an appointment without purchasing a package.
            </p>
          )}

          <button
            type="button"
            className="profile-button profile-button-secondary"
            onClick={() =>
              bookingRef.current?.scrollIntoView({
                behavior: "smooth"
              })
            }
          >
            Book an Appointment
          </button>
        </section>

        <section
          ref={bookingRef}
          className="booking-panel"
        >
          <div className="section-heading-group">
            <span className="section-eyebrow">TAKE THE FIRST STEP</span>
            <h2 className="section-title">Book Your Appointment</h2>
            <p className="section-description">
              Select a date and choose an available appointment time.
            </p>
          </div>

          {message && (
            <p className="profile-alert profile-alert-success">
              {message}
            </p>
          )}

          {bookingError && (
            <p className="profile-alert profile-alert-error">
              {bookingError}
            </p>
          )}

          <div className="booking-step">
            <h3 className="booking-subtitle">1. Choose a date</h3>
            <Calendar
              value={date}
              min={getTomorrow()}
              onChange={(newDate) => {
                setDate(newDate);
                setMessage("");
                setBookingError("");
              }}
            />
          </div>

          <div className="booking-step">
            <h3 className="booking-subtitle">2. Select a time slot</h3>

            {slotsLoading ? (
              <p className="profile-muted">Loading available slots...</p>
            ) : (
              <SlotPicker
                slots={slots}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
              />
            )}

            {selectedSlot && (
              <div className="selected-slot-message">
                <strong>Selected:</strong> {selectedSlot.startTime} –{" "}
                {selectedSlot.endTime} ({selectedSlot.duration} minutes)
              </div>
            )}
          </div>

          <form onSubmit={handleBooking} className="booking-form">
            <div className="booking-step">
              <h3 className="booking-subtitle">3. Your details</h3>

              {!isClient ? (
                <div className="form-grid">
                  <label className="profile-field">
                    Your name
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter your name"
                      className="profile-input"
                    />
                  </label>

                  <label className="profile-field">
                    Email address
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="profile-input"
                    />
                  </label>
                </div>
              ) : (
                <div className="logged-in-client">
                  <span className="logged-in-label">Booking as</span>
                  <strong>{client?.name}</strong>
                  <span>{client?.email}</span>
                </div>
              )}
            </div>

            <div className="intake-panel">
              <div>
                <h3 className="booking-subtitle">4. Client Intake Form</h3>
                <p className="section-description">
                  Share some basic information to help your therapist
                  understand your needs before your appointment.
                </p>
              </div>

              <div className="form-grid">
                <label className="profile-field">
                  Age
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={intake.age}
                    onChange={(e) => updateIntake("age", e.target.value)}
                    placeholder="Enter your age"
                    className="profile-input"
                  />
                </label>

                <label className="profile-field">
                  Gender
                  <select
                    value={intake.gender}
                    onChange={(e) => updateIntake("gender", e.target.value)}
                    className="profile-input"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="profile-field form-field-full">
                  Occupation
                  <input
                    type="text"
                    value={intake.occupation}
                    onChange={(e) => updateIntake("occupation", e.target.value)}
                    placeholder="Student, working professional, etc."
                    className="profile-input"
                  />
                </label>

                <label className="profile-field form-field-full">
                  What would you like help with? *
                  <textarea
                    required
                    rows="3"
                    value={intake.presentingConcern}
                    onChange={(e) =>
                      updateIntake("presentingConcern", e.target.value)
                    }
                    placeholder="Briefly describe what brings you to therapy."
                    className="profile-input profile-textarea"
                  />
                </label>

                <label className="profile-field form-field-full">
                  Relevant history (optional)
                  <textarea
                    rows="3"
                    value={intake.relevantHistory}
                    onChange={(e) =>
                      updateIntake("relevantHistory", e.target.value)
                    }
                    placeholder="Share any background information you feel comfortable providing."
                    className="profile-input profile-textarea"
                  />
                </label>

                <label className="profile-field form-field-full">
                  Your therapy goals (optional)
                  <textarea
                    rows="3"
                    value={intake.therapyGoals}
                    onChange={(e) =>
                      updateIntake("therapyGoals", e.target.value)
                    }
                    placeholder="What would you like to work towards?"
                    className="profile-input profile-textarea"
                  />
                </label>
              </div>

              <label className="consent-field">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                />
                <span>
                  I consent to sharing the information provided in this form
                  with this therapist for appointment and care-related purposes.
                </span>
              </label>
            </div>

            <div className="booking-step">
              <h3 className="booking-subtitle">5. Session preference</h3>

              <label className="profile-field">
                Session type
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="profile-input"
                >
                  <option value="online">Online</option>
                  <option value="in-person">In-person</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={!selectedSlot || bookingLoading || slotsLoading}
              className="profile-button booking-submit-button"
            >
              {bookingLoading
                ? "Processing..."
                : selectedPackage
                  ? "Pay & Book Appointment"
                  : "Confirm Appointment"}
            </button>
          </form>
        </section>
      </div>

      <footer className="profile-footer">
        <span>Powered by <strong>Unfazed</strong></span>
      </footer>
    </main>
  );
}

export default BookingPage;


import { useEffect, useState, useCallback } from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Dashboard from "../pages/therapist/Dashboard";
import Clients from "../pages/therapist/Clients";
import Schedule from "../pages/therapist/Schedule";
import Notes from "../pages/therapist/Notes";
import Analytics from "../pages/therapist/Analytics";
import Payments from "../pages/therapist/Payment";

import BookingPage from "../pages/client/BookingPage";
import ClientPortal from "../pages/client/ClientPortal";

import axiosInstance from "../api/axiosInstance";
import "../components/common/AppLayout.css";

function PublicNavbar() {
  return (
    <header className="site-header">
      <Link to="/" className="site-logo">
        <span className="logo-mark">U</span>
        <span>unfazed</span>
      </Link>

      <nav className="site-nav">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/features">Features</Link>
        <Link to="/#how-it-works">How it works</Link>
        <Link to="/contact">Contact</Link>
      </nav>

      <div className="site-header-actions">
        <details className="nav-login-dropdown">
          <summary className="nav-login">
            Log in <span>⌄</span>
          </summary>

          <div className="nav-login-menu">
            <Link to="/login?type=therapist">
              Therapist Login
            </Link>

            <Link to="/login?type=client">
              Client Login
            </Link>
          </div>
        </details>

        <Link to="/register?type=therapist" className="nav-cta">
          Get started <span>→</span>
        </Link>
      </div>
    </header>
  );
}

function PublicLayout({ children }) {
  return (
    <div className="public-site">
      <PublicNavbar />

      {children}

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="site-logo">
              <span className="logo-mark">U</span>
              <span>unfazed</span>
            </Link>

            <p>
              A simpler way to manage your therapy practice and create a
              smoother experience for every client.
            </p>
          </div>

          <div className="footer-links">
            <h4>Explore</h4>
            <Link to="/about">About us</Link>
            <Link to="/features">Features</Link>
            <a href="/#how-it-works">How it works</a>
            <Link to="/contact">Contact</Link>
          </div>

          <div className="footer-links">
            <h4>Get started</h4>
            <Link to="/register?type=therapist">
              Join as therapist
            </Link>
            <Link to="/login?type=therapist">
              Therapist login
            </Link>
            <Link to="/login?type=client">
              Client login
            </Link>
            <Link to="/register?type=client">
              Client registration
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Unfazed. All rights reserved.
          </span>
          <span>Designed for better practice management.</span>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  return (
    <PublicLayout>
      <main>
        <section className="hero-section">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              A better way to manage your practice
            </div>

            <h1>
              Make space for
              <br />
              <span>better care.</span>
            </h1>

            <p className="hero-description">
              Spend less time managing your therapy practice and more time
              focusing on the people who matter. Your practice, scheduling,
              clients and payments — together in one place.
            </p>

            <div className="hero-buttons">
              <Link
                to="/register?type=therapist"
                className="primary-button"
              >
                Start your practice <span>→</span>
              </Link>

              <Link to="/features" className="secondary-button">
                Explore features
              </Link>
            </div>

            <div className="hero-trust">
              <span className="trust-check">✓</span>
              Built to simplify independent therapy practices
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow" />

            <div className="dashboard-preview">
              <div className="preview-top">
                <div>
                  <span className="preview-label">YOUR PRACTICE</span>
                  <h3>Good morning!</h3>
                  <p>Here's what's happening today.</p>
                </div>

                <div className="preview-avatar">U</div>
              </div>

              <div className="preview-stats">
                <div className="preview-stat">
                  <span>Clients</span>
                  <strong>24</strong>
                  <small>Client overview</small>
                </div>

                <div className="preview-stat">
                  <span>Sessions</span>
                  <strong>08</strong>
                  <small>Today's schedule</small>
                </div>
              </div>

              <div className="preview-appointment">
                <div className="appointment-heading">
                  <strong>Upcoming session</strong>
                  <span>Today</span>
                </div>

                <div className="appointment-row">
                  <div className="appointment-icon">◷</div>

                  <div>
                    <strong>Session appointment</strong>
                    <small>10:30 AM · 45 minutes</small>
                  </div>

                  <span className="appointment-status">Upcoming</span>
                </div>
              </div>

              <div className="preview-bottom">
                <span className="preview-bottom-icon">✦</span>
                <span>Your practice, organised in one place.</span>
              </div>
            </div>

            <div className="floating-note">
              <span>✓</span>
              Stay organised
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <span>ONE WORKSPACE</span>
          <span>•</span>
          <span>LESS ADMINISTRATION</span>
          <span>•</span>
          <span>MORE FOCUS ON CARE</span>
        </section>

        <section className="section-block home-intro">
          <div className="section-heading">
            <span className="section-kicker">WHY UNFAZED</span>
            <h2>Your practice deserves a simpler way to work.</h2>
            <p>
              Running a private practice involves more than sessions. Unfazed
              brings everyday practice-management tasks into one organised
              workspace.
            </p>
          </div>

          <div className="benefit-grid">
            <article className="benefit-card">
              <div className="benefit-icon lavender">▦</div>
              <h3>Everything organised</h3>
              <p>
                Keep your clients, appointments, notes and practice activity
                together.
              </p>
            </article>

            <article className="benefit-card">
              <div className="benefit-icon peach">◷</div>
              <h3>Manage your time</h3>
              <p>
                Organise availability, appointments and upcoming sessions
                more easily.
              </p>
            </article>

            <article className="benefit-card">
              <div className="benefit-icon mint">↗</div>
              <h3>Understand your practice</h3>
              <p>
                View payment and business activity from a single dashboard.
              </p>
            </article>
          </div>
        </section>

        <section
          id="how-it-works"
          className="section-block how-it-works-section"
        >
          <div className="section-heading">
            <span className="section-kicker">HOW IT WORKS</span>
            <h2>Get started with Unfazed in three simple steps</h2>
            <p>
              Manage your therapy practice and connect with clients
              through one simple platform.
            </p>
          </div>

          <div className="benefit-grid">
            <div className="benefit-card">
              <div className="benefit-icon lavender">01</div>
              <h3>Create your profile</h3>
              <p>
                Register as a therapist and set up your professional
                profile with your details and specializations.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon peach">02</div>
              <h3>Share your booking link</h3>
              <p>
                Share your personal booking link so clients can
                discover your practice and schedule sessions.
              </p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon mint">03</div>
              <h3>Manage your practice</h3>
              <p>
                Organise appointments, clients, payments and
                clinical records from your therapist dashboard.
              </p>
            </div>
          </div>
        </section>

        <section className="account-choice-section">
          <div className="section-heading">
            <span className="section-kicker">GET STARTED WITH UNFAZED</span>
            <h2>How would you like to use Unfazed?</h2>
            <p>Choose your account type to continue.</p>
          </div>

          <div className="account-choice-grid">
            <article className="account-choice-card">
              <div className="account-choice-icon">✦</div>
              <span className="section-kicker">FOR PROFESSIONALS</span>
              <h3>I'm a Therapist</h3>
              <p>
                Manage your practice, appointments, clients, notes and payments
                from one organised workspace.
              </p>

              <Link
                to="/register?type=therapist"
                className="primary-button"
              >
                Register as Therapist →
              </Link>

              <div className="account-choice-login">
                Already registered?{" "}
                <Link to="/login?type=therapist">
                  Therapist Login
                </Link>
              </div>
            </article>

            <article className="account-choice-card">
              <div className="account-choice-icon client-icon">◎</div>
              <span className="section-kicker">FOR CLIENTS</span>
              <h3>I'm a Client</h3>
              <p>
                Access your therapy appointments, stay connected with your
                therapist and manage your sessions.
              </p>

              <Link
                to="/register?type=client"
                className="primary-button"
              >
                Register as Client →
              </Link>

              <div className="account-choice-login">
                Already registered?{" "}
                <Link to="/login?type=client">
                  Client Login
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className="home-cta-section">
          <div>
            <span className="section-kicker">YOUR PRACTICE, YOUR WAY</span>
            <h2>Ready to bring it all together?</h2>
            <p>Create your therapist account and set up your practice.</p>
          </div>

          <Link
            to="/register?type=therapist"
            className="light-button"
          >
            Get started <span>→</span>
          </Link>
        </section>
      </main>
    </PublicLayout>
  );
}

function AboutPage() {
  return (
    <PublicLayout>
      <main className="inner-page">
        <section className="inner-hero">
          <span className="section-kicker">ABOUT UNFAZED</span>
          <h1>Making practice management feel simpler.</h1>
          <p>
            Unfazed is designed to help independent therapists organise the
            everyday work behind their practice — so they can focus more on
            delivering meaningful care.
          </p>
        </section>

        <section className="inner-content-grid">
          <div className="inner-content-card">
            <span className="large-symbol">✦</span>
            <h2>Our purpose</h2>
            <p>
              To bring essential practice-management tools into one accessible
              workspace, reducing the need to manage multiple disconnected
              processes.
            </p>
          </div>

          <div className="inner-content-card">
            <span className="large-symbol">◎</span>
            <h2>What we believe</h2>
            <p>
              Technology should make everyday work easier. A well-organised
              practice gives therapists more room to focus on their clients.
            </p>
          </div>
        </section>

        <section className="inner-banner">
          <h2>One workspace. A more organised practice.</h2>
          <Link to="/features" className="primary-button">
            Discover our features <span>→</span>
          </Link>
        </section>
      </main>
    </PublicLayout>
  );
}

function FeaturesPage() {
  const features = [
    {
      icon: "◷",
      title: "Appointment scheduling",
      description:
        "Manage availability, organise sessions and keep track of upcoming appointments.",
    },
    {
      icon: "♙",
      title: "Client management",
      description:
        "Keep client information and session-related activity organised in one place.",
    },
    {
      icon: "▤",
      title: "Clinical notes",
      description:
        "Organise session documentation with structured note-taking options.",
    },
    {
      icon: "₹",
      title: "Payments and packages",
      description:
        "Manage packages, payment requests and transaction records.",
    },
    {
      icon: "◎",
      title: "Client communication",
      description:
        "Keep conversations and client communication connected to your practice.",
    },
    {
      icon: "↗",
      title: "Practice analytics",
      description:
        "Review business activity and understand how your practice is performing.",
    },
  ];

  return (
    <PublicLayout>
      <main className="inner-page">
        <section className="inner-hero">
          <span className="section-kicker">WHAT YOU CAN DO</span>
          <h1>Everything you need to organise your practice.</h1>
          <p>
            From the first booking to ongoing client management, bring your
            essential workflows together with Unfazed.
          </p>
        </section>

        <section className="features-grid">
          {features.map((feature) => (
            <article
              className="feature-page-card"
              key={feature.title}
            >
              <div className="feature-page-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="inner-banner">
          <h2>Take the next step towards a more organised practice.</h2>
          <Link
            to="/register?type=therapist"
            className="primary-button"
          >
            Create your account <span>→</span>
          </Link>
        </section>
      </main>
    </PublicLayout>
  );
}

function ContactPage() {
  return (
    <PublicLayout>
      <main className="inner-page">
        <section className="inner-hero">
          <span className="section-kicker">GET IN TOUCH</span>
          <h1>We'd love to hear from you.</h1>
          <p>
            Have a question about Unfazed or need help getting started? Reach
            out to our team.
          </p>
        </section>

        <section className="contact-layout">
          <div className="contact-info-card">
            <span className="section-kicker">CONTACT</span>
            <h2>Let's start a conversation.</h2>
            <p>
              For product questions, account assistance or general enquiries,
              contact us by email.
            </p>

            <div className="contact-detail">
              <span className="contact-detail-icon">✉</span>
              <div>
                <small>Email us</small>
                <a href="mailto:support@unfazed.in">
                  support@unfazed.in
                </a>
              </div>
            </div>

            <p className="contact-note">
              Replace this demo email address with your official support email
              before publishing the website.
            </p>
          </div>

          <div className="contact-side-card">
            <div className="contact-side-symbol">✦</div>
            <h3>Are you a therapist?</h3>
            <p>
              Create your account to start organising your practice with
              Unfazed.
            </p>

            <Link
              to="/register?type=therapist"
              className="primary-button"
            >
              Join Unfazed <span>→</span>
            </Link>

            <div className="contact-divider" />
            <p>Already have an account?</p>

            <Link to="/login?type=therapist" className="text-link">
              Log in to your account →
            </Link>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function TherapistLayout() {
  const { therapist, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationLoading(true);

      const { data } = await axiosInstance.get(
        "/therapists/notifications"
      );

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error(
        "Unable to load notifications:",
        error.response?.data || error.message
      );
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (notification) => {
    try {
      if (!notification.isRead) {
        await axiosInstance.patch(
          `/therapists/notifications/${notification._id}/read`
        );

        setNotifications((previous) =>
          previous.map((item) =>
            item._id === notification._id
              ? { ...item, isRead: true }
              : item
          )
        );

        setUnreadCount((count) => Math.max(count - 1, 0));
      }

      setNotificationOpen(false);

      if (notification.link?.startsWith("/")) {
        navigate(notification.link);
      }
    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error.response?.data || error.message
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAllRead || unreadCount === 0) return;

    try {
      setMarkingAllRead(true);

      await axiosInstance.patch(
        "/therapists/notifications/read-all"
      );

      await loadNotifications();
    } catch (error) {
      console.error(
        "Unable to mark all notifications as read:",
        error.response?.data || error.message
      );
    } finally {
      setMarkingAllRead(false);
    }
  };

  const sidebarLinks = [
    { label: "Overview", path: "/dashboard", icon: "▦" },
    { label: "My Profile", path: "/profile", icon: "♙" },
    { label: "Clients", path: "/clients", icon: "♧" },
    { label: "Schedule", path: "/schedule", icon: "▣" },
    { label: "Clinical Notes", path: "/notes", icon: "▤" },
    { label: "Payments", path: "/payments", icon: "₹" },
    { label: "Analytics", path: "/analytics", icon: "↗" },
    { label: "Subscription", path: "/subscription", icon: "✦" },
  ];

  return (
    <div className="therapist-layout">
      <aside className="therapist-sidebar">
        <Link to="/dashboard" className="therapist-sidebar-logo">
          <span className="logo-mark">U</span>
          <span>unfazed</span>
        </Link>

        <div className="therapist-sidebar-profile">
          <div className="therapist-sidebar-avatar">
            {therapist?.name?.charAt(0)?.toUpperCase() || "T"}
          </div>

          <div>
            <strong>{therapist?.name || "Therapist"}</strong>
            <span>Therapist Account</span>
          </div>
        </div>

        <nav className="therapist-sidebar-nav">
          <span className="sidebar-section-label">WORKSPACE</span>

          {sidebarLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `therapist-sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="therapist-sidebar-bottom">
          <Link to="/" className="therapist-sidebar-link">
            <span className="sidebar-link-icon">↗</span>
            <span>Visit Website</span>
          </Link>
        </div>
      </aside>

      <main className="therapist-main">
        <header className="therapist-topbar">
          <div>
            <span>THERAPIST WORKSPACE</span>
            <h2>Welcome back, {therapist?.name || "Therapist"}</h2>
          </div>

          <div className="therapist-header-actions">
            <div className="therapist-notification-wrapper">
              <button
                type="button"
                className="therapist-notification-button"
                onClick={() => {
                  const nextOpen = !notificationOpen;
                  setNotificationOpen(nextOpen);

                  if (nextOpen) {
                    loadNotifications();
                  }
                }}
                aria-label="Notifications"
                aria-expanded={notificationOpen}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="21"
                  height="21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M10 21h4" />
                </svg>

                {unreadCount > 0 && (
                  <span className="therapist-notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="therapist-notification-dropdown">
                  <div className="therapist-notification-heading">
                    <div>
                      <h3>Notifications</h3>
                      <span>{unreadCount} unread</span>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={markingAllRead}
                      >
                        {markingAllRead
                          ? "Marking..."
                          : "Mark all read"}
                      </button>
                    )}
                  </div>

                  <div className="therapist-notification-list">
                    {notificationLoading ? (
                      <p className="therapist-notification-empty">
                        Loading notifications...
                      </p>
                    ) : notifications.length === 0 ? (
                      <p className="therapist-notification-empty">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification._id}
                          className={`therapist-notification-item ${
                            notification.isRead ? "read" : "unread"
                          }`}
                          onClick={() => handleMarkRead(notification)}
                        >
                          <span className="therapist-notification-dot" />

                          <span className="therapist-notification-text">
                            <strong>{notification.title}</strong>
                            <span>{notification.message}</span>

                            <small>
                              {new Date(
                                notification.createdAt
                              ).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </small>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="app-layout-logout"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="therapist-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function TherapistRoutes() {
  const { loading, isTherapist } = useAuth();

  if (loading) return <p>Loading...</p>;

  return isTherapist ? (
    <TherapistLayout />
  ) : (
    <Navigate to="/login" replace />
  );
}

function ClientRoutes() {
  const { loading, isClient } = useAuth();

  if (loading) return <p>Loading...</p>;

  return isClient ? (
    <Outlet />
  ) : (
    <Navigate to="/login?type=client" replace />
  );
}

function ScrollToSection() {
  const location = useLocation();

  useEffect(() => {
    const id = location.hash.substring(1);

    if (id) {
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);

      return () => clearTimeout(timer);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [location.pathname, location.hash]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToSection />

      <Routes>
        {/* Public website routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Therapist protected routes */}
        <Route element={<TherapistRoutes />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Dashboard />} />
          <Route path="/subscription" element={<Dashboard />} />

          <Route path="/clients" element={<Clients />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/payments" element={<Payments />} />
        </Route>

        {/* Client protected routes */}
        <Route element={<ClientRoutes />}>
          <Route
            path="/portal"
            element={<Navigate to="/client/dashboard" replace />}
          />

          <Route
            path="/client"
            element={<Navigate to="/client/dashboard" replace />}
          />

          <Route
            path="/client/dashboard"
            element={<ClientPortal />}
          />

          <Route
            path="/client/therapists"
            element={<ClientPortal />}
          />

          <Route
            path="/client/appointments"
            element={<ClientPortal />}
          />

          <Route
            path="/client/packages"
            element={<ClientPortal />}
          />

          <Route
            path="/client/history"
            element={<ClientPortal />}
          />

          <Route
            path="/client/notes"
            element={<ClientPortal />}
          />

          <Route
            path="/client/payments"
            element={<ClientPortal />}
          />

          <Route
            path="/client/messages"
            element={<ClientPortal />}
          />

          <Route
            path="/client/find-therapists"
            element={<ClientPortal />}
          />

          <Route
            path="/client/profile"
            element={<ClientPortal />}
          />

          {/* Old payment route compatibility */}
          <Route
            path="/payment"
            element={<Navigate to="/client/payments" replace />}
          />
        </Route>

        {/* Public therapist booking routes */}
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/:slug" element={<BookingPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default AppRoutes;

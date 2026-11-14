
import { useEffect, useState } from "react";
import {
  useNavigate,
  useLocation,
  Link,
  NavLink
} from "react-router-dom";

import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import ChatWindow from "../../components/chat/ChatWindow";
import "./ClientPortal.css";

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

function ClientPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { client, logout, updateClient } = useAuth();

  const currentPath = location.pathname;

  const [profile, setProfile] = useState({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    gender: client?.gender || ""
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const [portal, setPortal] = useState({
    clients: [],
    appointments: [],
    sharedNotes: [],
    payments: []
  });

  const [purchasedPackages, setPurchasedPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState("");

  const [directoryTherapists, setDirectoryTherapists] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");

  const [selectedChatClient, setSelectedChatClient] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paymentRequests, setPaymentRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const [payingRequestId, setPayingRequestId] = useState("");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState("");

  // Client notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    setProfile({
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      gender: client?.gender || ""
    });
  }, [client]);

  // Load client portal
  useEffect(() => {
    const loadPortal = async () => {
      try {
        const response = await axiosInstance.get("/clients/portal");

        setPortal({
          clients: response.data.clients || [],
          appointments: response.data.appointments || [],
          sharedNotes: response.data.sharedNotes || [],
          payments: response.data.payments || []
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load your portal. Please log in again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPortal();
  }, []);

  // Load purchased packages
  useEffect(() => {
    const loadPackages = async () => {
      try {
        setPackagesLoading(true);
        setPackagesError("");

        const { data } = await axiosInstance.get(
          "/payments/client/my-packages"
        );

        setPurchasedPackages(data.packages || []);
      } catch (err) {
        setPackagesError(
          err.response?.data?.message ||
          "Unable to load your purchased packages."
        );
      } finally {
        setPackagesLoading(false);
      }
    };

    loadPackages();
  }, []);

  // Load therapist directory
  useEffect(() => {
    const loadTherapists = async () => {
      try {
        setDirectoryLoading(true);
        setDirectoryError("");

        const { data } = await axiosInstance.get(
          "/therapists/directory",
          {
            params: {
              search,
              specialization,
              page: 1,
              limit: 12
            }
          }
        );

        setDirectoryTherapists(data.therapists || []);
      } catch (err) {
        setDirectoryError(
          err.response?.data?.message ||
          "Unable to load therapists."
        );
      } finally {
        setDirectoryLoading(false);
      }
    };

    loadTherapists();
  }, [search, specialization]);

  // Load payment requests
  const loadPaymentRequests = async () => {
    try {
      setRequestLoading(true);
      setRequestError("");

      const { data } = await axiosInstance.get(
        "/payments/client/requests"
      );

      setPaymentRequests(data.requests || []);
    } catch (err) {
      setRequestError(
        err.response?.data?.message ||
        "Unable to load payment requests."
      );
    } finally {
      setRequestLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentRequests();
  }, []);

  // Load client notifications
  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);

      const { data } = await axiosInstance.get(
        "/clients/notifications"
      );

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(
        "Unable to load client notifications:",
        err.response?.data || err
      );
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Mark one client notification as read
  const handleMarkNotificationRead = async (notification) => {
    try {
      if (!notification.isRead) {
        await axiosInstance.patch(
          `/clients/notifications/${notification._id}/read`
        );

        setNotifications((previous) =>
          previous.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  isRead: true,
                  readAt: new Date().toISOString()
                }
              : item
          )
        );

        setUnreadCount((count) => Math.max(count - 1, 0));
      }

      setNotificationOpen(false);

      if (
        notification.link &&
        notification.link.startsWith("/")
      ) {
        navigate(notification.link);
      }
    } catch (err) {
      console.error(
        "Unable to update client notification:",
        err.response?.data || err
      );
    }
  };

  // Mark all client notifications as read
  const handleMarkAllNotificationsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await axiosInstance.patch(
        "/clients/notifications/read-all"
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
          readAt:
            notification.readAt || new Date().toISOString()
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error(
        "Unable to mark client notifications as read:",
        err.response?.data || err
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const datePart = String(date).slice(0, 10);
    const parsedDate = new Date(`${datePart}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const formatAmount = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency
    }).format(Number(amount) || 0);
  };

  const getSessionDateTime = (session) => {
    if (!session.date) return new Date(0);

    const datePart = String(session.date).slice(0, 10);

    return new Date(
      `${datePart}T${session.startTime || "00:00"}:00`
    );
  };

  const upcomingAppointments = portal.appointments.filter((session) => {
    return (
      getSessionDateTime(session) >= new Date() &&
      !["cancelled", "no-show", "completed"].includes(session.status)
    );
  });

  const pastAppointments = portal.appointments.filter((session) => {
    return (
      getSessionDateTime(session) < new Date() ||
      ["cancelled", "no-show", "completed"].includes(session.status)
    );
  });

  const therapists = [
    ...new Map(
      portal.appointments
        .filter((item) => item.therapist)
        .map((item) => [
          item.therapist._id,
          item.therapist
        ])
    ).values()
  ];

  const getTherapistForClient = (linkedClient) => {
    const appointment = portal.appointments.find(
      (session) =>
        String(session.client?._id || session.client) ===
          String(linkedClient._id) &&
        session.therapist
    );

    return appointment?.therapist || null;
  };

  // Pay payment request
  const handlePayRequest = async (request) => {
    try {
      setPayingRequestId(request._id);
      setRequestError("");
      setRequestMessage("");

      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error("Unable to load Razorpay checkout.");
      }

      const { data: order } = await axiosInstance.post(
        "/payments/client/requests/create-order",
        { requestId: request._id }
      );

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Unfazed",
        description: order.description,
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
            await axiosInstance.post(
              "/payments/client/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            );

            setRequestMessage("Payment completed successfully.");
            await loadPaymentRequests();
          } catch (err) {
            setRequestError(
              err.response?.data?.message ||
              "Payment verification failed. Please contact your therapist."
            );
          } finally {
            setPayingRequestId("");
          }
        },
        modal: {
          ondismiss: () => {
            setPayingRequestId("");
          }
        }
      });

      checkout.on("payment.failed", (response) => {
        setRequestError(
          response.error?.description || "Payment failed."
        );
        setPayingRequestId("");
      });

      checkout.open();
    } catch (err) {
      setRequestError(
        err.response?.data?.message ||
        err.message ||
        "Unable to start payment."
      );
      setPayingRequestId("");
    }
  };

  // Download invoice PDF
  const handleDownloadInvoice = async (paymentId) => {
    try {
      setDownloadingInvoiceId(paymentId);
      setRequestError("");
      setRequestMessage("");

      const response = await axiosInstance.get(
        `/payments/client/invoice/${paymentId}`,
        {
          responseType: "blob"
        }
      );

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf"
      });

      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `UNF-${paymentId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setRequestMessage("Invoice download started.");
    } catch (err) {
      setRequestError(
        "Unable to download invoice. Please try again."
      );
    } finally {
      setDownloadingInvoiceId("");
    }
  };

  // Save client profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setProfileLoading(true);
    setProfileMessage("");

    try {
      const { data } = await axiosInstance.put(
        "/auth/client/profile",
        {
          name: profile.name,
          phone: profile.phone,
          gender: profile.gender
        }
      );

      const updatedClient = data.client || data;

      const updatedProfile = {
        name: updatedClient.name || profile.name,
        email: updatedClient.email || profile.email,
        phone: updatedClient.phone ?? profile.phone,
        gender: updatedClient.gender ?? profile.gender
      };

      updateClient(updatedProfile);
      setProfile(updatedProfile);
      setProfileMessage("Profile updated successfully!");
    } catch (err) {
      setProfileMessage(
        err.response?.data?.message ||
        "Unable to update profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Change client password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordLoading(true);
    setPasswordMessage("");

    try {
      const { data } = await axiosInstance.put(
        "/auth/client/password",
        {
          currentPassword,
          newPassword
        }
      );

      setCurrentPassword("");
      setNewPassword("");

      setPasswordMessage(
        data.message || "Password changed successfully!"
      );
    } catch (err) {
      setPasswordMessage(
        err.response?.data?.message ||
        "Unable to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const pageDetails = {
    "/client/dashboard": {
      title: "Overview",
      description: "Your personal therapy dashboard."
    },
    "/client/therapists": {
      title: "My Therapists",
      description: "View the therapists you are connected with."
    },
    "/client/appointments": {
      title: "Appointments",
      description: "Manage your upcoming therapy sessions."
    },
    "/client/packages": {
      title: "My Packages",
      description: "Track your purchased therapy packages."
    },
    "/client/history": {
      title: "Appointment History",
      description: "Review your previous therapy sessions."
    },
    "/client/notes": {
      title: "Shared Notes",
      description: "Review notes shared by your therapists."
    },
    "/client/payments": {
      title: "Payments",
      description: "Manage payment requests and invoices."
    },
    "/client/messages": {
      title: "Messages",
      description: "Communicate with your therapists."
    },
    "/client/find-therapists": {
      title: "Find Therapists",
      description: "Discover therapists and explore their profiles."
    },
    "/client/profile": {
      title: "My Profile",
      description: "Manage your personal information and security."
    }
  };

  const currentPage =
    pageDetails[currentPath] || pageDetails["/client/dashboard"];

  const navigationItems = [
    { label: "Overview", path: "/client/dashboard", icon: "⌂" },
    { label: "My Therapists", path: "/client/therapists", icon: "♧" },
    { label: "Appointments", path: "/client/appointments", icon: "▦" },
    { label: "My Packages", path: "/client/packages", icon: "◇" },
    { label: "Appointment History", path: "/client/history", icon: "◷" },
    { label: "Shared Notes", path: "/client/notes", icon: "▤" },
    { label: "Payments", path: "/client/payments", icon: "₹" },
    { label: "Messages", path: "/client/messages", icon: "✉" },
    { label: "Find Therapists", path: "/client/find-therapists", icon: "⌕" },
    { label: "My Profile", path: "/client/profile", icon: "♙" }
  ];

  // Dashboard
  const renderDashboard = () => (
    <>
      <section className="client-welcome-panel">
        <div className="client-welcome-copy">
          <span className="client-eyebrow">YOUR WELLNESS SPACE</span>
          <h2>Welcome back, {client?.name || "Client"}!</h2>
          <p>
            Take a moment for yourself. Here's an overview of your
            therapy journey.
          </p>
          <Link to="/client/find-therapists" className="client-welcome-button">
            Explore Therapists <span>→</span>
          </Link>
        </div>
        <div className="client-welcome-decoration" aria-hidden="true">
          <span>✦</span>
          <span>✧</span>
          <span>✦</span>
        </div>
      </section>

      <div className="client-card-grid client-stat-grid">
        <div className="client-stat-card stat-purple">
          <div className="client-stat-icon">▦</div>
          <span>Upcoming Appointments</span>
          <h3>{upcomingAppointments.length}</h3>
          <p>Your scheduled sessions</p>
        </div>

        <div className="client-stat-card stat-peach">
          <div className="client-stat-icon">♧</div>
          <span>My Therapists</span>
          <h3>{therapists.length}</h3>
          <p>Your connected therapists</p>
        </div>

        <div className="client-stat-card stat-mint">
          <div className="client-stat-icon">◇</div>
          <span>Active Packages</span>
          <h3>
            {
              purchasedPackages.filter(
                (item) => item.status === "active"
              ).length
            }
          </h3>
          <p>Your available packages</p>
        </div>

        <div className="client-stat-card stat-lavender">
          <div className="client-stat-icon">₹</div>
          <span>Pending Payments</span>
          <h3>
            {
              paymentRequests.filter(
                (item) => item.status === "pending"
              ).length
            }
          </h3>
          <p>Payment requests awaiting action</p>
        </div>
      </div>

      <section className="client-dashboard-section">
        <div className="client-section-heading">
          <div>
            <span className="client-eyebrow">YOUR SCHEDULE</span>
            <h3>Upcoming Appointments</h3>
            <p>Your next scheduled therapy sessions.</p>
          </div>
          <Link to="/client/appointments" className="client-text-link">
            View All →
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="client-empty-state">
            <div className="client-empty-icon">▦</div>
            <h3>No upcoming appointments</h3>
            <p>Your upcoming sessions will appear here.</p>
            <Link to="/client/find-therapists" className="client-primary-link">
              Find a Therapist
            </Link>
          </div>
        ) : (
          <div className="client-card-grid">
            {upcomingAppointments.slice(0, 3).map((session) => (
              <div className="client-card client-appointment-card" key={session._id}>
                <span className="client-card-tag">UPCOMING SESSION</span>
                <h3>{formatDate(session.date)}</h3>
                <p>
                  <strong>Time:</strong> {session.startTime} - {session.endTime}
                </p>
                <p>
                  <strong>Therapist:</strong>{" "}
                  {session.therapist?.name || "Therapist"}
                </p>
                <span className="client-status-pill">{session.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="client-dashboard-section">
        <div className="client-section-heading">
          <div>
            <span className="client-eyebrow">QUICK LINKS</span>
            <h3>Quick Access</h3>
            <p>Everything you need, in one place.</p>
          </div>
        </div>

        <div className="client-quick-links">
          <Link to="/client/appointments"><span>▦</span> My Appointments <b>→</b></Link>
          <Link to="/client/packages"><span>◇</span> My Packages <b>→</b></Link>
          <Link to="/client/messages"><span>✉</span> Messages <b>→</b></Link>
          <Link to="/client/payments"><span>₹</span> Payments <b>→</b></Link>
        </div>
      </section>
    </>
  );

  // Connected therapists
  const renderTherapists = () => (
    <section className="client-dashboard-section">
      {therapists.length === 0 ? (
        <div className="client-empty-state">
          <div className="client-empty-icon">♧</div>
          <h3>No therapists found</h3>
          <p>Your connected therapists will appear here.</p>
          <Link to="/client/find-therapists" className="client-primary-link">
            Find a Therapist
          </Link>
        </div>
      ) : (
        <div className="client-card-grid">
          {therapists.map((therapist) => (
            <div className="client-card client-profile-card" key={therapist._id}>
              <div className="client-card-avatar">
                {(therapist.name || "T").charAt(0).toUpperCase()}
              </div>
              <h3>{therapist.name}</h3>
              <p>{therapist.bio || "Professional therapist"}</p>
              <Link to={`/${therapist.slug}`} className="client-primary-link">
                View Therapist Profile →
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // Upcoming appointments
  const renderAppointments = () => (
    <section className="client-dashboard-section">
      {upcomingAppointments.length === 0 ? (
        <div className="client-empty-state">
          <div className="client-empty-icon">▦</div>
          <h3>No upcoming appointments</h3>
          <p>You currently have no scheduled sessions.</p>
          <Link to="/client/find-therapists" className="client-primary-link">
            Find a Therapist
          </Link>
        </div>
      ) : (
        <div className="client-card-grid">
          {upcomingAppointments.map((session) => (
            <div className="client-card" key={session._id}>
              <span className="client-card-tag">SCHEDULED SESSION</span>
              <h3>{formatDate(session.date)}</h3>
              <p><strong>Time:</strong> {session.startTime} - {session.endTime}</p>
              <p><strong>Therapist:</strong> {session.therapist?.name || "Therapist"}</p>
              <p><strong>Session type:</strong> {session.sessionType || "Not specified"}</p>
              <p><strong>Status:</strong> {session.status}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // Purchased packages
  const renderPackages = () => (
    <section className="client-dashboard-section">
      {packagesLoading ? (
        <div className="client-inline-message">Loading your packages...</div>
      ) : packagesError ? (
        <div className="client-alert" role="alert">{packagesError}</div>
      ) : purchasedPackages.length === 0 ? (
        <div className="client-empty-state">
          <div className="client-empty-icon">◇</div>
          <h3>No purchased packages</h3>
          <p>Your purchased therapy packages will appear here.</p>
          <Link to="/client/find-therapists" className="client-primary-link">
            Find a Therapist
          </Link>
        </div>
      ) : (
        <div className="client-card-grid">
          {purchasedPackages.map((record) => {
            const total = record.totalSessions || 0;
            const used = record.usedSessions || 0;
            const remaining = Math.max(total - used, 0);
            const progress = total ? Math.min((used / total) * 100, 100) : 0;

            return (
              <div className="client-card" key={record._id}>
                <span className="client-card-tag">YOUR PACKAGE</span>
                <h3>{record.package?.name || "Therapy Package"}</h3>
                <p><strong>Therapist:</strong> {record.therapist?.name || "Therapist"}</p>
                <p><strong>Package price:</strong> {formatAmount(record.package?.price || 0)}</p>

                <div className="client-package-progress">
                  <div className="client-progress-label">
                    <span>Sessions used</span>
                    <strong>{used} / {total}</strong>
                  </div>
                  <div className="client-progress-track">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <p><strong>Remaining sessions:</strong> {remaining}</p>
                <p><strong>Purchase date:</strong> {formatDate(record.purchaseDate)}</p>
                <p><strong>Expiry date:</strong> {formatDate(record.expiryDate)}</p>
                <p><strong>Status:</strong> {record.status}</p>

                {record.therapist?.slug && (
                  <Link to={`/${record.therapist.slug}`} className="client-primary-link">
                    Book Another Appointment →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  // Appointment history
  const renderHistory = () => (
    <section className="client-dashboard-section">
      {pastAppointments.length === 0 ? (
        <div className="client-empty-state">
          <div className="client-empty-icon">◷</div>
          <h3>No appointment history</h3>
          <p>Your previous appointments will appear here.</p>
        </div>
      ) : (
        <div className="client-card-grid">
          {pastAppointments.map((session) => (
            <div className="client-card" key={session._id}>
              <span className="client-card-tag">PAST SESSION</span>
              <h3>{formatDate(session.date)}</h3>
              <p><strong>Time:</strong> {session.startTime} - {session.endTime}</p>
              <p><strong>Therapist:</strong> {session.therapist?.name || "Therapist"}</p>
              <p><strong>Status:</strong> {session.status}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // Shared notes
  const renderNotes = () => (
    <section className="client-dashboard-section">
      {portal.sharedNotes.length === 0 ? (
        <div className="client-empty-state">
          <div className="client-empty-icon">▤</div>
          <h3>No shared notes yet</h3>
          <p>Notes shared by your therapists will appear here.</p>
        </div>
      ) : (
        <div className="client-card-grid">
          {portal.sharedNotes.map((note) => (
            <div className="client-card client-note-card" key={note._id}>
              <span className="client-card-tag">SHARED NOTE</span>
              <h3>{note.title}</h3>
              <p className="client-note-content">{note.content}</p>
              <small>Shared on: {formatDate(note.createdAt)}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // Messages
  const renderMessages = () => (
    <section className="client-dashboard-section">
      <div className="client-section-heading">
        <div>
          <span className="client-eyebrow">STAY CONNECTED</span>
          <h3>Your Conversations</h3>
          <p>Select a therapist conversation to open your chat.</p>
        </div>
      </div>

      {portal.clients.length === 0 ? (
        <div className="client-empty-state">
          <div className="client-empty-icon">✉</div>
          <h3>No conversations available</h3>
          <p>Your linked therapist conversations will appear here.</p>
        </div>
      ) : (
        <div className="client-card-grid">
          {portal.clients.map((linkedClient) => {
            const therapist = getTherapistForClient(linkedClient);

            return (
              <div className="client-card client-conversation-card" key={linkedClient._id}>
                <div className="client-card-avatar">
                  {(therapist?.name || "T").charAt(0).toUpperCase()}
                </div>
                <h3>{therapist?.name || "Your Therapist"}</h3>
                <p>Your private conversation</p>
                <button
                  type="button"
                  className="client-primary-button"
                  onClick={() => setSelectedChatClient(linkedClient)}
                >
                  Open Conversation
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedChatClient && (
        <div className="client-card client-chat-card">
          <div className="client-section-heading">
            <div>
              <span className="client-eyebrow">PRIVATE CHAT</span>
              <h3>Conversation</h3>
            </div>
            <button
              type="button"
              className="client-secondary-button"
              onClick={() => setSelectedChatClient(null)}
            >
              Close Conversation
            </button>
          </div>

          <ChatWindow
            key={selectedChatClient._id}
            clientId={selectedChatClient._id}
            role="client"
            therapistName={
              getTherapistForClient(selectedChatClient)?.name ||
              "Your Therapist"
            }
          />
        </div>
      )}
    </section>
  );

  // Therapist directory
  const renderDirectory = () => (
    <section className="client-dashboard-section">
      <div className="client-directory-filters">
        <input
          type="text"
          placeholder="Search therapists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by specialization..."
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        />
      </div>

      {directoryLoading ? (
        <div className="client-inline-message">Loading therapists...</div>
      ) : directoryError ? (
        <div className="client-alert" role="alert">{directoryError}</div>
      ) : directoryTherapists.length === 0 ? (
        <div className="client-empty-state">
          <div className="client-empty-icon">⌕</div>
          <h3>No therapists found</h3>
          <p>Try changing your search or specialization.</p>
        </div>
      ) : (
        <div className="client-card-grid">
          {directoryTherapists.map((therapist) => (
            <div className="client-card client-profile-card" key={therapist._id}>
              <div className="client-card-avatar">
                {(therapist.name || "T").charAt(0).toUpperCase()}
              </div>
              <h3>{therapist.name}</h3>
              <p>{therapist.bio || "No biography available."}</p>
              <p>
                <strong>Specializations:</strong>{" "}
                {therapist.specializations?.join(", ") || "Not specified"}
              </p>
              <p>
                <strong>Languages:</strong>{" "}
                {therapist.languages?.join(", ") || "Not specified"}
              </p>
              <Link to={`/${therapist.slug}`} className="client-primary-link">
                View Profile & Book →
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // Payments and invoices
  const renderPayments = () => (
    <section className="client-dashboard-section">
      <div className="client-section-heading">
        <div>
          <span className="client-eyebrow">BILLING</span>
          <h3>Payment Requests</h3>
          <p>Review and complete payment requests from your therapists.</p>
        </div>
      </div>

      {requestError && <div className="client-alert" role="alert">{requestError}</div>}
      {requestMessage && <div className="client-success-message" role="status">{requestMessage}</div>}

      {requestLoading ? (
        <div className="client-inline-message">Loading payment requests...</div>
      ) : paymentRequests.length === 0 ? (
        <div className="client-empty-state compact-empty">
          <h3>No payment requests</h3>
          <p>You have no payment requests at the moment.</p>
        </div>
      ) : (
        <div className="client-card-grid">
          {paymentRequests.map((request) => (
            <div className="client-card" key={request._id}>
              <span className="client-card-tag">PAYMENT REQUEST</span>
              <h3 className="client-amount">{formatAmount(request.amount, request.currency)}</h3>
              <p><strong>Therapist:</strong> {request.therapist?.name || "Therapist"}</p>
              <p><strong>Description:</strong> {request.description}</p>
              <p><strong>Status:</strong> <span className="client-status-pill">{request.status}</span></p>
              <p><strong>Date:</strong> {formatDate(request.createdAt)}</p>

              {request.status === "pending" && (
                <button
                  type="button"
                  className="client-primary-button"
                  disabled={payingRequestId === request._id}
                  onClick={() => handlePayRequest(request)}
                >
                  {payingRequestId === request._id ? "Processing..." : "Pay Now"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="client-section-heading client-payment-history-heading">
        <div>
          <span className="client-eyebrow">YOUR RECORDS</span>
          <h3>Payment History</h3>
          <p>View completed payments and download your invoices.</p>
        </div>
      </div>

      {portal.payments.length === 0 ? (
        <div className="client-empty-state compact-empty">
          <p>No payment records found.</p>
        </div>
      ) : (
        <div className="client-card-grid">
          {portal.payments.map((payment) => (
            <div className="client-card" key={payment._id}>
              <span className="client-card-tag">PAYMENT RECORD</span>
              <h3 className="client-amount">{formatAmount(payment.amount, payment.currency)}</h3>
              <p><strong>Status:</strong> {payment.status}</p>
              <p><strong>Date:</strong> {formatDate(payment.createdAt)}</p>

              {String(payment.status).toLowerCase() === "success" && (
                <button
                  type="button"
                  className="client-secondary-button"
                  disabled={downloadingInvoiceId === payment._id}
                  onClick={() => handleDownloadInvoice(payment._id)}
                >
                  {downloadingInvoiceId === payment._id
                    ? "Downloading..."
                    : "Download Invoice PDF"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // Client profile and password
  const renderProfile = () => (
    <section className="client-dashboard-section client-profile-layout">
      <div className="client-card client-form-card">
        <div className="client-section-heading">
          <div>
            <span className="client-eyebrow">ACCOUNT DETAILS</span>
            <h3>Personal Information</h3>
            <p>Keep your contact information up to date.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="client-form-group">
            <label htmlFor="client-name">Full Name</label>
            <input
              id="client-name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </div>

          <div className="client-form-group">
            <label htmlFor="client-email">Email Address</label>
            <input
              id="client-email"
              type="email"
              value={profile.email}
              readOnly
            />
            <small>Email address cannot currently be changed.</small>
          </div>

          <div className="client-form-group">
            <label htmlFor="client-phone">Phone Number</label>
            <input
              id="client-phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <div className="client-form-group">
            <label htmlFor="client-gender">Gender</label>
            <select
              id="client-gender"
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {profileMessage && <p className="client-form-message" role="status">{profileMessage}</p>}

          <button type="submit" className="client-primary-button" disabled={profileLoading}>
            {profileLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="client-card client-form-card">
        <div className="client-section-heading">
          <div>
            <span className="client-eyebrow">ACCOUNT SECURITY</span>
            <h3>Change Password</h3>
            <p>Update your password to keep your account secure.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword}>
          <div className="client-form-group">
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="client-form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
            <small>Password must contain at least 8 characters.</small>
          </div>

          {passwordMessage && <p className="client-form-message" role="status">{passwordMessage}</p>}

          <button type="submit" className="client-primary-button" disabled={passwordLoading}>
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </section>
  );

  // Select page content
  const renderPageContent = () => {
    switch (currentPath) {
      case "/client/therapists":
        return renderTherapists();
      case "/client/appointments":
        return renderAppointments();
      case "/client/packages":
        return renderPackages();
      case "/client/history":
        return renderHistory();
      case "/client/notes":
        return renderNotes();
      case "/client/payments":
        return renderPayments();
      case "/client/messages":
        return renderMessages();
      case "/client/find-therapists":
        return renderDirectory();
      case "/client/profile":
        return renderProfile();
      case "/client/dashboard":
      default:
        return renderDashboard();
    }
  };

  if (loading) {
    return (
      <main className="client-portal-state">
        <div className="client-state-card">
          <div className="client-loading-spinner" />
          <h2>Preparing your space</h2>
          <p>Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="client-portal-state">
        <div className="client-state-card">
          <h1>Unable to load your dashboard</h1>
          <p>{error}</p>
          <button type="button" className="client-primary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="client-dashboard-layout">
      <aside className="client-sidebar">
        <div className="client-sidebar-brand">
          <div className="client-brand-mark">U</div>
          <div>
            <h2>Unfazed</h2>
            <span>CLIENT PORTAL</span>
          </div>
        </div>

        <div className="client-sidebar-user">
          <div className="client-user-avatar">
            {(client?.name || "C").charAt(0).toUpperCase()}
          </div>
          <div className="client-sidebar-user-info">
            <h3>{client?.name || "Client"}</h3>
            <p>Client Account</p>
          </div>
        </div>

        <span className="client-nav-caption">WORKSPACE</span>

        <nav className="client-sidebar-nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `client-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="client-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="client-nav-arrow">›</span>
            </NavLink>
          ))}
        </nav>

        <div className="client-sidebar-bottom">
          <div className="client-sidebar-help">
            <span>✦</span>
            <p>Your wellness journey matters.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="client-logout-button"
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <div className="client-dashboard-main">
        <header className="client-dashboard-header">
          <div className="client-header-title">
            <span className="client-eyebrow">UNFAZED / CLIENT SPACE</span>
            <h1>{currentPage.title}</h1>
            <p>{currentPage.description}</p>
          </div>

          <div className="client-header-actions">
            <div className="client-notification-wrapper">
             <button
  type="button"
  className="client-notification-button"
  onClick={() => {
    setNotificationOpen((previous) => !previous);
    loadNotifications();
  }}
  aria-label="Notifications"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>

  {unreadCount > 0 && (
    <span className="client-notification-badge">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</button>

              {notificationOpen && (
                <div className="client-notification-dropdown">
                  <div className="client-notification-heading">
                    <div>
                      <h3>Notifications</h3>
                      <span>{unreadCount} unread</span>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="client-notification-list">
                    {notificationLoading ? (
                      <p className="client-notification-empty">
                        Loading notifications...
                      </p>
                    ) : notifications.length === 0 ? (
                      <p className="client-notification-empty">
                        You're all caught up. No notifications yet.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification._id}
                          className={`client-notification-item ${
                            notification.isRead ? "read" : "unread"
                          }`}
                          onClick={() =>
                            handleMarkNotificationRead(notification)
                          }
                        >
                          <span className="client-notification-dot" />

                          <span className="client-notification-text">
                            <strong>{notification.title}</strong>

                            <span className="client-notification-message">
                              {notification.message}
                            </span>

                            <small>
                              {new Date(notification.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "numeric",
                                  minute: "2-digit"
                                }
                              )}
                            </small>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="client-header-user">
              <div className="client-header-avatar">
                {(client?.name || "C").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{client?.name || "Client"}</strong>
                <span>Client Account</span>
              </div>
            </div>
          </div>
        </header>

        <div className="client-dashboard-content">
          {renderPageContent()}
        </div>

        <footer className="client-dashboard-footer">
          <span>© {new Date().getFullYear()} Unfazed</span>
          <span>Your wellness journey, thoughtfully supported.</span>
        </footer>
      </div>
    </main>
  );
}

export default ClientPortal;

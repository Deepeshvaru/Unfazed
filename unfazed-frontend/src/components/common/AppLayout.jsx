
import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import "./AppLayout.css";

function AppLayout() {
  const navigate = useNavigate();
  const { therapist, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Load therapist notifications
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

  // Mark one notification as read
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
        "Mark notification read failed:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Unable to mark notification as read. Please try again."
      );
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (markingAllRead || unreadCount === 0) return;

    try {
      setMarkingAllRead(true);

      await axiosInstance.patch(
        "/therapists/notifications/read-all"
      );

      // Update the UI immediately
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true
        }))
      );

      setUnreadCount(0);

      // Fetch again to confirm saved database status
      await loadNotifications();

    } catch (error) {
      console.error(
        "Mark all notifications read failed:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Unable to mark all notifications as read. Please try again."
      );
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-layout-main">
        <header className="app-layout-header">
          <div className="app-layout-header-user">
            <h2>Welcome, {therapist?.name || "Therapist"}</h2>
            <p>Manage your practice with Unfazed.</p>
          </div>

          <div className="therapist-header-actions">
            {/* Notification Bell */}
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
                          onClick={() =>
                            handleMarkRead(notification)
                          }
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
                                minute: "2-digit"
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

            {/* Logout */}
            <button
              type="button"
              className="app-layout-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="app-layout-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;

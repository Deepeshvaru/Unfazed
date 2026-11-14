
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./Schedule.css";

const today = new Date();
today.setDate(today.getDate() + 1);

const tomorrow = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

const initialForm = {
  startTime: "09:00",
  endTime: "17:00",
  slotDuration: 60,
  bufferMinutes: 0
};

const appointmentStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no-show"
];

/* Custom Appointment Status Dropdown */
function StatusDropdown({ status, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (newStatus) => {
    setIsOpen(false);

    if (newStatus !== status) {
      onUpdate(newStatus);
    }
  };

  return (
    <div className="custom-status-dropdown">
      <button
        type="button"
        className={`appointment-status-select ${
          isOpen ? "dropdown-open" : ""
        }`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{status}</span>

        <svg
          className={`status-dropdown-arrow ${
            isOpen ? "arrow-up" : ""
          }`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="status-dropdown-menu"
          role="listbox"
        >
          {appointmentStatuses.map((option) => (
            <button
              type="button"
              key={option}
              role="option"
              aria-selected={status === option}
              className={`status-dropdown-option ${
                status === option ? "selected" : ""
              }`}
              onClick={() => handleSelect(option)}
            >
              <span>{option}</span>

              {status === option && (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Schedule() {
  const [availability, setAvailability] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [weekly, setWeekly] = useState({
    dayOfWeek: 1,
    ...initialForm
  });

  const [override, setOverride] = useState({
    date: tomorrow,
    ...initialForm
  });

  const [block, setBlock] = useState({
    date: tomorrow,
    startTime: "",
    endTime: ""
  });

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getError = (err) =>
    err.response?.data?.message || "Something went wrong.";

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [availabilityResponse, sessionsResponse] =
        await Promise.all([
          axiosInstance.get("/scheduling/availability"),
          axiosInstance.get("/scheduling/sessions")
        ]);

      setAvailability(
        availabilityResponse.data.availability || []
      );

      setSessions(
        sessionsResponse.data.sessions || []
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitWeekly = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await axiosInstance.post(
        "/scheduling/availability",
        {
          ...weekly,
          dayOfWeek: Number(weekly.dayOfWeek),
          slotDuration: Number(weekly.slotDuration),
          bufferMinutes: Number(weekly.bufferMinutes)
        }
      );

      setMessage("Weekly availability saved successfully.");
      loadData();
    } catch (err) {
      setError(getError(err));
    }
  };

  const submitOverride = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await axiosInstance.post(
        "/scheduling/availability/override",
        {
          ...override,
          slotDuration: Number(override.slotDuration),
          bufferMinutes: Number(override.bufferMinutes)
        }
      );

      setMessage("Date-specific availability saved.");
      loadData();
    } catch (err) {
      setError(getError(err));
    }
  };

  const submitBlock = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await axiosInstance.post(
        "/scheduling/availability/block",
        {
          date: block.date,
          startTime: block.startTime || undefined,
          endTime: block.endTime || undefined
        }
      );

      setMessage("Blocked time saved successfully.");
      loadData();
    } catch (err) {
      setError(getError(err));
    }
  };

  const deleteAvailability = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this schedule?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setMessage("");
      setError("");

      await axiosInstance.delete(
        `/scheduling/availability/${id}`
      );

      setMessage("Schedule deleted successfully.");
      await loadData();
    } catch (err) {
      setError(getError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setError("");

      await axiosInstance.put(
        `/scheduling/sessions/${id}`,
        { status }
      );

      setMessage("Appointment status updated.");
      await loadData();
    } catch (err) {
      setError(getError(err));
    }
  };

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  if (loading) {
    return (
      <main className="schedule-page">
        <p className="schedule-loading">Loading schedule...</p>
      </main>
    );
  }

  return (
    <main className="schedule-page">

      {/* Page Header */}
      <div className="schedule-header">
        <div>
          <span className="schedule-eyebrow">
            APPOINTMENT MANAGEMENT
          </span>

          <h1>Schedule Management</h1>

          <p>
            Manage your availability and client appointments
            from one place.
          </p>
        </div>
      </div>

      {/* Success and Error Messages */}
      {message && (
        <div className="schedule-message success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="schedule-message error-message">
          {error}
        </div>
      )}

      {/* Weekly Availability */}
      <section className="schedule-card">
        <div className="schedule-card-heading">
          <div>
            <span className="schedule-card-label">
              REGULAR HOURS
            </span>
            <h2>Weekly Availability</h2>
            <p>
              Set your regular working hours for each weekday.
            </p>
          </div>
          <div className="schedule-icon">📅</div>
        </div>

        <form onSubmit={submitWeekly} className="schedule-form">
          <label>
            Day
            <select
              value={weekly.dayOfWeek}
              onChange={(e) =>
                setWeekly({
                  ...weekly,
                  dayOfWeek: e.target.value
                })
              }
              className="schedule-input"
            >
              {dayNames.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          <label>
            Start Time
            <input
              type="time"
              required
              value={weekly.startTime}
              onChange={(e) =>
                setWeekly({
                  ...weekly,
                  startTime: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <label>
            End Time
            <input
              type="time"
              required
              value={weekly.endTime}
              onChange={(e) =>
                setWeekly({
                  ...weekly,
                  endTime: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <label>
            Session Duration
            <select
              value={weekly.slotDuration}
              onChange={(e) =>
                setWeekly({
                  ...weekly,
                  slotDuration: e.target.value
                })
              }
              className="schedule-input"
            >
              {[30, 45, 60, 90].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>

          <label>
            Buffer (Minutes)
            <input
              type="number"
              min="0"
              max="60"
              value={weekly.bufferMinutes}
              onChange={(e) =>
                setWeekly({
                  ...weekly,
                  bufferMinutes: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <button type="submit" className="schedule-primary-button">
            Save Weekly Availability
          </button>
        </form>
      </section>

      {/* One-time Availability */}
      <section className="schedule-card">
        <div className="schedule-card-heading">
          <div>
            <span className="schedule-card-label">
              SPECIAL HOURS
            </span>
            <h2>One-time Availability</h2>
            <p>
              Set different working hours for a particular date.
            </p>
          </div>
          <div className="schedule-icon">✨</div>
        </div>

        <form onSubmit={submitOverride} className="schedule-form">
          <label>
            Date
            <input
              type="date"
              min={tomorrow}
              required
              value={override.date}
              onChange={(e) =>
                setOverride({
                  ...override,
                  date: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <label>
            Start Time
            <input
              type="time"
              required
              value={override.startTime}
              onChange={(e) =>
                setOverride({
                  ...override,
                  startTime: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <label>
            End Time
            <input
              type="time"
              required
              value={override.endTime}
              onChange={(e) =>
                setOverride({
                  ...override,
                  endTime: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <label>
            Session Duration
            <select
              value={override.slotDuration}
              onChange={(e) =>
                setOverride({
                  ...override,
                  slotDuration: e.target.value
                })
              }
              className="schedule-input"
            >
              {[30, 45, 60, 90].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </label>

          <label>
            Buffer (Minutes)
            <input
              type="number"
              min="0"
              max="60"
              value={override.bufferMinutes}
              onChange={(e) =>
                setOverride({
                  ...override,
                  bufferMinutes: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <button type="submit" className="schedule-primary-button">
            Save Date Override
          </button>
        </form>
      </section>

      {/* Block Availability */}
      <section className="schedule-card">
        <div className="schedule-card-heading">
          <div>
            <span className="schedule-card-label">
              UNAVAILABLE HOURS
            </span>
            <h2>Block Availability</h2>
            <p>
              Block a full date or a specific time range.
            </p>
          </div>
          <div className="schedule-icon">🚫</div>
        </div>

        <form onSubmit={submitBlock} className="schedule-form">
          <label>
            Date
            <input
              type="date"
              min={tomorrow}
              required
              value={block.date}
              onChange={(e) =>
                setBlock({
                  ...block,
                  date: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <label>
            Start Time (Optional)
            <input
              type="time"
              value={block.startTime}
              onChange={(e) =>
                setBlock({
                  ...block,
                  startTime: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <label>
            End Time (Optional)
            <input
              type="time"
              value={block.endTime}
              onChange={(e) =>
                setBlock({
                  ...block,
                  endTime: e.target.value
                })
              }
              className="schedule-input"
            />
          </label>

          <button
            type="submit"
            className="schedule-danger-button"
          >
            Block Date / Time
          </button>
        </form>
      </section>

      {/* Saved Availability */}
      <section className="schedule-card">
        <div className="schedule-card-heading">
          <div>
            <span className="schedule-card-label">
              YOUR CONFIGURATION
            </span>
            <h2>Saved Availability</h2>
            <p>
              Review and manage your saved working hours.
            </p>
          </div>
          <div className="schedule-icon">🗓️</div>
        </div>

        {availability.length === 0 ? (
          <div className="schedule-empty">
            No availability configured yet.
          </div>
        ) : (
          <div className="saved-availability-list">
            {availability.map((item) => (
              <div
                key={item._id}
                className="saved-availability-item"
              >
                <div className="saved-availability-info">
                  <strong>
                    {item.type === "weekly"
                      ? dayNames[item.dayOfWeek]
                      : new Date(item.date).toLocaleDateString()}
                  </strong>

                  <span>
                    {item.type === "blocked"
                      ? item.startTime
                        ? `${item.startTime} – ${item.endTime}`
                        : "Entire day blocked"
                      : `${item.startTime} – ${item.endTime}`}
                  </span>

                  <span className={`availability-type ${item.type}`}>
                    {item.type}
                  </span>

                  {item.type !== "blocked" && (
                    <span className="availability-duration">
                      {item.slotDuration} min sessions
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => deleteAvailability(item._id)}
                  disabled={deletingId === item._id}
                  className="schedule-delete-button"
                >
                  {deletingId === item._id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Appointments */}
      <section className="schedule-card">
        <div className="schedule-card-heading">
          <div>
            <span className="schedule-card-label">
              CLIENT BOOKINGS
            </span>
            <h2>Appointments</h2>
            <p>
              View and update your client appointments.
            </p>
          </div>

          <div className="appointment-count">
            {sessions.length}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="schedule-empty">
            No appointments scheduled.
          </div>
        ) : (
          <div className="appointments-table-wrapper">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((session) => (
                  <tr key={session._id}>
                    <td>{session.clientName}</td>

                    <td>
                      {new Date(
                        session.date
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {session.startTime} – {session.endTime}
                    </td>

                    <td>{session.sessionType}</td>

                    <td>
                      <span
                        className={`appointment-status ${session.status}`}
                      >
                        {session.status}
                      </span>
                    </td>

                    <td>
                      <StatusDropdown
                        status={session.status}
                        onUpdate={(newStatus) =>
                          updateStatus(session._id, newStatus)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </main>
  );
}

export default Schedule;

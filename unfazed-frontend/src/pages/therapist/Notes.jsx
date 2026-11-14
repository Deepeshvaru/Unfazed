
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import SoapTemplate from "../../components/notes/SoapTemplate";
import useEntitlement from "../../hooks/useEntitlement";
import "./Notes.css";

const emptyForms = {
  basic: {
    content: ""
  },
  soap: {
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  },
  progress: {
    goals: "",
    progress: "",
    interventions: "",
    nextSteps: ""
  }
};

const templateFields = {
  basic: [
    { name: "content", label: "NOTE" }
  ],
  soap: [
    { name: "subjective", label: "SUBJECTIVE" },
    { name: "objective", label: "OBJECTIVE" },
    { name: "assessment", label: "ASSESSMENT" },
    { name: "plan", label: "PLAN" }
  ],
  progress: [
    { name: "goals", label: "GOALS" },
    { name: "progress", label: "PROGRESS" },
    { name: "interventions", label: "INTERVENTIONS" },
    { name: "nextSteps", label: "NEXT STEPS" }
  ]
};

function getId(value) {
  return value?._id || value || "";
}

function getArray(data) {
  if (Array.isArray(data)) return data;
  return data?.clients || data?.sessions || data?.notes || [];
}

function formatNoteContent(form, templateType) {
  const fields = templateFields[templateType] || templateFields.basic;

  return fields
    .map((field) => `${field.label}:\n${form[field.name] || ""}`)
    .join("\n\n");
}

function parseNoteContent(content = "", templateType = "basic") {
  const fields = templateFields[templateType] || templateFields.basic;
  const result = { ...emptyForms[templateType] };

  fields.forEach((field, index) => {
    const start = content.indexOf(`${field.label}:`);

    if (start === -1) return;

    const contentStart = start + field.label.length + 1;
    const nextField = fields[index + 1];

    const end = nextField
      ? content.indexOf(`${nextField.label}:`, contentStart)
      : content.length;

    result[field.name] = content
      .slice(contentStart, end === -1 ? content.length : end)
      .trim();
  });

  return result;
}

function detectTemplateType(note) {
  const savedType = note.templateType;

  if (["basic", "soap", "progress"].includes(savedType)) {
    if (
      savedType === "basic" &&
      note.content?.includes("SUBJECTIVE:") &&
      note.content?.includes("OBJECTIVE:")
    ) {
      return "soap";
    }

    return savedType;
  }

  if (
    note.content?.includes("SUBJECTIVE:") &&
    note.content?.includes("OBJECTIVE:")
  ) {
    return "soap";
  }

  if (
    note.content?.includes("GOALS:") &&
    note.content?.includes("INTERVENTIONS:")
  ) {
    return "progress";
  }

  return "basic";
}

function CustomDropdown({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  return (
    <div className={`custom-dropdown ${disabled ? "is-disabled" : ""}`}>
      <button
        id={id}
        type="button"
        className="custom-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span>
          {selectedOption?.label || placeholder}
        </span>

        <span className={`dropdown-arrow ${isOpen ? "rotated" : ""}`}>
          ⌄
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="custom-dropdown-menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`custom-dropdown-option ${
                value === option.value ? "selected" : ""
              }`}
              disabled={option.disabled}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


function Notes() {
  const {
    plan,
    loading: subscriptionLoading,
    error: subscriptionError
  } = useEntitlement();

  const [clients, setClients] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState([]);

  const [client, setClient] = useState("");
  const [session, setSession] = useState("");
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("private");

  const [templateType, setTemplateType] = useState("basic");
  const [soapForm, setSoapForm] = useState({ ...emptyForms.basic });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Subscription-based template access
  const planAccess = {
    free: ["basic"],
    pro: ["basic", "soap"],
    premium: ["basic", "soap", "progress"]
  };

  const normalizedPlan = String(plan || "free").toLowerCase();

  const allowedTemplates =
    planAccess[normalizedPlan] || planAccess.free;

  const isTemplateAllowed = (type) => {
    return allowedTemplates.includes(type);
  };

  const selectedSessions = sessions.filter((item) => {
    const sessionClientId = getId(item.client);

    return (
      sessionClientId === client ||
      (!sessionClientId &&
        clients.find((c) => getId(c._id) === client)?.email?.toLowerCase() ===
          item.clientEmail?.toLowerCase())
    );
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [clientRes, sessionRes, noteRes] = await Promise.all([
        axiosInstance.get("/clients"),
        axiosInstance.get("/scheduling/sessions"),
        axiosInstance.get("/notes")
      ]);

      setClients(getArray(clientRes.data));
      setSessions(getArray(sessionRes.data));
      setNotes(getArray(noteRes.data));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load clinical notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setClient("");
    setSession("");
    setTitle("");
    setVisibility("private");
    setTemplateType("basic");
    setSoapForm({ ...emptyForms.basic });
    setEditingId(null);
  };

  const handleClientChange = (value) => {
    setClient(value);
    setSession("");
  };

  const handleTemplateChange = (value) => {
    if (!isTemplateAllowed(value)) {
      setError(
        `Your ${normalizedPlan.toUpperCase()} plan does not include this note template. Please upgrade your subscription.`
      );
      return;
    }

    setError("");
    setSuccess("");
    setTemplateType(value);
    setSoapForm({ ...emptyForms[value] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (subscriptionLoading) {
      setError("Please wait while subscription access is checked.");
      return;
    }

    if (subscriptionError) {
      setError("Unable to verify your subscription. Please try again.");
      return;
    }

    if (!isTemplateAllowed(templateType)) {
      setError(
        "Your current subscription does not allow this note template."
      );
      return;
    }

    if (!client || !session || !title.trim()) {
      setError("Please select a client, session and enter a title.");
      return;
    }

    const content = formatNoteContent(soapForm, templateType);

    if (
      !content
        .replace(/^[A-Z ]+:\n/gm, "")
        .trim()
    ) {
      setError("Please enter at least one note section.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        client,
        session,
        title: title.trim(),
        content,
        visibility,
        templateType
      };

      if (editingId) {
        await axiosInstance.put(`/notes/${editingId}`, {
          title: payload.title,
          content: payload.content,
          visibility: payload.visibility,
          templateType: payload.templateType
        });

        setSuccess("Clinical note updated successfully.");
      } else {
        await axiosInstance.post("/notes", payload);
        setSuccess("Clinical note saved successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save clinical note.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (note) => {
    const selectedType = detectTemplateType(note);

    setEditingId(note._id);
    setClient(getId(note.client));
    setSession(getId(note.session));
    setTitle(note.title);
    setVisibility(note.visibility || "private");
    setTemplateType(selectedType);
    setSoapForm(parseNoteContent(note.content, selectedType));

    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this clinical note?"
    );

    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/notes/${id}`);

      setNotes((previous) => previous.filter((note) => note._id !== id));
      setSuccess("Clinical note deleted successfully.");

      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete note.");
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <main>
        <p>Loading clinical notes and subscription details...</p>
      </main>
    );
  }

  if (subscriptionError) {
    return (
      <main className="notes-page">
        <h1>Clinical Documentation</h1>
        <p role="alert">{subscriptionError}</p>
        <p>
          Subscription access could not be verified. Please refresh the page
          and try again.
        </p>
      </main>
    );
  }

  return (
    <main className="notes-page">
      <h1>Clinical Documentation</h1>
      <p>Create and manage session notes using different templates.</p>

      <section className="subscription-access">
        <p>
          Current Plan: <strong>{normalizedPlan.toUpperCase()}</strong>
        </p>

        <p>
          Available Templates:{" "}
          <strong>
            {allowedTemplates.length} of 3
          </strong>
        </p>

        {allowedTemplates.length < 3 && (
          <p>
            Want access to more clinical note templates?{" "}
            <Link to="/subscription">Upgrade your plan</Link>
          </p>
        )}
      </section>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}

      <section className="note-form-section">
        <h2>{editingId ? "Edit Clinical Note" : "Create Clinical Note"}</h2>

        <form onSubmit={handleSubmit}>
         <div>
  <label htmlFor="note-client">Select Client</label>

  <CustomDropdown
    id="note-client"
    value={client}
    onChange={handleClientChange}
    placeholder="Choose a client"
    options={clients.map((item) => ({
      value: item._id,
      label: `${item.name} (${item.email})`
    }))}
  />
</div>
          <div>
  <label htmlFor="note-session">Select Session</label>

  <CustomDropdown
    id="note-session"
    value={session}
    onChange={setSession}
    placeholder="Choose a session"
    disabled={!client}
    options={selectedSessions.map((item) => ({
      value: item._id,
      label: `${new Date(item.date).toLocaleDateString()} — ${item.startTime} (${item.status})`
    }))}
  />

  {client && selectedSessions.length === 0 && (
    <p>No sessions found for this client.</p>
  )}
</div>

          <div>
            <label htmlFor="note-title">Note Title</label>

            <input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              required
            />
          </div>

         <div>
  <label htmlFor="template-type">Note Template</label>

  <CustomDropdown
    id="template-type"
    value={templateType}
    onChange={handleTemplateChange}
    placeholder="Choose a template"
    disabled={!!editingId}
    options={[
      {
        value: "basic",
        label: "Basic Note — Free"
      },
      {
        value: "soap",
        label: isTemplateAllowed("soap")
          ? "SOAP Note — Pro"
          : "SOAP Note — Pro (Locked)",
        disabled: !isTemplateAllowed("soap")
      },
      {
        value: "progress",
        label: isTemplateAllowed("progress")
          ? "Progress Note — Premium"
          : "Progress Note — Premium (Locked)",
        disabled: !isTemplateAllowed("progress")
      }
    ]}
  />

  {!editingId &&
    (!isTemplateAllowed("soap") ||
      !isTemplateAllowed("progress")) && (
      <p>
        Locked templates require a subscription upgrade.{" "}
        <Link to="/subscription">View Plans</Link>
      </p>
    )}
</div>

          <SoapTemplate
            form={soapForm}
            onChange={setSoapForm}
            templateType={templateType}
          />

        <div>
  <label htmlFor="note-visibility">Visibility</label>

  <CustomDropdown
    id="note-visibility"
    value={visibility}
    onChange={setVisibility}
    placeholder="Choose visibility"
    options={[
      {
        value: "private",
        label: "Private Note"
      },
      {
        value: "shared",
        label: "Shared Note"
      }
    ]}
  />
</div>

          <button
            type="submit"
            disabled={saving || subscriptionLoading}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update Note"
                : "Save Clinical Note"}
          </button>

          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel Editing
            </button>
          )}
        </form>
      </section>

      <hr />

      <section className="saved-notes">
        <h2>Saved Clinical Notes ({notes.length})</h2>

        {notes.length === 0 ? (
          <p>No clinical notes saved yet.</p>
        ) : (
          notes.map((note) => (
            <article key={note._id} className="note-card">
              <h3>{note.title}</h3>

              <p>
                <strong>Template:</strong>{" "}
                {detectTemplateType(note).toUpperCase()}
              </p>

              <p>
                <strong>Client:</strong>{" "}
                {note.client?.name || "Client"}
              </p>

              <p>
                <strong>Session:</strong>{" "}
                {note.session?.date
                  ? new Date(note.session.date).toLocaleDateString()
                  : "Session"}
              </p>

              <p>
                <strong>Visibility:</strong> {note.visibility}
              </p>

              <pre style={{ whiteSpace: "pre-wrap" }}>
                {note.content}
              </pre>

              <p>
                <small>
                  Created: {new Date(note.createdAt).toLocaleString()}
                </small>
              </p>

              <button type="button" onClick={() => handleEdit(note)}>
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDelete(note._id)}
              >
                Delete
              </button>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default Notes;


import { Link } from "react-router-dom";
import useEntitlement from "../../hooks/useEntitlement";

function SoapTemplate({ form, onChange, templateType }) {
  const {
    plan,
    loading,
    error
  } = useEntitlement();

  const templates = {
    basic: {
      title: "Basic Note",
      fields: [
        {
          name: "content",
          label: "Note",
          description: "Write your session note"
        }
      ]
    },
    soap: {
      title: "SOAP Note",
      fields: [
        {
          name: "subjective",
          label: "Subjective",
          description: "Client's reported concerns and experiences"
        },
        {
          name: "objective",
          label: "Objective",
          description: "Observations from the session"
        },
        {
          name: "assessment",
          label: "Assessment",
          description: "Professional assessment"
        },
        {
          name: "plan",
          label: "Plan",
          description: "Next steps and follow-up plan"
        }
      ]
    },
    progress: {
      title: "Progress Note",
      fields: [
        {
          name: "goals",
          label: "Goals",
          description: "Goals being addressed"
        },
        {
          name: "progress",
          label: "Progress",
          description: "Progress since the previous session"
        },
        {
          name: "interventions",
          label: "Interventions",
          description: "Activities or approaches used during the session"
        },
        {
          name: "nextSteps",
          label: "Next Steps",
          description: "Plans for upcoming sessions"
        }
      ]
    }
  };

  const selectedTemplate = templates[templateType] || templates.basic;

  const planAccess = {
    free: ["basic"],
    pro: ["basic", "soap"],
    premium: ["basic", "soap", "progress"]
  };

  const normalizedPlan = String(plan || "free").toLowerCase();

  const allowedTemplates =
    planAccess[normalizedPlan] || planAccess.free;

  const isLocked = !allowedTemplates.includes(
    templates[templateType] ? templateType : "basic"
  );

  if (loading) {
    return (
      <div className="soap-template">
        <p>Checking your subscription access...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="soap-template">
        <p role="alert">{error}</p>
        <p>Please refresh the page to check your subscription.</p>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="soap-template locked-template">
        <h2>{selectedTemplate.title}</h2>

        <div className="template-lock-message">
          <h3>Upgrade Required</h3>

          <p>
            This clinical note template is not available
            on your current {normalizedPlan.toUpperCase()} plan.
          </p>

          {templateType === "soap" && (
            <p>
              Upgrade to Pro or Premium to access SOAP Notes.
            </p>
          )}

          {templateType === "progress" && (
            <p>
              Upgrade to Premium to access Progress Notes.
            </p>
          )}

          <Link to="/subscription" className="upgrade-button">
            View Subscription Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="soap-template">
      <h2>{selectedTemplate.title}</h2>

      {selectedTemplate.fields.map((field) => (
        <div key={field.name} className="soap-field">
          <label htmlFor={field.name}>
            {field.label}
          </label>

          <p>{field.description}</p>

          <textarea
            id={field.name}
            name={field.name}
            rows="4"
            value={form[field.name] || ""}
            onChange={(e) =>
              onChange({
                ...form,
                [field.name]: e.target.value
              })
            }
            placeholder={`Enter ${field.label.toLowerCase()} details...`}
          />
        </div>
      ))}
    </div>
  );
}

export default SoapTemplate;

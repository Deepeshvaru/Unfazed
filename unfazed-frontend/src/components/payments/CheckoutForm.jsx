
import { useState } from "react";

function CustomDropdown({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  return (
    <div className="custom-dropdown">
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <span className={`dropdown-arrow ${isOpen ? "open" : ""}`}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu" role="listbox">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              className={`custom-dropdown-option ${
                String(option.value) === String(value) ? "selected" : ""
              }`}
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

function CheckoutForm({ packages = [], clients = [], onSubmit, loading }) {
  const [packageId, setPackageId] = useState("");
  const [clientId, setClientId] = useState("");

  const selectedPackage = packages.find(
    (item) => item._id === packageId
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!packageId || !clientId) return;

    onSubmit?.({ packageId, clientId });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Checkout</h2>

      <label>Select Client</label>

      <CustomDropdown
        value={clientId}
        onChange={setClientId}
        placeholder="Choose a client"
        options={clients.map((client) => ({
          value: client._id,
          label: `${client.name} (${client.email})`,
        }))}
      />

      <label>Select Package</label>

      <CustomDropdown
        value={packageId}
        onChange={setPackageId}
        placeholder="Choose a package"
        options={packages.map((item) => ({
          value: item._id,
          label: `${item.name} — ₹${item.price}`,
        }))}
      />

      {selectedPackage && (
        <section>
          <p>Package: {selectedPackage.name}</p>
          <p>Sessions: {selectedPackage.sessionsCount}</p>
          <p>Validity: {selectedPackage.validityDays} days</p>
          <h3>Amount: ₹{selectedPackage.price}</h3>
        </section>
      )}

      <button
        type="submit"
        disabled={loading || !packageId || !clientId}
      >
        {loading ? "Processing..." : "Continue to Payment"}
      </button>
    </form>
  );
}

export default CheckoutForm;

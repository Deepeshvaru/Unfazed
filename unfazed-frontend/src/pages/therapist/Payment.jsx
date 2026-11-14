
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import CheckoutForm from "../../components/payments/CheckoutForm";
import InvoiceView from "../../components/payments/InvoiceView";
import "./Payment.css";

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

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN");
}

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

function Payment() {
  const [packages, setPackages] = useState([]);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [requestClientId, setRequestClientId] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestSaving, setRequestSaving] = useState(false);
  const [clientPackages, setClientPackages] = useState([]);

  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [sessionsCount, setSessionsCount] = useState(3);
  const [price, setPrice] = useState("");
  const [validityDays, setValidityDays] = useState(90);
  const [editingPackageId, setEditingPackageId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState("");

  const fetchData = async () => {
    try {
      setError("");

      const [
        packageResponse,
        clientResponse,
        paymentResponse,
        clientPackageResponse,
      ] = await Promise.all([
        axiosInstance.get("/payments/packages"),
        axiosInstance.get("/clients"),
        axiosInstance.get("/payments/history"),
        axiosInstance.get("/payments/client-packages"),
      ]);

      setPackages(packageResponse.data || []);
      setClients(clientResponse.data.clients || []);
      setPayments(paymentResponse.data || []);
      setClientPackages(clientPackageResponse.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load payment information."
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Download invoice for a payment from payment history
  const downloadPaymentInvoice = async (paymentId) => {
    try {
      setDownloadingInvoiceId(paymentId);
      setError("");

      const response = await axiosInstance.get(
        `/payments/invoice/${paymentId}`,
        {
          responseType: "blob",
        }
      );

      const file = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(file);
      const link = document.createElement("a");

      link.href = url;
      link.download = `UNF-${paymentId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Invoice download error:", err);
      setError("Unable to download invoice. Please try again.");
    } finally {
      setDownloadingInvoiceId("");
    }
  };
  const startEditPackage = (item) => {
  setEditingPackageId(item._id);
  setPackageName(item.name);
  setDescription(item.description || "");
  setSessionsCount(item.sessionsCount);
  setPrice(item.price);
  setValidityDays(item.validityDays);
  setError("");
  setMessage("");
};

const cancelEditPackage = () => {
  setEditingPackageId(null);
  setPackageName("");
  setDescription("");
  setSessionsCount(3);
  setPrice("");
  setValidityDays(90);
};
const createPackage = async (e) => {
  e.preventDefault();

  try {
    setSaving(true);
    setError("");
    setMessage("");

    const packageData = {
      name: packageName.trim(),
      description: description.trim(),
      sessionsCount: Number(sessionsCount),
      price: Number(price),
      validityDays: Number(validityDays),
    };

    if (
      !packageData.name ||
      packageData.sessionsCount < 1 ||
      packageData.price < 1 ||
      packageData.validityDays < 1
    ) {
      setError("Please enter valid package details.");
      return;
    }

    if (editingPackageId) {
      await axiosInstance.put(
        `/payments/packages/${editingPackageId}`,
        packageData
      );

      setMessage("Package updated successfully.");
    } else {
      await axiosInstance.post(
        "/payments/packages",
        packageData
      );

      setMessage("Package created successfully.");
    }

    cancelEditPackage();
    await fetchData();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Unable to save package."
    );
  } finally {
    setSaving(false);
  }
};

  const createPaymentRequest = async (e) => {
    e.preventDefault();

    try {
      setRequestSaving(true);
      setError("");
      setMessage("");

      await axiosInstance.post("/payments/requests", {
        clientId: requestClientId,
        amount: Number(requestAmount),
        description: requestDescription.trim(),
      });

      setRequestClientId("");
      setRequestAmount("");
      setRequestDescription("");

      setMessage("Payment request created successfully.");

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create payment request."
      );
    } finally {
      setRequestSaving(false);
    }
  };

  const handlePayment = async ({ packageId, clientId }) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      setInvoice(null);

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay checkout.");
      }

      const orderResponse = await axiosInstance.post(
        "/payments/create-order",
        {
          packageId,
          clientId,
        }
      );

      const order = orderResponse.data;

      const selectedClient = clients.find(
        (client) => client._id === clientId
      );

      const selectedPackage = packages.find(
        (item) => item._id === packageId
      );

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Unfazed",
        description: selectedPackage?.name || "Therapy Package",
        order_id: order.orderId,

        handler: async function (response) {
          try {
            const verification = await axiosInstance.post(
              "/payments/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );

            const verifiedPayment = verification.data.payment;

            setInvoice({
              ...verifiedPayment,
              clientName: selectedClient?.name,
              packageName: selectedPackage?.name,
              date:
                verifiedPayment?.createdAt ||
                new Date().toISOString(),
              status: verifiedPayment?.status || "success",
            });

            setMessage(
              verification.data.message ||
                "Payment verified successfully."
            );

            await fetchData();
          } catch (err) {
            setError(
              err.response?.data?.message ||
                "Payment verification failed. Please contact the therapist before retrying."
            );
          } finally {
            setLoading(false);
          }
        },

        prefill: {
          name: selectedClient?.name || "",
          email: selectedClient?.email || "",
        },

        theme: {
          color: "#6C63FF",
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
            setMessage("Payment checkout was closed.");
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (response) {
        setError(
          response.error?.description || "Payment was unsuccessful."
        );
        setLoading(false);
        fetchData();
      });

      checkout.open();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start payment."
      );
      setLoading(false);
    }
  };

  const togglePackageStatus = async (item) => {
    try {
      setError("");
      setMessage("");

      await axiosInstance.put(`/payments/packages/${item._id}`, {
        isActive: !item.isActive,
      });

      setMessage(
        item.isActive
          ? "Package deactivated."
          : "Package activated."
      );

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update package."
      );
    }
  };

  return (
    <main className="payments-page">
      <h1>Payments & Packages</h1>
      <p>Manage therapy packages and client payments.</p>

      {error && <p role="alert">{error}</p>}
      {message && <p>{message}</p>}

      <section>
       <h2>
  {editingPackageId ? "Edit Session Package" : "Create Session Package"}
</h2>

        <form onSubmit={createPackage}>
          <label>Package Name</label>
          <input
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            required
          />

          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label>Number of Sessions</label>
          <CustomDropdown
  value={sessionsCount}
  onChange={setSessionsCount}
  placeholder="Select number of sessions"
  options={[
    { value: 3, label: "3 Sessions" },
    { value: 6, label: "6 Sessions" },
    { value: 12, label: "12 Sessions" },
  ]}
/>

          <label>Price (INR)</label>
          <input
            type="number"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <label>Validity (Days)</label>
          <input
            type="number"
            min="1"
            value={validityDays}
            onChange={(e) => setValidityDays(e.target.value)}
            required
          />

        <button type="submit" disabled={saving}>
  {saving
    ? "Saving..."
    : editingPackageId
    ? "Update Package"
    : "Create Package"}
</button>

{editingPackageId && (
  <button
    type="button"
    onClick={cancelEditPackage}
    disabled={saving}
  >
    Cancel Edit
  </button>
)}
        </form>
      </section>

      <hr />

      <section>
  <h2>Available Packages ({packages.length})</h2>

  {packages.length === 0 ? (
    <p>No packages created yet.</p>
  ) : (
    packages.map((item) => (
      <article key={item._id}>
        <h3>{item.name}</h3>

        <p>{item.description || "No description"}</p>

        <p>Sessions: {item.sessionsCount}</p>

        <p>
          Total Price: ₹{Number(item.price).toFixed(2)}
        </p>

        <p>
          Price Per Session: ₹
          {(
            Number(item.price) / Number(item.sessionsCount)
          ).toFixed(2)}
        </p>

        <p>Validity: {item.validityDays} days</p>

        <p>
          Status: {item.isActive ? "Active" : "Inactive"}
        </p>

        <button
          type="button"
          onClick={() => startEditPackage(item)}
        >
          Edit Package
        </button>

        <button
          type="button"
          onClick={() => togglePackageStatus(item)}
        >
          {item.isActive
            ? "Deactivate Package"
            : "Activate Package"}
        </button>
      </article>
    ))
  )}
</section>

      <hr />

      <section>
        <h2>Create Individual Payment Request</h2>

        <form onSubmit={createPaymentRequest}>
          <label>Select Client</label>

         <CustomDropdown
  value={requestClientId}
  onChange={setRequestClientId}
  placeholder="Select a client"
  options={clients
    .filter((client) => client.status === "active")
    .map((client) => ({
      value: client._id,
      label: `${client.name} (${client.email})`,
    }))}
/>

          <label>Amount (INR)</label>

          <input
            type="number"
            min="1"
            step="0.01"
            value={requestAmount}
            onChange={(e) => setRequestAmount(e.target.value)}
            required
          />

          <label>Payment Description</label>

          <textarea
            value={requestDescription}
            onChange={(e) =>
              setRequestDescription(e.target.value)
            }
            placeholder="Example: Individual therapy session"
            required
          />

          <button type="submit" disabled={requestSaving}>
            {requestSaving
              ? "Creating..."
              : "Create Payment Request"}
          </button>
        </form>
      </section>

      <hr />

      <CheckoutForm
        packages={packages.filter((item) => item.isActive)}
        clients={clients.filter(
          (client) => client.status === "active"
        )}
        onSubmit={handlePayment}
        loading={loading}
      />

      {invoice && (
        <>
          <hr />
          <InvoiceView invoice={invoice} />
        </>
      )}

      <hr />

      <section>
        <h2>
          Purchased Client Packages ({clientPackages.length})
        </h2>

        {clientPackages.length === 0 ? (
          <p>No purchased packages yet.</p>
        ) : (
          clientPackages.map((record) => (
            <article key={record._id}>
              <h3>{record.package?.name || "Package"}</h3>
              <p>
                Client: {record.client?.name || "Not available"}
              </p>
              <p>Total sessions: {record.totalSessions}</p>
              <p>Used sessions: {record.usedSessions}</p>
              <p>
                Remaining sessions:{" "}
                {Math.max(
                  0,
                  record.totalSessions - record.usedSessions
                )}
              </p>
              <p>
                Purchase date: {formatDate(record.purchaseDate)}
              </p>
              <p>Expiry date: {formatDate(record.expiryDate)}</p>
              <p>Status: {record.status}</p>
            </article>
          ))
        )}
      </section>

      <hr />

      <section>
        <h2>Payment History ({payments.length})</h2>

        {payments.length === 0 ? (
          <p>No payment records found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Package / Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Invoice</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>
                    {payment.client?.name || "Not available"}
                  </td>

                  <td>
                    {payment.package?.name ||
                      payment.description ||
                      "Individual payment"}
                  </td>

                  <td>
                    {payment.currency || "INR"} {payment.amount}
                  </td>

                  <td>{payment.status}</td>

                  <td>{formatDate(payment.createdAt)}</td>

                  <td>
                    {payment.status === "success" ? (
                      <button
                        type="button"
                        disabled={
                          downloadingInvoiceId === payment._id
                        }
                        onClick={() =>
                          downloadPaymentInvoice(payment._id)
                        }
                      >
                        {downloadingInvoiceId === payment._id
                          ? "Downloading..."
                          : "Download PDF"}
                      </button>
                    ) : (
                      "Not available"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

export default Payment;


import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import CheckoutForm from "../../components/payments/CheckoutForm";
import InvoiceView from "../../components/payments/InvoiceView";

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

function Payment() {
  const [packages, setPackages] = useState([]);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [clientPackages, setClientPackages] = useState([]);

  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [sessionsCount, setSessionsCount] = useState(3);
  const [price, setPrice] = useState("");
  const [validityDays, setValidityDays] = useState(90);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [invoice, setInvoice] = useState(null);

  const fetchData = async () => {
    try {
      setError("");

      const [
        packageResponse,
        clientResponse,
        paymentResponse,
        clientPackageResponse
      ] = await Promise.all([
        axiosInstance.get("/payments/packages"),
        axiosInstance.get("/clients"),
        axiosInstance.get("/payments/history"),
        axiosInstance.get("/payments/client-packages")
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

  const createPackage = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await axiosInstance.post("/payments/packages", {
        name: packageName.trim(),
        description: description.trim(),
        sessionsCount: Number(sessionsCount),
        price: Number(price),
        validityDays: Number(validityDays)
      });

      setPackageName("");
      setDescription("");
      setPrice("");
      setSessionsCount(3);
      setValidityDays(90);

      setMessage("Package created successfully.");
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to create package."
      );
    } finally {
      setSaving(false);
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
        { packageId, clientId }
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
                razorpay_signature: response.razorpay_signature
              }
            );

            const verifiedPayment = verification.data.payment;

            setInvoice({
              ...verifiedPayment,
              clientName: selectedClient?.name,
              packageName: selectedPackage?.name,
              date: verifiedPayment?.createdAt || new Date().toISOString(),
              status: verifiedPayment?.status || "success"
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
          email: selectedClient?.email || ""
        },

        theme: {
          color: "#6C63FF"
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
            setMessage("Payment checkout was closed.");
          }
        }
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (response) {
        setError(
          response.error?.description ||
          "Payment was unsuccessful."
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
        isActive: !item.isActive
      });

      setMessage(
        item.isActive
          ? "Package deactivated."
          : "Package activated."
      );

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update package."
      );
    }
  };

  return (
    <main>
      <h1>Payments & Packages</h1>
      <p>Manage therapy packages and client payments.</p>

      {error && <p role="alert">{error}</p>}
      {message && <p>{message}</p>}

      <section>
        <h2>Create Session Package</h2>

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
          <select
            value={sessionsCount}
            onChange={(e) => setSessionsCount(e.target.value)}
          >
            <option value={3}>3 Sessions</option>
            <option value={6}>6 Sessions</option>
            <option value={12}>12 Sessions</option>
          </select>

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
            {saving ? "Saving..." : "Create Package"}
          </button>
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
              <p>Price: ₹{item.price}</p>
              <p>Validity: {item.validityDays} days</p>
              <p>Status: {item.isActive ? "Active" : "Inactive"}</p>

              <button
                type="button"
                onClick={() => togglePackageStatus(item)}
              >
                {item.isActive ? "Deactivate Package" : "Activate Package"}
              </button>
            </article>
          ))
        )}
      </section>

      <hr />

      <CheckoutForm
        packages={packages.filter((item) => item.isActive)}
        clients={clients.filter((client) => client.status === "active")}
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
        <h2>Purchased Client Packages ({clientPackages.length})</h2>

        {clientPackages.length === 0 ? (
          <p>No purchased packages yet.</p>
        ) : (
          clientPackages.map((record) => (
            <article key={record._id}>
              <h3>{record.package?.name || "Package"}</h3>
              <p>Client: {record.client?.name || "Not available"}</p>
              <p>Total sessions: {record.totalSessions}</p>
              <p>Used sessions: {record.usedSessions}</p>
              <p>
                Remaining sessions:{" "}
                {Math.max(0, record.totalSessions - record.usedSessions)}
              </p>
              <p>Purchase date: {formatDate(record.purchaseDate)}</p>
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
                <th>Package</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.client?.name || "Not available"}</td>
                  <td>{payment.package?.name || "Not available"}</td>
                  <td>
                    {payment.currency || "INR"} {payment.amount}
                  </td>
                  <td>{payment.status}</td>
                  <td>{formatDate(payment.createdAt)}</td>
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


import axiosInstance from "../../api/axiosInstance";

function InvoiceView({ invoice }) {
  if (!invoice) return null;

  const date = invoice.date
    ? new Date(invoice.date).toLocaleDateString("en-IN")
    : "Not available";

  const downloadInvoice = async () => {
    try {
      const response = await axiosInstance.get(
        `/payments/invoice/${invoice._id}`,
        {
          responseType: "blob"
        }
      );

      const file = new Blob([response.data], {
        type: "application/pdf"
      });

      const url = window.URL.createObjectURL(file);
      const link = document.createElement("a");

      link.href = url;
      link.download = `UNF-${invoice._id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Invoice download error:", error);
      alert("Unable to download invoice. Please try again.");
    }
  };

  return (
    <section>
      <h2>Payment Invoice</h2>

      <p>Invoice ID: UNF-{invoice._id}</p>
      <p>Client: {invoice.clientName || "Not available"}</p>
      <p>Package: {invoice.packageName || "Not available"}</p>

      <p>
        Payment ID: {invoice.razorpayPaymentId || "Not available"}
      </p>

      <h3>
        Amount: {invoice.currency || "INR"}{" "}
        {Number(invoice.amount).toFixed(2)}
      </h3>

      <p>Payment Status: {invoice.status}</p>
      <p>Date: {date}</p>

      <button type="button" onClick={downloadInvoice}>
        Download PDF Invoice
      </button>
    </section>
  );
}

export default InvoiceView;

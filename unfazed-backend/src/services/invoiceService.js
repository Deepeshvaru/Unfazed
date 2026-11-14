
const PDFDocument = require("pdfkit");

const generateInvoice = (payment, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50
  });

  doc.pipe(res);

  const therapist = payment.therapist || {};
  const client = payment.client || {};
  const packageInfo = payment.package || {};

  const invoiceNumber = `UNF-${payment._id}`;
  const invoiceDate = payment.createdAt
    ? new Date(payment.createdAt).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");

  doc
    .fontSize(24)
    .fillColor("#6C63FF")
    .text("UNFAZED", { align: "center" });

  doc
    .fontSize(11)
    .fillColor("#555555")
    .text("Payment Receipt", { align: "center" });

  doc.moveDown(2);

  doc
    .fontSize(12)
    .fillColor("#222222")
    .text(`Invoice Number: ${invoiceNumber}`);

  doc.text(`Invoice Date: ${invoiceDate}`);
  doc.text(`Payment Status: ${payment.status.toUpperCase()}`);

  doc.moveDown();

  doc
    .fontSize(14)
    .fillColor("#6C63FF")
    .text("Therapist Details");

  doc
    .fontSize(11)
    .fillColor("#222222")
    .text(`Name: ${therapist.name || "Not available"}`);

  if (therapist.email) {
    doc.text(`Email: ${therapist.email}`);
  }

  doc.moveDown();

  doc
    .fontSize(14)
    .fillColor("#6C63FF")
    .text("Client Details");

  doc
    .fontSize(11)
    .fillColor("#222222")
    .text(`Name: ${client.name || "Not available"}`);

  doc.text(`Email: ${client.email || "Not available"}`);

  doc.moveDown();

  doc
    .fontSize(14)
    .fillColor("#6C63FF")
    .text("Purchase Details");

  doc
    .fontSize(11)
    .fillColor("#222222")
    .text(`Package: ${packageInfo.name || "Therapy Package"}`);

  doc.text(`Payment ID: ${payment.razorpayPaymentId || "Not available"}`);

  doc.moveDown();

  doc
    .fontSize(16)
    .fillColor("#222222")
    .text(
      `Total Amount: ${payment.currency || "INR"} ${Number(payment.amount).toFixed(2)}`
    );

  doc.moveDown();

  doc
    .fontSize(10)
    .fillColor("#666666")
    .text("GST / Tax: Not separately calculated or charged.");

  doc.text(
    "This document is a payment receipt, not a GST tax invoice. GST registration and tax details must be configured separately where applicable."
  );

  doc.moveDown(2);

  doc
    .fontSize(11)
    .fillColor("#6C63FF")
    .text("Thank you for choosing Unfazed.", {
      align: "center"
    });

  doc.end();
};

module.exports = generateInvoice;

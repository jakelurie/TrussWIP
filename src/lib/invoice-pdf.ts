import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceData {
  invoiceNumber: string;
  producerName: string;
  companyName?: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  bookings: {
    projectName: string;
    city: string;
    techName: string;
    role: string;
    hours: number;
    rate: number;
    amount: number;
    poNumber?: string;
    date: string;
  }[];
  subtotal: number;
  platformFees: number;
  total: number;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(24);
  doc.setTextColor(255, 77, 0);
  doc.text("TRUSS", 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  doc.text("trusswork.org", 20, 32);

  // Invoice info
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text("INVOICE", 140, 25);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Invoice #: ${data.invoiceNumber}`, 140, 35);
  doc.text(`Period: ${formatDate(data.periodStart)} — ${formatDate(data.periodEnd)}`, 140, 42);
  doc.text(`Due: ${formatDate(data.dueDate)}`, 140, 49);

  // Bill to
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  doc.text("BILL TO", 20, 55);

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(data.producerName, 20, 62);
  if (data.companyName) {
    doc.text(data.companyName, 20, 68);
  }

  // Bookings table
  const tableBody = data.bookings.map(b => [
    b.projectName,
    b.techName,
    b.role,
    `${b.hours}hr`,
    `$${b.rate}/hr`,
    `$${b.amount.toLocaleString()}`,
    b.poNumber || "—",
  ]);

  autoTable(doc, {
    startY: 80,
    head: [["Project", "Technician", "Role", "Hours", "Rate", "Amount", "PO #"]],
    body: tableBody,
    headStyles: {
      fillColor: [255, 77, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      5: { halign: "right" },
    },
    margin: { left: 20, right: 20 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable?.finalY || 180;

  doc.setDrawColor(200, 200, 200);
  doc.line(120, finalY + 10, 190, finalY + 10);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Subtotal:", 120, finalY + 20);
  doc.text(`$${data.subtotal.toLocaleString()}`, 190, finalY + 20, { align: "right" });

  doc.text("Platform Fee (10%):", 120, finalY + 28);
  doc.text(`$${data.platformFees.toLocaleString()}`, 190, finalY + 28, { align: "right" });

  doc.line(120, finalY + 32, 190, finalY + 32);

  doc.setFontSize(13);
  doc.setTextColor(255, 77, 0);
  doc.text("Total Due:", 120, finalY + 42);
  doc.text(`$${data.total.toLocaleString()}`, 190, finalY + 42, { align: "right" });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Truss — The backbone of every show", 105, 280, { align: "center" });
  doc.text("Questions? crew@trusswork.org", 105, 285, { align: "center" });

  return doc;
}

function formatDate(d: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

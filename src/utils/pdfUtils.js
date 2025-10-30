import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function handleGeneratePDF(
  selectedMonth,
  selectedYear,
  elementId
) {
  const docPdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });
  const monthName = new Date(selectedYear, selectedMonth).toLocaleString(
    "it-IT",
    {
      month: "long",
      year: "numeric",
    }
  );

  docPdf.setFontSize(18);
  docPdf.text(`Resoconto Finanziario - ${monthName}`, 20, 30);
  docPdf.setFontSize(12);
  docPdf.text("Administrare Pecuniae", 20, 50);

  const chartEl = document.getElementById(elementId);
  if (chartEl) {
    const canvas = await html2canvas(chartEl);
    const imgData = canvas.toDataURL("image/png");
    docPdf.addImage(imgData, "PNG", 20, 60, 350, 250);
  }

  docPdf.save(`Resoconto-${monthName}.pdf`);
}

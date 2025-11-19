import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

// Funzione principale
export async function handleGeneratePDF({
  selectedMonth,
  selectedYear,
  transactions,
  accounts,
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Sfondo
  applyBackground(doc);

  const monthName = new Date(selectedYear, selectedMonth).toLocaleString(
    "it-IT",
    { month: "long", year: "numeric" }
  );

  let y = 25;

  // Logo
  try {
    const logoURL = `${window.location.origin}/imgs/logo.png`;
    const logo = await loadImage(logoURL);
    doc.addImage(logo, "PNG", 15, y, 40, 40);
  } catch (err) {
    console.error("Errore caricamento logo:", err);
  }

  y += 50;

  // Titolo principale
  doc.setFontSize(26);
  doc.setTextColor("#022D4C");
  doc.text("Resoconto Finanziario", 15, y);

  y += 12;

  doc.setFontSize(16);
  doc.text(`${monthName}`, 15, y);

  y += 5;
  doc.setDrawColor(0);
  doc.line(15, y, 195, y);
  y += 12;

  // Calcolo totali
  const txForMonth = transactions.filter((t) => {
    const d = new Date(t.data);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totaleEntrate = sum(txForMonth, "entrata");
  const totaleUscite = sum(txForMonth, "uscita");
  const totaleRisparmi = sum(txForMonth, "risparmio");
  const saldoNetto = totaleEntrate - totaleUscite - totaleRisparmi;

  // Riepilogo mese
  doc.setFontSize(18);
  doc.setTextColor("#022D4C");
  doc.text("Riepilogo del mese", 15, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor("#000000");
  doc.text(`Entrate totali: € ${totaleEntrate.toFixed(2)}`, 15, y);
  y += 7;
  doc.text(`Uscite totali: € ${totaleUscite.toFixed(2)}`, 15, y);
  y += 7;
  doc.text(`Risparmi totali: € ${totaleRisparmi.toFixed(2)}`, 15, y);
  y += 7;

  doc.setFontSize(13);
  doc.setTextColor("#022D4C");
  doc.text(`Saldo netto: € ${saldoNetto.toFixed(2)}`, 15, y);

  // Grafici
  await addChartPage(doc, "chart-pdf", "Grafico generale mensile");
  await addChartPage(doc, "chart-entrate", "Grafico Entrate");
  await addChartPage(doc, "chart-uscite", "Grafico Uscite");
  await addChartPage(doc, "chart-risparmi", "Grafico Risparmi");

  // Riepilogo per conto
  doc.addPage();
  applyBackground(doc);

  doc.setFontSize(20);
  doc.setTextColor("#022D4C");
  doc.text("Riepilogo per conto", 15, 20);

  const summaryRows = [];

  accounts.forEach((acc) => {
    const perConto = txForMonth.filter((t) => t.conto === acc.id);

    ["entrata", "uscita", "risparmio"].forEach((tipo) => {
      const tot = perConto
        .filter((t) => t.type === tipo)
        .reduce((s, t) => s + Number(t.importo), 0);

      if (tot > 0) {
        summaryRows.push([
          acc.nome,
          tipo.charAt(0).toUpperCase() + tipo.slice(1),
          `€ ${tot.toFixed(2)}`,
        ]);
      }
    });
  });

  autoTable(doc, {
    startY: 28,
    head: [["Conto", "Tipo", "Totale (€)"]],
    body: summaryRows,
    headStyles: {
      fillColor: [200, 200, 200], // Grigio
      textColor: 0,
    },
    styles: { fontSize: 11, fillColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 243, 227] },
    tableWidth: "auto",
  });

  // Storico transazioni
  doc.addPage();
  applyBackground(doc);

  doc.setFontSize(20);
  doc.setTextColor("#022D4C");
  doc.text("Storico transazioni", 15, 20);

  if (txForMonth.length > 0) {
    const rows = txForMonth
      .slice()
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .map((t) => [
        new Date(t.data).toLocaleDateString("it-IT"),
        t.type,
        t.categoria,
        accounts.find((a) => a.id === t.conto)?.nome || "",
        `€ ${Number(t.importo).toFixed(2)}`,
        t.descrizione || "",
      ]);

    autoTable(doc, {
      startY: 28,
      head: [["Data", "Tipo", "Categoria", "Conto", "Importo", "Descrizione"]],
      body: rows,
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 0,
      },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [250, 243, 227] },
      columnStyles: {
        5: { cellWidth: 60 },
      },
    });
  }

  // Salvataggio PDF
  doc.save(`Resoconto-${monthName}.pdf`);
}

// Somma valori per tipo
function sum(arr, type) {
  return arr
    .filter((t) => t.type === type)
    .reduce((s, t) => s + Number(t.importo), 0);
}

// Sfondo
function applyBackground(doc) {
  doc.setFillColor("#FAF3E3");
  doc.rect(
    0,
    0,
    doc.internal.pageSize.width,
    doc.internal.pageSize.height,
    "F"
  );
}

// Caricamento logo immagine
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Inserisce un grafico in una pagina separata
async function addChartPage(doc, elementId, title) {
  const element = document.getElementById(elementId);
  if (!element) return;

  doc.addPage();
  applyBackground(doc);

  doc.setFontSize(20);
  doc.setTextColor("#022D4C");
  doc.text(title, 15, 20);

  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");

  const width = doc.internal.pageSize.getWidth() - 30;
  const height = (canvas.height / canvas.width) * width;

  doc.addImage(imgData, "PNG", 15, 35, width, height);
}

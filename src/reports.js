import { formatRupiah, showToast } from './ui.js';

let charts = {};

export function populateReportDashboard(transactions) {
  const inCanvas = document.getElementById('category-in-chart');
  const outCanvas = document.getElementById('category-out-chart');
  
  if (!inCanvas || !outCanvas) return;
  
  const inCtx = inCanvas.getContext('2d');
  const outCtx = outCanvas.getContext('2d');

  if (charts.categoryIn) charts.categoryIn.destroy();
  if (charts.categoryOut) charts.categoryOut.destroy();

  const catIn = {};
  const catOut = {};

  transactions.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'pemasukan') {
      catIn[t.category] = (catIn[t.category] || 0) + amt;
    } else {
      catOut[t.category] = (catOut[t.category] || 0) + amt;
    }
  });

  const buildPieChart = (ctx, dataMap, colorPalette) => {
    const labels = Object.keys(dataMap);
    const data = Object.values(dataMap);

    const isDarkMode = document.documentElement.classList.contains('dark');

    if (labels.length === 0) {
      return new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Tidak Ada Data'],
          datasets: [{ data: [1], backgroundColor: ['#475569'] }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: isDarkMode ? '#e2e8f0' : '#475569' }
            }
          }
        }
      });
    }

    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colorPalette,
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDarkMode ? '#e2e8f0' : '#475569',
              font: { family: 'Outfit', size: 10 }
            }
          }
        }
      }
    });
  };

  const greenPalette = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857'];
  const rosePalette = ['#f43f5e', '#fb7185', '#e11d48', '#fca5a5', '#be123c'];

  charts.categoryIn = buildPieChart(inCtx, catIn, greenPalette);
  charts.categoryOut = buildPieChart(outCtx, catOut, rosePalette);
}

// Bind PDF & Excel export event listeners
export function initReportsListeners(getTransactions) {
  const startField = document.getElementById('report-start-date');
  const endField = document.getElementById('report-end-date');

  // Set default dates
  const todayStr = new Date().toISOString().substring(0, 10);
  const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10);
  
  if (startField) startField.value = firstDayStr;
  if (endField) endField.value = todayStr;

  const getFilteredData = () => {
    const transactions = getTransactions();
    const start = startField.value;
    const end = endField.value;
    
    return transactions.filter(t => {
      return t.date >= start && t.date <= end;
    }).sort((a, b) => b.date.localeCompare(a.date));
  };

  // PDF Export
  const btnPdf = document.getElementById('btn-export-pdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      const data = getFilteredData();
      if (data.length === 0) {
        showToast('Tidak ada data dalam rentang tanggal tersebut.', 'error');
        return;
      }

      const { jsPDF } = window.jspdf;
      const docPdf = new jsPDF();
      
      // Header
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(18);
      docPdf.setTextColor(15, 23, 42); // slate 900
      docPdf.text("LAPORAN KAS JALSAH & NASYID", 14, 20);
      
      docPdf.setFontSize(10);
      docPdf.setFont('helvetica', 'normal');
      docPdf.setTextColor(100, 116, 139); // slate 500
      const startStr = startField.value;
      const endStr = endField.value;
      docPdf.text(`Periode: ${startStr} s.d. ${endStr}`, 14, 26);
      docPdf.text(`Diunduh pada: ${new Date().toLocaleString('id-ID')}`, 14, 32);

      // Calculations
      let masuk = 0;
      let keluar = 0;
      const tableRows = data.map((t, idx) => {
        const isMasuk = t.type === 'pemasukan';
        const amt = parseFloat(t.amount) || 0;
        if (isMasuk) masuk += amt;
        else keluar += amt;

        return [
          idx + 1,
          t.date,
          t.description,
          t.category,
          isMasuk ? 'Masuk' : 'Keluar',
          formatRupiah(amt)
        ];
      });

      docPdf.autoTable({
        startY: 38,
        head: [['No', 'Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Jumlah']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] }, // green 600
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          5: { halign: 'right' }
        }
      });

      const finalY = docPdf.lastAutoTable.finalY + 10;
      docPdf.setFont('helvetica', 'bold');
      docPdf.text(`Total Pemasukan: ${formatRupiah(masuk)}`, 14, finalY);
      docPdf.text(`Total Pengeluaran: ${formatRupiah(keluar)}`, 14, finalY + 6);
      docPdf.text(`Saldo Akhir: ${formatRupiah(masuk - keluar)}`, 14, finalY + 12);

      docPdf.save(`Laporan_Kas_${startStr}_sd_${endStr}.pdf`);
      showToast('PDF berhasil diunduh!');
    });
  }

  // Excel Export
  const btnExcel = document.getElementById('btn-export-excel');
  if (btnExcel) {
    btnExcel.addEventListener('click', () => {
      const data = getFilteredData();
      if (data.length === 0) {
        showToast('Tidak ada data dalam rentang tanggal tersebut.', 'error');
        return;
      }

      const rows = data.map((t, idx) => ({
        "No": idx + 1,
        "Tanggal": t.date,
        "Deskripsi": t.description,
        "Kategori": t.category,
        "Tipe": t.type === 'pemasukan' ? 'Masuk' : 'Keluar',
        "Jumlah (Rp)": parseFloat(t.amount) || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kas");
      
      const startStr = startField.value;
      const endStr = endField.value;
      XLSX.writeFile(workbook, `Laporan_Kas_${startStr}_sd_${endStr}.xlsx`);
      showToast('Excel berhasil diunduh!');
    });
  }
}

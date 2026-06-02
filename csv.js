function csvEscape(value) {
  if (value === null || value === undefined) return "";
  let escaped = String(value)
    .replace(/"/g, '""')
    .replace(/\r?\n/g, ' ');
  
  // Formula injection protection: prepend single quote if starts with =, +, @, -
  if (/^[=+@-]/.test(escaped)) {
    escaped = "'" + escaped;
  }
  
  return escaped;
}

function makeCsvRow(cells) {
  return cells.map(csvEscape).map(value => `"${value}"`).join(",");
}

function makeCsv(headers, rows) {
  const headerRow = makeCsvRow(headers);
  const bodyRows = rows.map(makeCsvRow);
  return [headerRow, ...bodyRows].join("\n");
}

function download(filename, text, mime = "application/vnd.ms-excel") {
  const BOM = "\uFEFF";
  const content = mime === "application/json" ? text : BOM + text;
  const blob = new Blob([content], { type: mime + ";charset=utf-8;" });
  const file = new File([blob], filename, { type: mime });
  const url = URL.createObjectURL(blob);

  const isMobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent);

  // Try Share API first (Android + modern browsers)
  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: filename })
        .catch(err => {
          if (err && err.name !== 'AbortError') {
            downloadDirect();
          }
        });
      return;
    }
  } catch (e) {
    // ignore and fallback
  }

  downloadDirect();

  function downloadDirect() {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // For mobile, also try location.href as fallback
    if (isMobile) {
      setTimeout(() => {
        location.href = url;
      }, 100);
    }

    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch (e) {}
      URL.revokeObjectURL(url);
    }, 3000);
  }
}

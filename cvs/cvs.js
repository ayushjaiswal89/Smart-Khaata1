function csvEscape(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/"/g, '""')
    .replace(/\r?\n/g, ' ');
}

function makeCsvRow(cells) {
  return cells.map(csvEscape).map(value => `"${value}"`).join(",");
}

function makeCsv(headers, rows) {
  const headerRow = makeCsvRow(headers);
  const bodyRows = rows.map(makeCsvRow);
  return [headerRow, ...bodyRows].join("\n");
}

function download(filename, text, mime = "text/csv") {
  const BOM = "\uFEFF";
  const content = mime === "application/json" ? text : BOM + text;
  const blob = new Blob([content], { type: mime + ";charset=utf-8;" });
  const file = new File([blob], filename, { type: mime });
  const url = URL.createObjectURL(blob);

  const fallbackDownload = () => {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    try {
      const isMobile = /iPad|iPhone|iPod|Android/.test(navigator.userAgent);
      if (isMobile) {
        const preview = window.open('', '_blank');
        if (preview) {
          const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const html = `<!doctype html><html><head><meta charset="utf-8"><title>${filename}</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui,Arial;margin:12px">` +
            `<h3>${filename}</h3>` +
            `<p>If the file didn't download automatically, long-press the link below to save or open it.</p>` +
            `<a href="${url}" download="${filename}" style="display:inline-block;padding:8px 12px;background:#007bff;color:#fff;border-radius:6px;text-decoration:none">Download ${filename}</a>` +
            `<div style="margin-top:12px"><textarea style="width:100%;height:60vh;">${escaped}</textarea></div>` +
            `</body></html>`;
          preview.document.open();
          preview.document.write(html);
          preview.document.close();
        }
      }
    } catch (e) {
      // ignore preview failures
    }

    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      location.href = url;
    }

    setTimeout(() => { URL.revokeObjectURL(url); try { document.body.removeChild(a); } catch (e) {} }, 10000);
  };

  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: filename })
        .catch(err => {
          if (err && err.name === 'AbortError') return;
          fallbackDownload();
        });
      return;
    }
  } catch (e) {
    // ignore and fallback
  }

  fallbackDownload();
}

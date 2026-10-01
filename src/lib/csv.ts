function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCSV(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  return [cols.map(cell).join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob(["\ufeff" + toCSV(rows)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

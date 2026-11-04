type Cell = string | number | null;

/**
 * Una celda de texto que empiece con = + - @ se interpretaría como fórmula al abrir el CSV
 * en Excel; se antepone un apóstrofo para que se lea como texto.
 */
function escapeCell(cell: Cell): string {
  if (cell === null) return "";
  let text = String(cell);
  if (typeof cell === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Separador `;`: es el que Excel en español espera por defecto. */
export function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(escapeCell).join(";")).join("\r\n");
}

/** Descarga el CSV con UTF-8 y BOM, para que Excel muestre bien las tildes. */
export function downloadCsv(filename: string, rows: Cell[][]) {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

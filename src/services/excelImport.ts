import type { Tenant } from "../types/tenant";

export const coreFields = [
  { key: "unit", label: "No. Unit" },
  { key: "name", label: "Nama" },
  { key: "area", label: "Luas" },
  { key: "power", label: "Daya" },
  { key: "phone", label: "No. tlp" },
  { key: "email", label: "Email" },
  { key: "emergency", label: "No. tlp keadaan darurat" },
  { key: "parking", label: "No Parkir" },
] as const;

export type ImportPreview = {
  fileName: string;
  rows: Tenant[];
  totalCells: number;
  completeCells: number;
  missingByField: Record<string, number>;
};

const clean = (value: string | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
const find = (row: Record<string, string>, names: string[]) => {
  const entry = Object.entries(row).find(([key]) => names.includes(key.toLowerCase().replace(/[^a-z0-9]/g, "")));
  return clean(entry?.[1]);
};

function parseArea(value: string) { const number = Number.parseFloat(value.replace(",", ".").replace(/[^0-9.]/g, "")); return Number.isFinite(number) ? number : 0; }

export async function parseExcelFile(file: File): Promise<ImportPreview> {
  const text = await file.text();
  const document = new DOMParser().parseFromString(text, "text/html");
  const table = document.querySelector("table");
  if (!table) throw new Error("Tabel tidak ditemukan. Pilih file Excel penyewa yang telah diekspor.");
  const headers = [...table.querySelectorAll("tr:first-child th, tr:first-child td")].map((cell) => clean(cell.textContent));
  const rawRows = [...table.querySelectorAll("tr")].slice(1).map((tr) => [...tr.querySelectorAll("td")].map((cell) => clean(cell.textContent))).filter((row) => row.some(Boolean));
  if (!headers.length || !rawRows.length) throw new Error("File yang dipilih tidak berisi baris data penyewa.");
  const rows = rawRows.map((values, index): Tenant => {
    const raw = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    const unit = find(raw, ["unitproperti", "nounit", "unit"]);
    const name = find(raw, ["customer", "nama", "tenant"]);
    const areaText = find(raw, ["luas", "area"]);
    return { unit, name, area: parseArea(areaText), power: 0, phone: "", email: "", emergency: "", parking: "", code: find(raw, ["kodetenant", "code"]) || `IMPORTED-${index + 1}`, tower: find(raw, ["lokasi", "tower", "location"]), occupancyPeriod: find(raw, ["periodehuni", "period"]), status: "Review", archived: false };
  });
  const missingByField = Object.fromEntries(coreFields.map(({ key }) => [key, rows.filter((row) => !String(row[key]).trim() || (key === "area" && row.area <= 0) || (key === "power" && row.power <= 0)).length]));
  const totalCells = rows.length * coreFields.length;
  const completeCells = totalCells - Object.values(missingByField).reduce((sum, count) => sum + count, 0);
  return { fileName: file.name, rows, totalCells, completeCells, missingByField };
}

import type { Tenant } from "../types/tenant";
import { normalizeTenant } from "./tenantValidation";

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

const importFields = [
  { key: "code", label: "Kode Tenant" },
  { key: "unit", label: "No. Unit" },
  { key: "name", label: "Nama" },
  { key: "area", label: "Luas" },
  { key: "power", label: "Daya" },
  { key: "phone", label: "No. tlp" },
  { key: "email", label: "Email" },
  { key: "emergency", label: "Kontak darurat" },
  { key: "parking", label: "No Parkir" },
  { key: "tower", label: "Lokasi / Tower" },
  { key: "occupancyPeriod", label: "Periode Huni" },
] as const;

export type ImportPreview = {
  fileName: string;
  rows: Tenant[];
  totalCells: number;
  completeCells: number;
  missingByField: Record<string, number>;
};

export type ImportMode = "merge" | "add" | "replace";
export type ImportMatchKind = "new" | "update" | "unchanged" | "duplicate" | "conflict";

export type ImportClassification = {
  row: Tenant;
  kind: ImportMatchKind;
  existing?: Tenant;
  matchReason?: string;
  replacedFields: string[];
};

export type ImportPlan = {
  classifications: ImportClassification[];
  counts: Record<ImportMatchKind, number>;
  rowsToProcess: number;
  totalReplacedFields: number;
};

const clean = (value: string | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const hasValue = (key: (typeof importFields)[number]["key"], tenant: Tenant) => {
  if (key === "area" || key === "power") return tenant[key] > 0;
  if (key === "code") return Boolean(tenant.code.trim()) && !tenant.code.startsWith("IMPORTED-");
  return Boolean(String(tenant[key]).trim());
};
const find = (row: Record<string, string>, names: string[]) => {
  const entry = Object.entries(row).find(([key]) =>
    names.includes(key.toLowerCase().replace(/[^a-z0-9]/g, "")),
  );
  return clean(entry?.[1]);
};

function parseArea(value: string) {
  const number = Number.parseFloat(value.replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function sameField(key: (typeof importFields)[number]["key"], left: Tenant, right: Tenant) {
  if (key === "area" || key === "power") return left[key] === right[key];
  return normalize(String(left[key])) === normalize(String(right[key]));
}

function mergeTenant(existing: Tenant, incoming: Tenant): Tenant {
  const merged = { ...existing };
  for (const { key } of importFields) {
    if (hasValue(key, incoming)) merged[key] = incoming[key] as never;
  }
  return merged;
}

function matchExisting(row: Tenant, existing: Tenant[]) {
  const code = normalize(row.code);
  if (code && !code.startsWith("imported")) {
    const matches = existing.filter((item) => normalize(item.code) === code);
    if (matches.length === 1) return { tenant: matches[0], reason: "Kode tenant" };
    if (matches.length > 1) return { conflict: true };
  }

  const unit = normalize(row.unit);
  const name = normalize(row.name);
  if (!unit) return {};
  const unitMatches = existing.filter((item) => normalize(item.unit) === unit);
  const exactMatch = unitMatches.filter((item) => !name || normalize(item.name) === name);
  if (exactMatch.length === 1) return { tenant: exactMatch[0], reason: "No. unit dan nama" };
  if (unitMatches.length === 1 && exactMatch.length === 0) return { conflict: true };
  if (unitMatches.length > 1) return { conflict: true };
  return {};
}

export function buildImportPlan(rows: Tenant[], existing: Tenant[]): ImportPlan {
  const seen = new Set<string>();
  const seenCodes = new Set<string>();
  const classifications = rows.map((row) => {
    const sourceCode = row.code.startsWith("IMPORTED-") ? "" : row.code;
    const signature = [sourceCode, row.unit, row.name, row.area, row.tower, row.occupancyPeriod]
      .map((value) => normalize(String(value)))
      .join("|");
    if (seen.has(signature)) {
      return { row, kind: "duplicate" as const, replacedFields: [] };
    }
    seen.add(signature);
    if (sourceCode && seenCodes.has(normalize(sourceCode))) {
      return { row, kind: "conflict" as const, replacedFields: [] };
    }
    if (sourceCode) seenCodes.add(normalize(sourceCode));

    const match = matchExisting(row, existing);
    if (match.conflict) return { row, kind: "conflict" as const, replacedFields: [] };
    if (!match.tenant) return { row, kind: "new" as const, replacedFields: [] };

    const merged = mergeTenant(match.tenant, row);
    const replacedFields = importFields
      .filter(({ key }) => hasValue(key, row) && !sameField(key, match.tenant!, merged))
      .map(({ label }) => label);
    return {
      row,
      existing: match.tenant,
      kind: replacedFields.length ? ("update" as const) : ("unchanged" as const),
      matchReason: match.reason,
      replacedFields,
    };
  });

  const counts = classifications.reduce<Record<ImportMatchKind, number>>(
    (result, item) => {
      result[item.kind] += 1;
      return result;
    },
    { new: 0, update: 0, unchanged: 0, duplicate: 0, conflict: 0 },
  );
  return {
    classifications,
    counts,
    rowsToProcess: rows.length - counts.duplicate,
    totalReplacedFields: classifications.reduce((sum, item) => sum + item.replacedFields.length, 0),
  };
}

function mergeMatchedTenant(existing: Tenant, incoming: Tenant): Tenant {
  const merged = { ...existing };
  for (const { key } of importFields) {
    if (hasValue(key, incoming)) merged[key] = incoming[key] as never;
  }
  return merged;
}

export function applyImportPlan(plan: ImportPlan, existing: Tenant[], mode: ImportMode) {
  if (mode === "replace") {
    return plan.classifications
      .filter((item) => item.kind !== "duplicate" && item.kind !== "conflict")
      .map((item) => item.row);
  }

  const result = existing.map((tenant) => ({ ...tenant }));
  for (const item of plan.classifications) {
    if (item.kind === "duplicate" || item.kind === "conflict") continue;
    if (mode === "add" && item.kind !== "new") continue;
    if (item.existing) {
      const index = result.findIndex((tenant) => tenant.code === item.existing?.code);
      if (index >= 0) result[index] = mergeMatchedTenant(result[index], item.row);
    } else if (item.kind === "new") {
      result.push(item.row);
    }
  }
  return result;
}

export async function parseExcelFile(file: File): Promise<ImportPreview> {
  const text = await file.text();
  const document = new DOMParser().parseFromString(text, "text/html");
  const table = document.querySelector("table");
  if (!table) throw new Error("Tabel tidak ditemukan. Pilih file Excel penyewa yang telah diekspor.");
  const headers = [...table.querySelectorAll("tr:first-child th, tr:first-child td")].map((cell) => clean(cell.textContent ?? ""));
  const rawRows = [...table.querySelectorAll("tr")]
    .slice(1)
    .map((tr) => [...tr.querySelectorAll("td")].map((cell) => clean(cell.textContent ?? "")))
    .filter((row) => row.some(Boolean));
  if (!headers.length || !rawRows.length) throw new Error("File yang dipilih tidak berisi baris data penyewa.");
  const rows = rawRows.map((values, index): Tenant => {
    const raw = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
    return normalizeTenant({
      unit: find(raw, ["unitproperti", "nounit", "unit"]),
      name: find(raw, ["customer", "nama", "tenant"]),
      area: parseArea(find(raw, ["luas", "area"])),
      power: 0,
      phone: "",
      email: "",
      emergency: "",
      parking: "",
      code: find(raw, ["kodetenant", "code"]) || `IMPORTED-${index + 1}`,
      tower: find(raw, ["lokasi", "tower", "location"]),
      occupancyPeriod: find(raw, ["periodehuni", "period"]),
      recordType: "Tenant",
      status: "Review",
      archived: false,
    });
  });
  const missingByField = Object.fromEntries(
    coreFields.map(({ key }) => [
      key,
      rows.filter((row) => !String(row[key]).trim() || (key === "area" && row.area <= 0) || (key === "power" && row.power <= 0)).length,
    ]),
  );
  const totalCells = rows.length * coreFields.length;
  const completeCells = totalCells - Object.values(missingByField).reduce((sum, count) => sum + count, 0);
  return { fileName: file.name, rows, totalCells, completeCells, missingByField };
}

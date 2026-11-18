import type { Tenant } from "../types/tenant";

export type TenantValidationKey =
  | "unit"
  | "name"
  | "area"
  | "power"
  | "phone"
  | "email"
  | "emergency"
  | "occupancyPeriod";

export type TenantValidationErrors = Partial<Record<TenantValidationKey, string>>;

const unitPattern = /^[A-Z0-9]+\/[A-Z0-9]+\/[A-Z0-9][A-Z0-9 ._-]*$/;
const phonePattern = /^[0-9+() .-]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const occupancyPattern = /^\d{2}-\d{2}-\d{4}\s+s\/d\s+\d{2}-\d{2}-\d{4}$/i;

export function normalizeUnit(value: string) {
  return value
    .trim()
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();

export function normalizeTenant(tenant: Tenant): Tenant {
  return {
    ...tenant,
    unit: normalizeUnit(tenant.unit),
    name: cleanText(tenant.name),
    phone: cleanText(tenant.phone),
    email: tenant.email.trim().toLowerCase(),
    emergency: cleanText(tenant.emergency),
    parking: cleanText(tenant.parking).toUpperCase(),
    code: cleanText(tenant.code),
    tower: cleanText(tenant.tower).toUpperCase(),
    occupancyPeriod: cleanText(tenant.occupancyPeriod),
  };
}

export function validateTenant(tenant: Tenant): TenantValidationErrors {
  const errors: TenantValidationErrors = {};
  const unit = normalizeUnit(tenant.unit);
  if (!unit) {
    errors.unit = "No. unit wajib diisi.";
  } else if (!unitPattern.test(unit)) {
    errors.unit = "Gunakan format tower/lantai/unit atau ruangan, contoh A/02/01 atau A/02/MEETING ROOM.";
  }
  if (!tenant.name.trim()) errors.name = "Nama penyewa wajib diisi.";
  if (!Number.isFinite(tenant.area) || tenant.area <= 0) {
    errors.area = "Luas harus lebih besar dari 0 m².";
  }
  if (!Number.isFinite(tenant.power) || tenant.power < 0) {
    errors.power = "Daya tidak boleh bernilai negatif.";
  }
  for (const key of ["phone", "emergency"] as const) {
    const value = tenant[key].trim();
    if (value && (!phonePattern.test(value) || value.replace(/\D/g, "").length < 8)) {
      errors[key] = "Masukkan nomor telepon yang valid, contoh 0812-3456-7890.";
    }
  }
  if (tenant.email.trim() && !emailPattern.test(tenant.email.trim())) {
    errors.email = "Masukkan alamat email yang valid.";
  }
  if (tenant.occupancyPeriod.trim() && !occupancyPattern.test(tenant.occupancyPeriod.trim())) {
    errors.occupancyPeriod = "Gunakan format DD-MM-YYYY s/d DD-MM-YYYY.";
  }
  return errors;
}

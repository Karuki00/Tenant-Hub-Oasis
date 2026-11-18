import { useState } from "react";
import type { FormEvent } from "react";
import type { Tenant } from "../types/tenant";
import {
  normalizeTenant,
  validateTenant,
  type TenantValidationErrors,
  type TenantValidationKey,
} from "../services/tenantValidation";

const emptyTenant: Tenant = {
  unit: "",
  name: "",
  area: 0,
  power: 0,
  phone: "",
  email: "",
  emergency: "",
  parking: "",
  code: "",
  tower: "",
  occupancyPeriod: "",
  recordType: "Tenant",
  status: "Review",
  archived: false,
};

export function TenantFormModal({
  tenant,
  existingTenants = [],
  onClose,
  onSave,
}: {
  tenant?: Tenant | null;
  existingTenants?: Tenant[];
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
}) {
  const [form, setForm] = useState<Tenant>(tenant ?? emptyTenant);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<TenantValidationErrors>({});
  const update = (key: keyof Tenant, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: key === "area" || key === "power" ? Number(value) : value,
    }));
    if (key in fieldErrors) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[key as TenantValidationKey];
        return next;
      });
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeTenant({
      ...form,
      code: form.code || `TN/LOCAL/${Date.now()}`,
      status: form.status || "Review",
    });
    const validationErrors = validateTenant(normalized);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setError("Periksa kembali kolom yang ditandai sebelum menyimpan.");
      return;
    }
    const duplicate = existingTenants.some(
      (item) =>
        normalizeTenant(item).unit === normalized.unit &&
        item.code !== tenant?.code,
    );
    if (duplicate) {
      setError(`Unit ${normalized.unit} sudah ada. Pilih unit yang berbeda.`);
      return;
    }
    setError("");
    onSave(normalized);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="detail-modal tenant-form"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <button type="button" className="close-button" onClick={onClose}>
          X
        </button>
        <p className="eyebrow">Direktori relasi</p>
        <h2>{tenant ? "Edit data" : "Tambah data"}</h2>
        <p className="muted">
          Gunakan contoh format pada kolom di bawah. File Excel hanya berisi data
          ringkasan, jadi detail kontak, daya, darurat, dan parkir perlu diisi
          manual jika tersedia.
        </p>
        {error && <p className="form-error">{error}</p>}
        <div className="form-grid">
          <Field
            label="No. Unit"
            value={form.unit}
            onChange={(value) => update("unit", value)}
            placeholder="Contoh: A/02/01"
            error={fieldErrors.unit}
            required
          />
          <Field
            label="Nama"
            value={form.name}
            onChange={(value) => update("name", value)}
            placeholder="Nama Penyewa"
            error={fieldErrors.name}
            required
          />
          <Field
            label="Luas"
            type="number"
            value={String(form.area || "")}
            onChange={(value) => update("area", value)}
            placeholder="Contoh: 62.40"
            error={fieldErrors.area}
            required
          />
          <Field
            label="Daya (watt)"
            type="number"
            value={String(form.power || "")}
            onChange={(value) => update("power", value)}
            placeholder="Contoh: 2200"
            error={fieldErrors.power}
          />
          <Field
            label="No. tlp"
            value={form.phone}
            onChange={(value) => update("phone", value)}
            placeholder="Contoh: 0812-3456-7890"
            error={fieldErrors.phone}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => update("email", value)}
            placeholder="Contoh: nama@contoh.com"
            error={fieldErrors.email}
          />
          <Field
            label="No. tlp keadaan darurat"
            value={form.emergency}
            onChange={(value) => update("emergency", value)}
            placeholder="Contoh: 0813-9876-5432"
            error={fieldErrors.emergency}
          />
          <Field
            label="No Parkir"
            value={form.parking}
            onChange={(value) => update("parking", value)}
            placeholder="Contoh: A-001"
          />
          <Field
            label="Kode / ID"
            value={form.code}
            onChange={(value) => update("code", value)}
            placeholder="Contoh: TN/APRT/00001"
          />
          <Field
            label="Lokasi / Tower"
            value={form.tower}
            onChange={(value) => update("tower", value)}
            placeholder="Contoh: TOWER A"
          />
          <Field
            label="Periode Huni"
            value={form.occupancyPeriod}
            onChange={(value) => update("occupancyPeriod", value)}
            placeholder="Contoh: 01-04-2018 s/d 31-03-2037"
            error={fieldErrors.occupancyPeriod}
          />
          <label className="form-field">
            Jenis relasi / data
            <select
              value={form.recordType}
              onChange={(event) => update("recordType", event.target.value)}
            >
              <option value="Tenant">Penyewa</option>
              <option value="Vendor">Vendor / Provider</option>
              <option value="Contractor">Kontraktor</option>
              <option value="Operations">Kantor operasional</option>
              <option value="Facility">Fasilitas / perangkat</option>
              <option value="Management">Pengelola</option>
              <option value="Other">Lainnya</option>
            </select>
          </label>
          <label className="form-field">
            Status
            <select
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option value="Active">Aktif</option>
              <option value="Review">Perlu ditinjau</option>
              <option value="Pending">Menunggu</option>
              <option value="Vacant">Kosong</option>
              <option value="Expired">Kedaluwarsa</option>
              <option value="Suspended">Ditangguhkan</option>
            </select>
          </label>
        </div>
        <div className="import-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="primary-button">
            Simpan data
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className={`form-field ${error ? "has-error" : ""}`}>
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

import { useState } from "react";
import type { FormEvent } from "react";
import type { Tenant } from "../types/tenant";

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
  const update = (key: keyof Tenant, value: string) =>
    setForm((current) => ({
      ...current,
      [key]: key === "area" || key === "power" ? Number(value) : value,
    }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const duplicate = existingTenants.some((item) => item.unit.trim().toLowerCase() === form.unit.trim().toLowerCase() && item.code !== tenant?.code);
    if (duplicate) { setError(`Unit ${form.unit} already exists. Choose a different unit.`); return; }
    setError("");
    onSave({
      ...form,
      code: form.code || `TN/LOCAL/${Date.now()}`,
      status: form.status || "Review",
    });
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
        <p className="eyebrow">Tenant directory</p>
        <h2>{tenant ? "Edit tenant" : "Add tenant"}</h2>
        <p className="muted">
          The eight fields below are the required tenant detail columns.
        </p>
        {error && <p className="form-error">{error}</p>}
        <div className="form-grid">
          <Field
            label="No. Unit"
            value={form.unit}
            onChange={(value) => update("unit", value)}
            required
          />
          <Field
            label="Nama"
            value={form.name}
            onChange={(value) => update("name", value)}
            required
          />
          <Field
            label="Luas"
            type="number"
            value={String(form.area || "")}
            onChange={(value) => update("area", value)}
            required
          />
          <Field
            label="Daya (watt)"
            type="number"
            value={String(form.power || "")}
            onChange={(value) => update("power", value)}
          />
          <Field
            label="No. tlp"
            value={form.phone}
            onChange={(value) => update("phone", value)}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => update("email", value)}
          />
          <Field
            label="No. tlp keadaan darurat"
            value={form.emergency}
            onChange={(value) => update("emergency", value)}
          />
          <Field
            label="No Parkir"
            value={form.parking}
            onChange={(value) => update("parking", value)}
          />
          <Field
            label="Kode Tenant (Excel)"
            value={form.code}
            onChange={(value) => update("code", value)}
          />
          <Field
            label="Lokasi / Tower"
            value={form.tower}
            onChange={(value) => update("tower", value)}
          />
          <Field
            label="Periode Huni"
            value={form.occupancyPeriod}
            onChange={(value) => update("occupancyPeriod", value)}
          />
          <label className="form-field">
            Status
            <select
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option>Active</option>
              <option>Review</option>
            </select>
          </label>
        </div>
        <div className="import-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button">
            Save tenant
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
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="form-field">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

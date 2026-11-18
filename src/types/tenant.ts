export type TenantStatus =
  | "Active"
  | "Review"
  | "Pending"
  | "Vacant"
  | "Expired"
  | "Suspended";

export type TenantRecordType =
  | "Tenant"
  | "Vendor"
  | "Contractor"
  | "Operations"
  | "Facility"
  | "Management"
  | "Other";

export type Tenant = {
  // Core Tenant Relation detail columns.
  unit: string; // No. Unit
  name: string; // Nama
  area: number; // Luas
  power: number; // Daya (electric watt)
  phone: string; // No. tlp
  email: string; // email
  emergency: string; // No. tlp keadaan darurat
  parking: string; // No Parkir

  // Additional summary/context columns from the Excel export.
  code: string; // Kode Tenant
  tower: string; // Lokasi
  occupancyPeriod: string; // Periode Huni
  recordType: TenantRecordType; // Jenis relasi/data
  status: TenantStatus;
  archived: boolean;
};

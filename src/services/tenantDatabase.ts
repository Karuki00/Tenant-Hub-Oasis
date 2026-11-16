import Database from "@tauri-apps/plugin-sql";
import type { Tenant } from "../types/tenant";

type TenantRow = Omit<Tenant, "occupancyPeriod" | "archived"> & { occupancy_period: string; archived: number };
let databasePromise: Promise<Database> | undefined;

function database() {
  databasePromise ??= Database.load("sqlite:tenant_hub.db");
  return databasePromise;
}

function fromRow(row: TenantRow): Tenant {
  return { ...row, occupancyPeriod: row.occupancy_period, archived: Boolean(row.archived) };
}

const values = (tenant: Tenant) => [tenant.code, tenant.unit, tenant.name, tenant.area, tenant.power, tenant.phone, tenant.email, tenant.emergency, tenant.parking, tenant.tower, tenant.occupancyPeriod, tenant.status, tenant.archived ? 1 : 0];

export async function loadTenants() {
  const db = await database();
  const rows = await db.select<TenantRow[]>("SELECT code, unit, name, area, power, phone, email, emergency, parking, tower, occupancy_period, status, archived FROM tenants ORDER BY tower, unit");
  return rows.map(fromRow);
}

export async function replaceTenants(tenants: Tenant[]) {
  const db = await database();
  await db.execute("BEGIN TRANSACTION");
  try {
    await db.execute("DELETE FROM tenants");
    for (const tenant of tenants) await db.execute("INSERT INTO tenants (code, unit, name, area, power, phone, email, emergency, parking, tower, occupancy_period, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", values(tenant));
    await db.execute("COMMIT");
  } catch (error) { await db.execute("ROLLBACK"); throw error; }
}

export async function createTenant(tenant: Tenant) {
  const db = await database();
  await db.execute("INSERT INTO tenants (code, unit, name, area, power, phone, email, emergency, parking, tower, occupancy_period, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", values(tenant));
}

export async function updateTenant(tenant: Tenant) {
  const db = await database();
  await db.execute("UPDATE tenants SET unit=?, name=?, area=?, power=?, phone=?, email=?, emergency=?, parking=?, tower=?, occupancy_period=?, status=?, archived=?, updated_at=CURRENT_TIMESTAMP WHERE code=?", [...values(tenant).slice(1), tenant.code]);
}

export async function deleteTenant(code: string) {
  const db = await database();
  await db.execute("DELETE FROM tenants WHERE code=?", [code]);
}

export async function setTenantArchived(code: string, archived: boolean) {
  const db = await database();
  await db.execute("UPDATE tenants SET archived=?, updated_at=CURRENT_TIMESTAMP WHERE code=?", [archived ? 1 : 0, code]);
}

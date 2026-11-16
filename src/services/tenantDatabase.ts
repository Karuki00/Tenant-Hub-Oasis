import { invoke } from "@tauri-apps/api/core";
import type { Tenant } from "../types/tenant";

export const loadTenants = () => invoke<Tenant[]>("load_tenants");
export const replaceTenants = (tenants: Tenant[]) => invoke<void>("replace_tenants", { tenants });
export const createTenant = (tenant: Tenant) => invoke<void>("create_tenant", { tenant });
export const updateTenant = (tenant: Tenant) => invoke<void>("update_tenant", { tenant });
export const deleteTenant = (code: string) => invoke<void>("delete_tenant", { code });
export const setTenantArchived = (code: string, archived: boolean) => invoke<void>("set_tenant_archived", { code, archived });
export const saveExportFile = (filename: string, contents: string) => invoke<string>("save_export_file", { filename, contents });
export const exportTenantsXlsx = () => invoke<string>("export_tenants_xlsx");

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const MIGRATION_1: &str = r#"
CREATE TABLE IF NOT EXISTS tenants (
  code TEXT PRIMARY KEY NOT NULL,
  unit TEXT NOT NULL,
  name TEXT NOT NULL,
  area REAL NOT NULL DEFAULT 0,
  power INTEGER NOT NULL DEFAULT 0,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  emergency TEXT NOT NULL DEFAULT '',
  parking TEXT NOT NULL DEFAULT '',
  tower TEXT NOT NULL DEFAULT '',
  occupancy_period TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Review' CHECK (status IN ('Active', 'Review')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tenants_unit ON tenants(unit);
CREATE INDEX IF NOT EXISTS idx_tenants_tower ON tenants(tower);
CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);
"#;
const MIGRATION_3: &str = r#"
CREATE TABLE tenants_new (
  code TEXT PRIMARY KEY NOT NULL, unit TEXT NOT NULL, name TEXT NOT NULL,
  area REAL NOT NULL DEFAULT 0, power INTEGER NOT NULL DEFAULT 0,
  phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', emergency TEXT NOT NULL DEFAULT '', parking TEXT NOT NULL DEFAULT '',
  tower TEXT NOT NULL DEFAULT '', occupancy_period TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Review',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived INTEGER NOT NULL DEFAULT 0
);
INSERT INTO tenants_new SELECT code, unit, name, area, power, phone, email, emergency, parking, tower, occupancy_period, status, created_at, updated_at, archived FROM tenants;
DROP TABLE tenants;
ALTER TABLE tenants_new RENAME TO tenants;
CREATE INDEX IF NOT EXISTS idx_tenants_unit ON tenants(unit);
CREATE INDEX IF NOT EXISTS idx_tenants_tower ON tenants(tower);
CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);
CREATE INDEX IF NOT EXISTS idx_tenants_archived ON tenants(archived);
"#;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Tenant {
    code: String,
    unit: String,
    name: String,
    area: f64,
    power: i64,
    phone: String,
    email: String,
    emergency: String,
    parking: String,
    tower: String,
    occupancy_period: String,
    status: String,
    archived: bool,
}

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join("tenant_hub.db"))
}

fn has_column(connection: &Connection, table: &str, column: &str) -> Result<bool, String> {
    let mut statement = connection
        .prepare(&format!("PRAGMA table_info({table})"))
        .map_err(|error| error.to_string())?;
    let columns = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|error| error.to_string())?;
    for name in columns {
        if name.map_err(|error| error.to_string())? == column {
            return Ok(true);
        }
    }
    Ok(false)
}

fn connection(app: &AppHandle) -> Result<Connection, String> {
    let connection = Connection::open(db_path(app)?).map_err(|error| error.to_string())?;
    connection
        .execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY NOT NULL);",
        )
        .map_err(|error| error.to_string())?;
    let migrations = [(1, MIGRATION_1), (2, ""), (3, MIGRATION_3)];
    for (version, sql) in migrations {
        let applied: Option<i64> = connection
            .query_row(
                "SELECT version FROM schema_migrations WHERE version=?",
                [version],
                |row| row.get(0),
            )
            .optional()
            .map_err(|error| error.to_string())?;
        if applied.is_none() {
            if version == 2 {
                // Older development databases may already contain this column
                // even though schema_migrations was not updated successfully.
                if !has_column(&connection, "tenants", "archived")? {
                    connection
                        .execute_batch("ALTER TABLE tenants ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;")
                        .map_err(|error| format!("Migration {version} failed: {error}"))?;
                }
                connection
                    .execute_batch("CREATE INDEX IF NOT EXISTS idx_tenants_archived ON tenants(archived);")
                    .map_err(|error| format!("Migration {version} failed: {error}"))?;
            } else {
                connection
                    .execute_batch(sql)
                    .map_err(|error| format!("Migration {version} failed: {error}"))?;
            }
            connection
                .execute(
                    "INSERT INTO schema_migrations (version) VALUES (?)",
                    [version],
                )
                .map_err(|error| error.to_string())?;
        }
    }
    Ok(connection)
}

fn row_to_tenant(row: &rusqlite::Row<'_>) -> rusqlite::Result<Tenant> {
    Ok(Tenant {
        code: row.get(0)?,
        unit: row.get(1)?,
        name: row.get(2)?,
        area: row.get(3)?,
        power: row.get(4)?,
        phone: row.get(5)?,
        email: row.get(6)?,
        emergency: row.get(7)?,
        parking: row.get(8)?,
        tower: row.get(9)?,
        occupancy_period: row.get(10)?,
        status: row.get(11)?,
        archived: row.get::<_, i64>(12)? != 0,
    })
}

#[tauri::command]
fn load_tenants(app: AppHandle) -> Result<Vec<Tenant>, String> {
    let connection = connection(&app)?;
    let mut statement = connection.prepare("SELECT code, unit, name, area, power, phone, email, emergency, parking, tower, occupancy_period, status, archived FROM tenants ORDER BY tower, unit").map_err(|error| error.to_string())?;
    statement
        .query_map([], row_to_tenant)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn replace_tenants(app: AppHandle, tenants: Vec<Tenant>) -> Result<(), String> {
    let mut connection = connection(&app)?;
    let transaction = connection
        .transaction()
        .map_err(|error| error.to_string())?;
    transaction
        .execute("DELETE FROM tenants", [])
        .map_err(|error| error.to_string())?;
    for tenant in &tenants {
        insert_tenant(&transaction, tenant)?;
    }
    transaction.commit().map_err(|error| error.to_string())
}

fn insert_tenant(connection: &Connection, tenant: &Tenant) -> Result<(), String> {
    connection.execute("INSERT INTO tenants (code, unit, name, area, power, phone, email, emergency, parking, tower, occupancy_period, status, archived) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", params![tenant.code, tenant.unit, tenant.name, tenant.area, tenant.power, tenant.phone, tenant.email, tenant.emergency, tenant.parking, tenant.tower, tenant.occupancy_period, tenant.status, tenant.archived as i64]).map_err(|error| error.to_string()).map(|_| ())
}

#[tauri::command]
fn create_tenant(app: AppHandle, tenant: Tenant) -> Result<(), String> {
    let connection = connection(&app)?;
    insert_tenant(&connection, &tenant)
}

#[tauri::command]
fn update_tenant(app: AppHandle, tenant: Tenant) -> Result<(), String> {
    let connection = connection(&app)?;
    connection.execute("UPDATE tenants SET unit=?, name=?, area=?, power=?, phone=?, email=?, emergency=?, parking=?, tower=?, occupancy_period=?, status=?, archived=?, updated_at=CURRENT_TIMESTAMP WHERE code=?", params![tenant.unit, tenant.name, tenant.area, tenant.power, tenant.phone, tenant.email, tenant.emergency, tenant.parking, tenant.tower, tenant.occupancy_period, tenant.status, tenant.archived as i64, tenant.code]).map_err(|error| error.to_string()).map(|_| ())
}

#[tauri::command]
fn delete_tenant(app: AppHandle, code: String) -> Result<(), String> {
    let connection = connection(&app)?;
    connection
        .execute("DELETE FROM tenants WHERE code=?", [code])
        .map_err(|error| error.to_string())
        .map(|_| ())
}

#[tauri::command]
fn set_tenant_archived(app: AppHandle, code: String, archived: bool) -> Result<(), String> {
    let connection = connection(&app)?;
    connection
        .execute(
            "UPDATE tenants SET archived=?, updated_at=CURRENT_TIMESTAMP WHERE code=?",
            params![archived as i64, code],
        )
        .map_err(|error| error.to_string())
        .map(|_| ())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            connection(&app.handle()).map_err(std::io::Error::other)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_tenants,
            replace_tenants,
            create_tenant,
            update_tenant,
            delete_tenant,
            set_tenant_archived
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

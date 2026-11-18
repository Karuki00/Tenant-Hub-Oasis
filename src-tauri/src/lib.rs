use rusqlite::{params, Connection, OptionalExtension};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use rand::{distr::{Alphanumeric, SampleString}, rng};
use rust_xlsxwriter::Workbook;
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
const MIGRATION_4: &str = r#"
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"#;
const MIGRATION_5: &str = r#"
ALTER TABLE tenants ADD COLUMN record_type TEXT NOT NULL DEFAULT 'Tenant';
CREATE INDEX IF NOT EXISTS idx_tenants_record_type ON tenants(record_type);
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
    record_type: String,
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
    let migrations = [(1, MIGRATION_1), (2, ""), (3, MIGRATION_3), (4, MIGRATION_4), (5, MIGRATION_5)];
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

fn backup_before_replace(app: &AppHandle) -> Result<(), String> {
    let database = db_path(app)?;
    if !database.exists() {
        return Ok(());
    }
    let backup = database.with_file_name("tenant_hub-before-import.db");
    fs::copy(database, backup).map_err(|error| error.to_string())?;
    Ok(())
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AuthStatus {
    setup_required: bool,
}

fn setting(connection: &Connection, key: &str) -> Result<Option<String>, String> {
    connection
        .query_row("SELECT value FROM app_settings WHERE key=?", [key], |row| row.get(0))
        .optional()
        .map_err(|error| error.to_string())
}

fn set_setting(connection: &Connection, key: &str, value: &str) -> Result<(), String> {
    connection
        .execute(
            "INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
            params![key, value],
        )
        .map_err(|error| error.to_string())
        .map(|_| ())
}

fn hash_secret(secret: &str) -> Result<String, String> {
    Argon2::default()
        .hash_password(secret.as_bytes())
        .map(|hash| hash.to_string())
        .map_err(|error| error.to_string())
}

fn verify_secret(secret: &str, encoded_hash: &str) -> bool {
    PasswordHash::new(encoded_hash)
        .map(|hash| Argon2::default().verify_password(secret.as_bytes(), &hash).is_ok())
        .unwrap_or(false)
}

fn new_master_code() -> String {
    let mut generator = rng();
    let raw = Alphanumeric.sample_string(&mut generator, 16).to_uppercase();
    format!("{}-{}-{}-{}", &raw[0..4], &raw[4..8], &raw[8..12], &raw[12..16])
}

#[tauri::command]
fn auth_status(app: AppHandle) -> Result<AuthStatus, String> {
    let connection = connection(&app)?;
    Ok(AuthStatus {
        setup_required: setting(&connection, "password_hash")?.is_none(),
    })
}

#[tauri::command]
fn setup_auth(app: AppHandle, username: String, password: String, confirmation: String) -> Result<String, String> {
    let username = username.trim();
    if username.len() < 3 {
        return Err("Nama pengguna minimal 3 karakter.".to_string());
    }
    if password.len() < 8 {
        return Err("Password minimal 8 karakter.".to_string());
    }
    if password != confirmation {
        return Err("Konfirmasi password tidak cocok.".to_string());
    }
    let connection = connection(&app)?;
    if setting(&connection, "password_hash")?.is_some() {
        return Err("Password aplikasi sudah dibuat.".to_string());
    }
    let master_code = new_master_code();
    set_setting(&connection, "username", username)?;
    set_setting(&connection, "password_hash", &hash_secret(&password)?)?;
    set_setting(&connection, "master_code_hash", &hash_secret(&master_code.replace('-', ""))?)?;
    Ok(master_code)
}

#[tauri::command]
fn login(app: AppHandle, username: String, password: String) -> Result<(), String> {
    let connection = connection(&app)?;
    let stored_username = setting(&connection, "username")?.ok_or_else(|| "Setup password belum dibuat.".to_string())?;
    let password_hash = setting(&connection, "password_hash")?.ok_or_else(|| "Setup password belum dibuat.".to_string())?;
    if username.trim() != stored_username || !verify_secret(&password, &password_hash) {
        return Err("Nama pengguna atau password salah.".to_string());
    }
    Ok(())
}

#[tauri::command]
fn change_password(app: AppHandle, current_password: String, password: String, confirmation: String) -> Result<(), String> {
    if password.len() < 8 {
        return Err("Password minimal 8 karakter.".to_string());
    }
    if password != confirmation {
        return Err("Konfirmasi password tidak cocok.".to_string());
    }
    let connection = connection(&app)?;
    let stored_hash = setting(&connection, "password_hash")?.ok_or_else(|| "Setup password belum dibuat.".to_string())?;
    if !verify_secret(&current_password, &stored_hash) {
        return Err("Password saat ini salah.".to_string());
    }
    set_setting(&connection, "password_hash", &hash_secret(&password)?)?;
    Ok(())
}

#[tauri::command]
fn reset_password(app: AppHandle, master_code: String, password: String, confirmation: String) -> Result<String, String> {
    if password.len() < 8 {
        return Err("Password minimal 8 karakter.".to_string());
    }
    if password != confirmation {
        return Err("Konfirmasi password tidak cocok.".to_string());
    }
    let connection = connection(&app)?;
    let master_hash = setting(&connection, "master_code_hash")?.ok_or_else(|| "Master code belum tersedia.".to_string())?;
    if !verify_secret(&master_code.replace('-', "").to_uppercase(), &master_hash) {
        return Err("Master code salah.".to_string());
    }
    let new_code = new_master_code();
    set_setting(&connection, "password_hash", &hash_secret(&password)?)?;
    set_setting(&connection, "master_code_hash", &hash_secret(&new_code.replace('-', ""))?)?;
    Ok(new_code)
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
        record_type: row.get(13)?,
    })
}

#[tauri::command]
fn load_tenants(app: AppHandle) -> Result<Vec<Tenant>, String> {
    let connection = connection(&app)?;
    let mut statement = connection.prepare("SELECT code, unit, name, area, power, phone, email, emergency, parking, tower, occupancy_period, status, archived, record_type FROM tenants ORDER BY tower, unit").map_err(|error| error.to_string())?;
    statement
        .query_map([], row_to_tenant)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn replace_tenants(app: AppHandle, tenants: Vec<Tenant>) -> Result<(), String> {
    backup_before_replace(&app)?;
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
    connection.execute("INSERT INTO tenants (code, unit, name, area, power, phone, email, emergency, parking, tower, occupancy_period, status, archived, record_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", params![tenant.code, tenant.unit, tenant.name, tenant.area, tenant.power, tenant.phone, tenant.email, tenant.emergency, tenant.parking, tenant.tower, tenant.occupancy_period, tenant.status, tenant.archived as i64, tenant.record_type]).map_err(|error| error.to_string()).map(|_| ())
}

#[tauri::command]
fn create_tenant(app: AppHandle, tenant: Tenant) -> Result<(), String> {
    let connection = connection(&app)?;
    insert_tenant(&connection, &tenant)
}

#[tauri::command]
fn update_tenant(app: AppHandle, tenant: Tenant) -> Result<(), String> {
    let connection = connection(&app)?;
    connection.execute("UPDATE tenants SET unit=?, name=?, area=?, power=?, phone=?, email=?, emergency=?, parking=?, tower=?, occupancy_period=?, status=?, archived=?, record_type=?, updated_at=CURRENT_TIMESTAMP WHERE code=?", params![tenant.unit, tenant.name, tenant.area, tenant.power, tenant.phone, tenant.email, tenant.emergency, tenant.parking, tenant.tower, tenant.occupancy_period, tenant.status, tenant.archived as i64, tenant.record_type, tenant.code]).map_err(|error| error.to_string()).map(|_| ())
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
fn export_tenants_xlsx(app: AppHandle) -> Result<String, String> {
    let tenants = load_tenants(app.clone())?;
    let path = rfd::FileDialog::new()
        .set_title("Simpan ekspor TenantHub")
        .set_file_name("tenant-hub-export.xlsx")
        .add_filter("Excel Workbook", &["xlsx"])
        .save_file()
        .ok_or_else(|| "Ekspor dibatalkan oleh pengguna.".to_string())?;
    let path = if path.extension().is_some() {
        path
    } else {
        path.with_extension("xlsx")
    };

    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();
    let headers = [
        "Kode Tenant", "No. Unit", "Nama", "Luas", "Daya", "No. tlp", "Email",
        "No. tlp keadaan darurat", "No Parkir", "Tower", "Periode Huni", "Jenis Relasi", "Status",
    ];
    for (column, header) in headers.iter().enumerate() {
        worksheet
            .write_string(0, column as u16, *header)
            .map_err(|error| error.to_string())?;
    }
    for (row, tenant) in tenants.iter().enumerate() {
        let row = (row + 1) as u32;
        worksheet.write_string(row, 0, &tenant.code).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 1, &tenant.unit).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 2, &tenant.name).map_err(|error| error.to_string())?;
        worksheet.write_number(row, 3, tenant.area).map_err(|error| error.to_string())?;
        worksheet.write_number(row, 4, tenant.power as f64).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 5, &tenant.phone).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 6, &tenant.email).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 7, &tenant.emergency).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 8, &tenant.parking).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 9, &tenant.tower).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 10, &tenant.occupancy_period).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 11, &tenant.record_type).map_err(|error| error.to_string())?;
        worksheet.write_string(row, 12, &tenant.status).map_err(|error| error.to_string())?;
    }
    worksheet.set_freeze_panes(1, 0).map_err(|error| error.to_string())?;
    workbook.save(&path).map_err(|error| error.to_string())?;
    Ok(path.display().to_string())
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
            auth_status,
            setup_auth,
            login,
            change_password,
            reset_password,
            replace_tenants,
            create_tenant,
            update_tenant,
            delete_tenant,
            export_tenants_xlsx
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

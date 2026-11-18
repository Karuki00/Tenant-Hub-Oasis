# TenantHub

TenantHub is a Windows desktop application for the Tenant Relation department of Apartemen Oasis Mitra Sarana. It provides tenant directory management, Excel import and export, SQLite persistence, backups, CRUD workflows, and signed GitHub updates.

## Current release

- Version: `v0.3.0`
- Repository: [Karuki00/Tenant-Hub-Oasis](https://github.com/Karuki00/Tenant-Hub-Oasis)
- Platform: Windows desktop

## Features

- Tenant Relation login with development quick-login.
- Dashboard with tenant totals, active records, total area, and completeness overview.
- Tenant Directory with search, pagination, tower, floor, status, completeness, and occupancy filters, plus sorting and quick edit.
- Tenant CRUD: create, view, edit, and delete.
- Excel `.xls`/HTML-table import with field mapping, completeness analysis, duplicate detection, safe merge modes, preview, and confirmation.
- JSON backup and restore.
- Native `.xlsx` export using Rust and `rust_xlsxwriter`.
- Native Windows save dialog for choosing the Excel export location.
- OASIS branding and responsive UI.
- Signed GitHub update checking and installation.

## Tenant fields

Core fields:

- No. Unit
- Nama
- Luas
- Daya (electric watt)
- No. tlp
- Email
- No. tlp keadaan darurat
- No Parkir

Additional preserved fields include Kode Tenant, Lokasi/Tower, Periode Huni, and Status.
Records also have a flexible relationship category, such as Tenant, Vendor/Provider,
Contractor, Operations, Facility, Management, or Other.

## Technology

- Tauri 2
- React and TypeScript
- Vite
- Rust
- `rusqlite` with bundled SQLite
- `rust_xlsxwriter` for Excel generation
- `rfd` for the native save dialog
- Tauri updater and GitHub Actions

## Requirements

- Windows 10 or later
- Node.js LTS and npm
- Rust stable and Cargo
- Microsoft WebView2 Runtime
- Visual Studio C++ Build Tools with the Windows SDK
- VS Code with Tauri and rust-analyzer extensions

Check your tools:

```powershell
node --version
npm --version
rustc --version
cargo --version
```

## Installation

```powershell
git clone https://github.com/Karuki00/Tenant-Hub-Oasis.git
Set-Location Tenant-Hub-Oasis
npm.cmd install
```

## Development

Run the complete desktop application:

```powershell
npm.cmd run tauri dev
```

Use the development quick-login button during development. It is not included in production builds.

Do not use only `npm.cmd run dev` when testing SQLite, CRUD, import, or export. Vite-only mode does not run the Rust/Tauri backend.

## Build and validation

```powershell
npm.cmd run build
Set-Location src-tauri
cargo check
Set-Location ..
npm.cmd run tauri build
```

Installers are generated under `src-tauri/target/release/bundle/`.

## Database

SQLite is managed by Rust and stored in the Tauri application data directory as `tenant_hub.db`. Inline migrations are executed during application startup.

Database commands include loading, replacing, creating, updating, and deleting tenant records. The UI is updated only after the SQLite operation succeeds.

## Authentication

On the first launch, TenantHub asks the Tenant Relation administrator to create a username and password. Passwords are hashed with Argon2 and are never stored as plaintext.

The setup flow generates a master recovery code. Store it securely outside the application. If the password is forgotten, the master code can be used to create a new password. A new recovery code is generated after every password reset.

There is no default production password. The development quick-login button is available only in development builds.

While logged in, the administrator can use **Pengaturan** to change the password
by entering the current password and confirming a new one. This normal change does
not rotate the master recovery code; the recovery code is used only for forgotten-password recovery.

The **Kunci aplikasi** action clears the active session and returns to the login
screen without restarting TenantHub. The administrator can also copy the recovery
code when it is first displayed during setup or password recovery.

## Excel import

1. Open **Direktori Penyewa**.
2. Select **Impor**.
3. Choose the exported `.xls`/HTML-table file.
4. Review the detected fields and completeness report.
5. Confirm the preview to save the rows to SQLite.

Summary Excel files may not contain all detail columns. Missing detail values can be completed through the CRUD form.

## Excel export

**Ekspor Excel** reads records from SQLite, creates an `.xlsx` workbook in Rust, and opens a native save dialog to choose the destination. The exported workbook can be retained as the department's archive or shared for operational review.

## License

TenantHub is proprietary software for internal use by Apartemen Oasis Mitra Sarana.

Copyright © 2026 Apartemen Oasis Mitra Sarana. All rights reserved.

Unauthorized copying, modification, redistribution, commercial use, or deployment for another organization or apartment is prohibited without prior written permission. See [LICENSE](LICENSE) for the full notice.

Third-party dependencies retain their own open-source licenses. Those licenses do not make TenantHub itself open source.

# TenantHub Project Status

TenantHub is an internal Tenant Relation desktop application built with Tauri, React, TypeScript, and SQLite.

## Release policy

The current internal release is `v0.2.0`, including first-launch password setup and master-code recovery.

## Big milestone - Tenant Relation data management foundation

### Authentication milestone - 0.2.0 development scope

- [x] Create username and password on first launch
- [x] Hash credentials with Argon2 in Rust
- [x] Generate a master recovery code
- [x] Reset password using the master recovery code
- [x] Rotate the recovery code after password reset
- [x] Keep development quick-login limited to development builds

### Product workflow

- [x] Add Tenant Relation login entry point
- [x] Add Oasis-branded app shell and responsive UI
- [x] Separate Dashboard from Tenant Directory
- [x] Keep Dashboard focused on quick access and data completeness
- [x] Move Import/Export into Tenant Directory
- [x] Add Tenant Directory search, tower filter, and floor filter
- [x] Add reusable pagination

### Tenant data model

- [x] Define the eight core detail columns: No. Unit, Nama, Luas, Daya, No. tlp, Email, No. tlp keadaan darurat, and No Parkir
- [x] Preserve Excel summary fields: Kode Tenant, Lokasi, and Periode Huni
- [x] Add Active/Review status
- [x] Add Pending, Vacant, Expired, and Suspended statuses
- [x] Add status filtering in Tenant Directory

### Excel import

- [x] Read the supplied HTML-based `.xls` export
- [x] Map Excel summary fields into the tenant model
- [x] Calculate required-field completeness
- [x] Report missing fields by column
- [x] Show an import preview before saving
- [x] Require confirmation before importing
- [x] Persist imported rows in SQLite

### CRUD

- [x] Create tenant
- [x] Read tenant detail modal
- [x] Update tenant
- [x] Delete tenant with confirmation
- [x] Allow duplicate unit values from source Excel data
- [x] Persist CRUD changes in SQLite

### SQLite

- [x] Add Rust-owned SQLite storage
- [x] Add initial tenant schema
- [x] Add database indexes for unit, tower, and tenant name
- [x] Add migration for expanded tenant statuses
- [x] Add database service for load, replace, create, update, and delete operations
- [x] Add native Excel export through Tenant Directory
- [ ] Complete packaged Tauri database testing

### Updater

- [x] Connect the Tauri updater plugin
- [x] Add GitHub Releases endpoint template
- [x] Check for updates at startup
- [x] Download and install signed updates
- [x] Relaunch after installation
- [x] Add GitHub Actions signed-release workflow template
- [x] Add production update and failure-scenario test plan
- [ ] Configure the real GitHub repository endpoint
- [ ] Generate and secure updater signing keys
- [ ] Test production update and failure scenarios

## Current blockers before a release version can be assigned

1. Test the SQLite migrations and CRUD workflow in a packaged Tauri build.
2. Replace updater placeholders with the real GitHub repository and public key.
3. Run the production updater test plan in `docs/UPDATER_TEST_PLAN.md`.
4. Test first-launch authentication and master-code recovery in a packaged Tauri build.
5. Complete final acceptance testing with the actual Tenant Relation team.

## Reference data

The supplied `.xls` file is an HTML table export containing approximately 518 rows with Kode Tenant, Customer, Lokasi, Unit Properti, Periode Huni, and Luas. The detail fields are maintained separately because the Excel file is a summary export, not the complete Tenant Relation record.

## Verification

- Frontend: `npm run build` passes.
- Backend: `cargo check` passes from `src-tauri`.

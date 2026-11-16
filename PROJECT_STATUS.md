# TenantHub Project Status

TenantHub is an internal Tenant Relation desktop application built with Tauri, React, TypeScript, and SQLite.

## Release policy

The project is currently in development. Do not assign or announce a release version yet. A version such as `v0.1.0` will be added only when the product owner confirms that the feature set is complete and ready to release.

## Big milestone - Tenant Relation data management foundation

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
- [x] Add archive/restore state

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
- [x] Validate duplicate unit numbers
- [x] Archive tenant
- [x] Restore archived tenant
- [x] Persist CRUD changes in SQLite

### SQLite

- [x] Add Tauri SQLite plugin
- [x] Add initial tenant schema
- [x] Add database indexes for unit, tower, and tenant name
- [x] Add migration for tenant archiving
- [x] Add database service for load, replace, create, update, delete, and archive operations
- [x] Add JSON database backup and restore through Tenant Directory
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
4. Replace the temporary development login with persistent authentication.
5. Complete final acceptance testing with the actual Tenant Relation team.

## Reference data

The supplied `.xls` file is an HTML table export containing approximately 518 rows with Kode Tenant, Customer, Lokasi, Unit Properti, Periode Huni, and Luas. The detail fields are maintained separately because the Excel file is a summary export, not the complete Tenant Relation record.

## Verification

- Frontend: `npm run build` passes.
- Backend: `cargo check` passes from `src-tauri`.

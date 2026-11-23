# TenantHub Project Status

TenantHub is an internal Tenant Relation desktop application built with Tauri, React, TypeScript, and SQLite.

## Release policy

The `v0.3.1` release includes the `v0.3.0` features plus form draft continuity and tower dropdown improvements.

## v0.3.1 patch milestone

- [x] Preserve unsaved Tambah Data values when the modal is closed and reopened.
- [x] Clear the new-record draft after submission.
- [x] Provide TOWER A, TOWER B, and TOWER C dropdown options.
- [x] Preserve non-standard imported tower values during editing.

## v0.3.0 improvement milestone

### Completed in v0.2.1

- [x] Add example placeholders to the Tambah Penyewa form using the supplied Excel formats.
- [x] Explain that the Excel summary does not contain all Tenant Relation detail fields.
- [x] Give the tenant detail modal an outlined data-card layout.
- [x] Improve detail-card spacing, value wrapping, and mobile layout.
- [x] Keep the release version synchronized across the frontend, Rust package, Tauri configuration, README, and project status.
- [x] Record each `v0.2.1` improvement in `changelog.md`.

### Completed in v0.3.0 - safe Excel import and duplicate handling

The supplied Excel file is a summary export. It can contain tenant information that already exists in SQLite, while leaving manual detail fields blank. Import must therefore explain its effect before writing anything.

- [x] Compare incoming rows against existing records using tenant code first, with unit and name shown as supporting match information.
- [x] Identify exact duplicate rows in the selected Excel file.
- [x] Identify records that match existing database records.
- [x] Show separate counts for new, updated, unchanged, duplicate, and conflicting rows.
- [x] Show the exact fields that will be replaced for every matched record.
- [x] Preserve existing phone, email, emergency, parking, and power details when the incoming summary file leaves them blank.
- [x] Let the user choose a clear import action: add new rows, update matches, or replace the full dataset.
- [x] Add a strong confirmation warning before any full-dataset replacement.
- [x] Keep cancellation guaranteed to perform no database write.
- [x] Show an import result summary after saving.
- [x] Match by tenant code first, then unit and name; leave ambiguous duplicate-unit matches unchanged for manual review.
- [x] Create an automatic internal safety copy before a destructive full-dataset import without adding a complicated backup workflow for users.

### Remaining v0.3.0 hardening

### General relationship records

- [x] Add a flexible record category separate from lifecycle status.
- [x] Support tenant, vendor/provider, contractor, operational office, facility/device, management, and other categories.
- [x] Store and migrate the category in SQLite.
- [x] Add category selection to the add/edit form.
- [x] Show and filter category in the detail and directory views.
- [x] Include category in Excel exports while preserving it during summary imports.

### Data quality and form validation

- [x] Validate unit formats using the `tower/floor/unit-or-room` structure, such as `A/02/01`, `C/GF/12`, or `A/02/MEETING ROOM`, while allowing incomplete source rows to remain reviewable during import.
- [x] Require area to be a valid positive number in the manual form.
- [x] Validate power as a non-negative watt value.
- [x] Validate phone and emergency numbers with a forgiving Indonesian phone format.
- [x] Validate email only when an email value is provided.
- [x] Validate occupancy-period formatting and provide a clear example.
- [x] Normalize accidental spaces and inconsistent capitalization before saving.
- [x] Replace common technical database errors with simple Indonesian user messages where possible.

### Dashboard and directory productivity

- [x] Make completeness summaries clickable so users can open filtered records missing phone, email, emergency, parking, power, or other fields.
- [x] Add quick filters for records needing review, vacant units, and expired occupancy periods.
- [x] Keep archived records preserved in SQLite but outside the everyday dashboard and directory workflow.
- [x] Add sorting for unit, tenant name, tower, status, and completeness.
- [x] Add a clear result count for the active search and filter combination.
- [x] Add a quick-edit path from directory results to the tenant form.
- [x] Show a clear last-loaded state in the directory database status card.
- [x] Move directory filters into a collapsible panel below a full-width search bar.
- [x] Show the number of active filters while keeping the search field easy to use.
- [x] Standardize normal action buttons with consistent sizing, shape, typography, focus, and interaction states.

### Authentication usability

- [x] Add a simple change-password action for the authenticated administrator. This verifies the current password and saves a new password without rotating the master recovery code.
- [x] Add a lock-screen action without requiring a full application restart.
- [x] Add a copy button when the master recovery code is first displayed.
- [x] Keep recovery-code warnings short and clear for non-technical users.
- [x] Add visible logout and lock actions in the application shell.
- [x] Ensure Pengaturan opens the password dialog from both Dashboard and Directory views.

### Accessibility and older-user usability

- [ ] Ensure every modal can be operated with keyboard focus and Escape where appropriate.
- [ ] Add visible focus states to buttons, inputs, filters, and table rows.
- [ ] Keep error, success, and loading feedback visible long enough to read.
- [ ] Use plain Indonesian wording for destructive actions and import decisions.
- [ ] Avoid relying on placeholder text alone for important field instructions.
- [ ] Check contrast, text size, and layout at the supported Windows display scales.

### Release-quality verification

- [ ] Add repeatable packaged Windows test steps for first launch, login, recovery, CRUD, import, export, and update.
- [ ] Verify tenant data remains available after installing an update over an older release.
- [ ] Verify failed imports do not partially change the database.
- [ ] Verify a failed updater check leaves the current application usable.
- [ ] Run the final acceptance checklist with the Tenant Relation team before assigning the next release version.

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
- [x] Configure the real GitHub repository endpoint
- [x] Generate and secure updater signing keys

- [x] Test production update and failure scenarios
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

# TenantHub v0.3.1

## Form continuity and tower selection

- Preserved unsaved Tambah Data values when the modal is closed accidentally and reopened before submission.
- Cleared the new-record draft after successful submission.
- Changed Lokasi / Tower into a dropdown with TOWER A, TOWER B, and TOWER C options.
- Preserved existing imported tower values when editing records outside those standard options.

# TenantHub v0.3.0

## Safe Excel import and duplicate handling

- Added import analysis against the existing SQLite tenant records.
- Added duplicate-row and ambiguous-match detection before saving.
- Added separate counts for new, updated, unchanged, duplicate, and conflicting rows.
- Added a preview of the exact fields that will be replaced for matched records.
- Added safe merge mode as the default import behavior.
- Preserved existing manual contact, power, emergency, and parking details when the Excel summary leaves them blank.
- Added add-new-only and replace-all import modes.
- Added an explicit confirmation before replacing the full dataset.
- Kept import cancellation free of database writes.
- Added an import completion summary after the database operation succeeds.
- Added an internal database safety copy before a replacement import.
- Matching uses tenant code first, then unit and tenant name; ambiguous matches are left unchanged for manual review.

## Data quality and form validation

- Added validation for manual unit numbers using the `tower/floor/unit-or-room` format, such as `A/02/01`, `C/GF/12`, or `A/02/MEETING ROOM`.
- Normalized unit separators, spacing, tower values, contact values, and email casing before saving.
- Added validation for positive area, non-negative power, optional Indonesian phone numbers, optional email addresses, and occupancy periods.
- Added field-level Indonesian validation messages in the Tambah/Edit Penyewa form.
- Added clearer messages for common database errors such as duplicate codes, locked storage, and missing database tables.
- Kept incomplete imported summary rows available for review instead of applying manual-form requirements to the source file.

## Dashboard and directory productivity

- Added clickable data-completeness review access from the dashboard.
- Added quick directory filters for incomplete, review, vacant, and expired records.
- Kept archived records preserved in SQLite but outside the everyday dashboard and directory workflow.
- Added sorting by unit, tenant name, tower, status, and completeness.
- Added active result counts and a reset-filters action.
- Added a quick Edit action for each directory row.
- Added a visible last-loaded time in the directory status card.
- Moved directory filters into a collapsible panel below the full-width search bar.
- Added an active-filter count so the filter state remains visible without shrinking the search field.
- Standardized normal action buttons with consistent sizing, shape, typography, focus, and interaction states while retaining semantic colors.

## Authentication usability

- Added a logged-in Ubah password action under Pengaturan.
- Require the current password before saving a new password.
- Keep the master recovery code unchanged when the password is changed normally.
- Reserve master-code reset for forgotten-password recovery.
- Added a Kunci aplikasi action that clears the active session and requires login again without restarting the app.
- Added a Salin master code action during first-launch setup and recovery reset.
- Clarified that the recovery code must be saved before leaving the screen because it cannot be displayed again.
- Fixed the Dashboard Pengaturan button so Ubah password opens correctly from both Dashboard and Directory views.
## General relationship records

- Added a flexible record category for tenants, vendors/providers, contractors, operational offices, facilities/devices, management, and other records.
- Added category selection to the add/edit form and category display to the detail modal and directory.
- Added category filtering so records such as `CBN01` or a CCTV entry do not need to be represented as tenants.
- Added the category to SQLite migrations and Excel exports while preserving it during safe summary imports.

# TenantHub v0.2.1

## UI improvements

- Added example placeholders to the Tambah Penyewa form using the same formats as the supplied Excel summary.
- Clarified that Excel imports contain summary fields, while contact, power, emergency, and parking details may need to be entered manually.
- Redesigned the tenant detail modal so each field appears in its own outlined data card.
- Improved detail-card spacing, value wrapping, and mobile layout.

# TenantHub v0.2.0

## Authentication improvements

- Added first-launch setup for creating the Tenant Relation username and password.
- Replaced the previous temporary login behavior that accepted any username and password with real credential validation.
- Added Argon2 password hashing so passwords are not stored in plaintext.
- Added a generated master recovery code for resetting a forgotten password.
- Rotated the master recovery code after a successful password reset.
- Restricted the development quick-login button to development builds.

## Tenant Relation data management foundation

### Added

- Tenant Relation login screen with development quick-login button.
- Dashboard with tenant totals, active status, total area, and data completeness overview.
- Tenant Directory with search, tower filter, floor filter, and status filter.
- Tenant Directory pagination.
- Tenant CRUD operations backed by Rust and SQLite.
- Tenant detail modal with edit, delete, archive, and restore actions.
- Excel import preview with field completeness scanning before confirmation.
- JSON backup and restore support.
- OASIS branding using the provided logo assets.
- Indonesian user interface.
- Application information modal with version, technology stack, storage details, and GitHub repository link.
- GitHub updater integration with update availability indicator and installation action.
- Responsive login and dashboard layouts.
- Darker gradient surfaces, outlined panels, readable table styling, and tactile button/sidebar states.

### Data and storage

- Moved SQLite ownership to Rust using `rusqlite` with bundled SQLite.
- Added inline database migrations for the tenant schema, archiving, and expanded statuses.
- Database is initialized in the Tauri startup hook.
- Tenant data is saved only after the SQLite operation succeeds.
- Removed sample tenant data and static tenant summary placeholders.
- Unit filtering supports formats such as `A/02/01` and `C/GF/12`.

### Release notes

- This is the second internal release of TenantHub for Tenant Relation.
- Run the desktop application with `npm.cmd run tauri dev` during development.

# TenantHub updater test plan

The updater is intentionally not marked production-ready until the real GitHub repository and signing key are configured.

## Required setup

1. Create the GitHub repository.
2. Generate a Tauri updater signing key pair.
3. Put the public key in `src-tauri/tauri.conf.json`.
4. Put the repository owner and name in the updater endpoint.
5. Add `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` as GitHub Actions secrets.
6. Trigger `.github/workflows/release.yml` with a tag such as `v0.1.0-test`.

## Scenarios

### No update available

- Install a release.
- Launch the application.
- Expected: the application opens normally and remains on the current version.

### Valid update

- Install an older release.
- Publish a newer signed GitHub Release.
- Launch the older application.
- Expected: the newer update is downloaded, installed, and the application relaunches.

### Invalid signature

- Publish an update with a mismatched signature.
- Launch the older application.
- Expected: installation is rejected and the current application remains usable.

### Unavailable GitHub endpoint

- Disconnect the network or temporarily use an unavailable endpoint.
- Launch the application.
- Expected: the application opens normally and logs the skipped update check.

### Interrupted download

- Interrupt the update download.
- Relaunch the application.
- Expected: the old installation remains usable and a later check can retry.

### Database preservation

- Import tenant data in the older release.
- Update to a newer release.
- Expected: SQLite tenant records remain available after the update.

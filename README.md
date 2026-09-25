# ZeroTrust Vault

A private file workspace with signup/login, a dashboard, encrypted uploads, and expiring share links. React + Vite frontend; Express + MongoDB backend.

## Run locally

Use Node.js 22.12 or newer.

1. Run the installation commands below.
2. Copy backend/.env.example to backend/.env and supply MONGO_URI and ENCRYPTION_KEY. Preserve an existing encryption key if you already have files.
3. Start the API and UI in separate terminals.
4. Open **http://127.0.0.1:5173** and create an account.

   npm ci --prefix backend
   npm ci --prefix frontend
   npm run dev --prefix backend
   npm run dev --prefix frontend

Generate encryption and JWT secrets separately with:

    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

If JWT_SECRET is absent during local development, the server generates and reuses an ignored backend/.local-jwt-secret file. Production requires an explicit secret. Existing backend/.env settings are loaded without overwriting host environment variables.

The dev server proxies /api to port 5000. No frontend environment file is required. Use one hostname consistently (localhost or 127.0.0.1), because cookies are scoped to the hostname.

## Pages and workflows

- /login, /signup: create an account or start an eight-hour session.
- /dashboard: real file, storage, active-link and access totals, recent files and recent activity.
- /files: upload, search, filter, sort, download, share and delete your files.
- /links: retrieve existing links after refresh, copy/open links, and revoke access.
- /share/:token: public recipient page with password entry, preview and permitted downloads.
- Unrecognized pages show a recovery page; protected pages redirect to login and preserve the destination.

Files are limited to 25 MB. Supported types: PDF, DOC, DOCX and TXT. PDF/TXT support preview; Word documents require downloads. File sizes and types are checked by the client and server. Type checks use the extension and supplied MIME type; this is not malware scanning.

Revocation is permanent for that link. Create a new link to share again. Revoking a link prevents new access; it cannot recall downloaded copies or already delivered previews. Preview-only suppresses the download endpoint/action; recipients can still capture or save content they can view.

## API

All owner routes require the HTTP-only session cookie (or an equivalent bearer JWT). JSON responses use success and message on errors. Cookie-authenticated write requests must include the trusted Origin header; the frontend supplies it automatically.

| Method     | Route                             | Purpose                                      |
| ---------- | --------------------------------- | -------------------------------------------- |
| GET        | /api/health                       | Database readiness, 200 or 503               |
| POST       | /api/auth/signup, /api/auth/login | Create/start session                         |
| GET        | /api/auth/profile                 | Current user                                 |
| POST       | /api/auth/logout                  | Invalidate all current sessions for the user |
| GET/POST   | /api/files, /api/files/upload     | List/upload owned files                      |
| GET/DELETE | /api/files/:id                    | Read metadata/delete owned file              |
| GET        | /api/files/:id/download           | Download owned file                          |
| GET/POST   | /api/share                        | List/create owned links                      |
| DELETE     | /api/share/:token                 | Revoke owned link                            |
| POST       | /api/share/:token/revoke          | Explicit revoke alias                        |
| GET        | /api/share/:token                 | Public metadata without counting access      |
| POST       | /api/share/:token/preview         | Validate password and return PDF/TXT preview |
| POST       | /api/share/:token/download        | Validate password and download permission    |

Legacy /api/files/download/:id and /api/share/:token/access remain compatible. The latter enforces download permission. Revoked/expired links return 410. Share metadata never exposes password hashes. Counts increment only when file content is successfully read for delivery.

## Production deployment

The Render blueprint builds the frontend with Node.js and serves it from Express on the same origin, including deep-link fallback. It requests a paid disk-capable service and does not deploy anything until you configure and apply it. See the [Render blueprint reference](https://render.com/docs/blueprint-spec), [Node.js version settings](https://render.com/docs/node-version), and [persistent disk documentation](https://render.com/docs/disks).

Supply these settings through your hosting provider:

| Setting                | Value                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| NODE_ENV               | production                                                              |
| MONGO_URI              | Your MongoDB connection string                                          |
| JWT_SECRET             | Strong random secret, at least 32 characters                            |
| ENCRYPTION_KEY         | Stable 32-byte key, hex or Base64                                       |
| APP_ORIGIN             | Public HTTPS origin, e.g. https://vault.example.com (no trailing slash) |
| ENCRYPTED_STORAGE_PATH | Persistent writable directory; Render uses /var/data                    |
| TRUST_PROXY            | 1 only when exactly one trusted proxy is in front                       |

Connect the repository's main branch to Render, create the service from render.yaml, and supply MONGO_URI, APP_ORIGIN, and ENCRYPTION_KEY through Render's secret settings. Render generates JWT_SECRET and mounts /var/data as the persistent encrypted-file store. The blueprint runs the frontend build and API start commands. Set APP_ORIGIN to your deployed HTTPS origin without a trailing slash, and configure MongoDB network access before exposing the service. Secure session cookies require HTTPS. A health check is available at /api/health.

Keep a backup of both MongoDB metadata and encrypted files **and** the encryption key. Losing/changing the key makes existing files unreadable. The server can decrypt files; this is server-side encryption at rest, not end-to-end encryption.

This deployment is designed for **one application instance** with persistent local disk. Rate limits are in memory and reset on restart. Multiple replicas require shared object storage and a shared rate-limit store. Files are buffered in memory for encryption/download; choose instance memory and concurrency accordingly. Files created on your current computer remain on its disk; deploying code does not migrate them. Migrate the storage directory together with metadata and the same encryption key.

## Verification

    npm test --prefix backend
    npm run lint --prefix frontend
    npm run build --prefix frontend
    npm run test:e2e --prefix frontend
    npm audit --prefix backend
    npm audit --prefix frontend

API tests use isolated MongoDB and never read your app database URI. Browser tests exercise the compiled frontend against a disposable MongoDB server on port 5101. Build first. They use installed Edge on Windows; CI uses Playwright Chromium. For another OS, set CI=1 and install Chromium with npx playwright install chromium.

The first isolated-database run may download a MongoDB test binary. CI performs API tests, frontend lint/build, browser tests and production-dependency audits. Browser screenshots/traces are saved only to ignored artifact directories.

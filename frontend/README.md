# ZeroTrust Vault — Frontend

A React frontend for the `Secure-File-Sharing-Platform` backend. It talks to the
real API in `backend/src` — upload, list, download, and delete files, plus
create and revoke expiring (optionally password-protected) share links.

There's no login screen because the backend has no auth/user routes yet —
this is a single-vault frontend that matches what the API actually supports.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend if not localhost:5000
npm run dev
```

Run this alongside the backend (`cd backend && npm run dev`), with its
`.env` configured (`MONGO_URI`, `ENCRYPTION_KEY`, `ENCRYPTED_STORAGE_PATH`).

## Pages

- `/` — Vault dashboard: drag-and-drop upload, file list, download, share, delete.
- `/share/:token` — Public link recipients land here. Shows file info, prompts
  for a password if the link is protected, and downloads on unlock.

## Notes on API fit

- No `ownerId`/auth is sent — every file belongs to the single vault (matches
  the backend, which only scopes by owner when `req.user` exists).
- The backend has no "list share links for a file" endpoint, so the share
  link shown after creation only lives for that session — refreshing the
  page won't show previously created links for a file. You can still revoke
  it from the same modal before closing it.
- Downloading a shared file (password-protected or not) both go through
  `POST /api/share/:token/access`, since that's the only route that streams
  the file back — matches `share.controller.js`.

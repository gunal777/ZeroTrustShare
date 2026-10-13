# ZeroTrustShare 🛡️📁

> **High-Performance, Zero-Trust Cloud File Workspace with Authenticated AES-256-GCM Encryption, Granular Sharing Policies, and Stateless Cookie Authentication.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%205-green)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen)](https://www.mongodb.com/atlas)
[![Storage](https://img.shields.io/badge/Cloud%20Storage-AWS%20S3-orange)](https://aws.amazon.com/s3/)

---

## 📌 Overview

**ZeroTrustShare** is a secure cloud-native file storage and sharing platform engineered around Zero-Trust security principles. Unlike conventional cloud storage platforms that retain plaintext files or centralize encryption keys, ZeroTrustShare isolates storage and metadata pipelines, implements authenticated symmetric encryption (`AES-256-GCM`), and protects sensitive sessions using cross-site `HttpOnly` cookie-driven JWT mechanisms.

The system supports strict file validation, decoupled metadata tracking, view-only in-browser rendering versus direct download streaming, and cryptographically signed, time-limited share links with optional bcrypt passcode gating.

---

## 🚀 Key Features

* **Authenticated Encryption (`AES-256-GCM`):**
  * In-memory file buffer encryption before secondary storage writes.
  * Every payload generates an isolated 96-bit (12-byte) initialization vector (IV) and a 128-bit authentication tag to ensure confidentiality and cryptographic tamper-proofing.
* **Separation of Concerns & Safe Storage:**
  * Raw file names and extensions are stripped; payloads are stored under random UUID identifiers (`.enc`) in AWS S3 or isolated local storage.
  * File metadata, IVs, authentication tags, and user associations are tracked separately in MongoDB Atlas.
* **Granular Link Sharing Engine:**
  * Configurable link lifespan (TTL expiry: 1 hour, 24 hours, 7 days).
  * Access mode segregation: **View-Only Preview** (`Content-Disposition: inline`) vs. **Full Download** (`Content-Disposition: attachment`).
  * Optional passcode authentication hashed with `bcrypt` (Cost Factor: 12).
  * Instant owner revocation capability.
* **Hardened Stateless Session Architecture:**
  * Cross-site JWT session management using `HttpOnly`, `Secure`, `SameSite: None` cookies to neutralize browser-side Cross-Site Scripting (XSS) token extraction.
  * Strict CORS whitelist policies and Origin/Referer header enforcement against Cross-Site Request Forgery (CSRF).
* **Production Reliability:**
  * Integrated `/health` heartbeat endpoint monitored via UptimeRobot to mitigate cold starts on free cloud hosting tiers (Render).

---

## 🛠️ System Architecture

```text
 ┌────────────────────────────────────────────────────────┐
 │                   React Client (SPA)                   │
 │               Hosted on Vercel (HTTPS)                 │
 └───────────────────────────┬────────────────────────────┘
                             │
                  Secure HTTPS / Cookies
                  (SameSite: None; Secure)
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │               Node.js & Express 5 API                  │
 │               Hosted on Render (HTTPS)                 │
 │                                                        │
 │  ┌──────────────────┐            ┌──────────────────┐  │
 │  │ Auth Middleware  │            │ Multer In-Memory │  │
 │  │ (JWT Verification│            │ Buffer Parser    │  │
 │  └────────┬─────────┘            └────────┬─────────┘  │
 │           │                               │            │
 │           ▼                               ▼            │
 │  ┌──────────────────────────────────────────────────┐  │
 │  │      AES-256-GCM Encryption / Decryption        │  │
 │  │                 Crypto Service                   │  │
 │  └────────────────────────┬─────────────────────────┘  │
 └───────────────────────────┼────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
 ┌─────────────────────────┐   ┌─────────────────────────┐
 │      MongoDB Atlas      │   │         AWS S3          │
 │  - Metadata & User Data │   │  - Ciphertext Blobs     │
 │  - IV & Auth Tags       │   │    (.enc UUID objects)  │
 │  - ShareLink Policies   │   │  - Strict Private ACL   │
 └─────────────────────────┘   └─────────────────────────┘
```

---

## 💻 Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Axios
* **Backend:** Node.js, Express.js 5, Multer (Memory Storage)
* **Database:** MongoDB Atlas with Mongoose ODM
* **Object Storage:** AWS Simple Storage Service (AWS S3) / Fallback Local Storage
* **Cryptography & Security:** Node.js `crypto` (`aes-256-gcm`), `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `helmet`
* **Hosting & DevOps:** Vercel (Frontend), Render (Backend), UptimeRobot (Uptime Monitoring)

---

## 📂 Project Structure

```text
ZeroTrustShare/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Modals, FileCard)
│   │   ├── context/            # Authentication & State Management
│   │   ├── pages/              # Dashboard, Login, Register, SharedView
│   │   ├── services/           # Axios API instances (withCredentials: true)
│   │   ├── App.jsx             # Route definitions
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend API (Node.js + Express)
│   ├── config/                 # DB & AWS S3 connection clients
│   ├── controllers/            # Auth, File, and Share business logic
│   ├── middleware/             # Auth check, Multer upload, Error handler
│   ├── models/                 # User, File, ShareLink Mongoose schemas
│   ├── routes/                 # /api/auth, /api/files, /api/share, /health
│   ├── services/               # AES-256-GCM crypto utils & S3 upload helpers
│   ├── server.js               # Express application entry point
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `server/` directory using the template below:

```env
# Application Runtime
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/zerotrustshare?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=super_secure_jwt_random_secret_string_min_32_chars
JWT_EXPIRES_IN=1d

# Symmetric Encryption (AES-256-GCM)
# Must be a 32-byte string or 64-character Hex string
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# AWS S3 Storage Credentials (Optional if using local fallback)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-zerotrust-encrypted-bucket
```

For the `client/` directory, configure `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📦 Getting Started & Local Installation

### Prerequisites
* Node.js v18.x or v20.x LTS installed
* MongoDB local instance or MongoDB Atlas cluster URI
* Git

### 1. Clone the Repository
```bash
git clone https://github.com/gunal777/ZeroTrustShare.git
cd ZeroTrustShare
```

### 2. Configure and Run Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and generated 32-byte ENCRYPTION_KEY
npm run dev
```
The server will initialize on `http://localhost:5000`.

### 3. Configure and Run Frontend
```bash
cd ../client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 API Reference

### Health Check
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint for UptimeRobot monitoring |

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate user & attach HttpOnly cookie | Public |
| `POST` | `/api/auth/logout` | Clear session cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user identity | Authenticated |

### File Operations (`/api/files`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/files/upload` | Ingest file, encrypt (AES-256-GCM), store in S3 | Authenticated |
| `GET` | `/api/files` | Retrieve list of files owned by user | Authenticated |
| `GET` | `/api/files/:id` | Fetch specific file metadata | Authenticated |
| `GET` | `/api/files/:id/download` | Decrypt from S3 and stream file attachment | Authenticated |
| `DELETE`| `/api/files/:id` | Remove file blob from S3 and metadata from DB | Authenticated |

### Sharing & Public Access (`/api/share`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/share` | Generate shareable link with TTL, mode, & passcode | Authenticated |
| `GET` | `/api/share/:token` | Retrieve metadata of shared file | Public |
| `POST` | `/api/share/:token/verify` | Verify bcrypt passcode for protected links | Public |
| `GET` | `/api/share/:token/stream` | Stream decrypted content (inline preview or file) | Public / Authorized |
| `DELETE`| `/api/share/:token` | Revoke active share token | Authenticated |

---

## 📊 Performance Benchmarks

Conducted on local deployment using Node.js v20 LTS, AES-256-GCM streaming operations, and local disk loopback:

| File Size | Upload (s) | Encrypt (ms) | Decrypt (ms) | Download (s) |
| :--- | :--- | :--- | :--- | :--- |
| **100 KB** | 0.04 s | 3.8 ms | 3.2 ms | 0.03 s |
| **1 MB** | 0.11 s | 14.5 ms | 12.1 ms | 0.08 s |
| **5 MB** | 0.38 s | 58.2 ms | 49.6 ms | 0.29 s |
| **10 MB** | 0.69 s | 112.4 ms | 98.7 ms | 0.54 s |
| **25 MB** | 1.52 s | 268.0 ms | 234.5 ms | 1.21 s |

---

## 🗺️ Future Roadmap

- [ ] **Client-Side Zero-Knowledge Encryption:** Implement client-side encryption via W3C Web Cryptography API (`SubtleCrypto`) so raw data is never seen by backend servers.
- [ ] **URL-Fragment Key Derivation:** Pass cryptographic keys through URL anchors (`#key`), ensuring keys are never transmitted over HTTP request lines.
- [ ] **AI-Assisted Threat Intelligence:** Monitor access logs to detect brute-force link attempts and abnormal access volumes.
- [ ] **Automated Sensitivity Classification:** On-device document sensitivity categorization prior to upload.

---

## 👥 Contributors

* **B. Gunal** ([@gunal777](https://github.com/gunal777))
* **A. Raj**
* **E. Choudhary**
* **T. Chandra**
* **M. Soni**

---

## 📜 References

1. National Institute of Standards and Technology, "Advanced Encryption Standard (AES)," FIPS PUB 197, 2001.
2. M. Dworkin, "Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC," NIST SP 800-38D, 2007.
3. S. Rose et al., "Zero Trust Architecture," NIST SP 800-207, 2020.
4. M. Jones et al., "JSON Web Token (JWT)," RFC 7519, IETF, 2015.
5. A. Barth, "HTTP State Management Mechanism," RFC 6265, IETF, 2011.
6. M. Watson, Ed., "Web Cryptography API," W3C Recommendation, 2017.
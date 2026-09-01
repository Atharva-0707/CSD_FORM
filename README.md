# Canteen Smart Card Application Portal

An official Canteen Smart Card Application Portal with a React + Vite frontend and a lightweight, concurrency-safe, file-based Node.js backend. The system features an 8-stage interactive wizard and produces a strictly formatted 2-page print record for physical photo pasting, signatures, and counter-signing.

## Features

- **8-Stage Guided Wizard**:
  1. Welcome Screen
  2. Important Instructions (10 official directives)
  3. Application Date (Auto-generated & locked) & Security Verification (CAPTCHA)
  4. URC, Service & Card Details
  5. Personal & Service Record (Strict PAN, Mobile, Date validation)
  6. Permanent Address Details
  7. Dependent Information (Optional)
  8. Application Finalisation (Save Draft, Print / Save PDF)
- **Concurrency-Safe File-Based Backend (No Database)**:
  - Persistent JSON files in `server/data/` (`counter.json` and `records.json`).
  - Zero external database dependencies (built with Node.js built-in `fs`, `path`, and `crypto`).
  - **Concurrency Safety via Synchronous File I/O**: `fs.readFileSync` and `fs.writeFileSync` block Node's single thread, ensuring atomic read-modify-write sequences across concurrent HTTP requests in a single-process deployment (e.g., PM2 fork mode).
  - **Crash-Safe Writes**: All disk writes write to a temporary file first and atomically swap it in via `fs.renameSync`.
  - Machine-checkable duplicate rejection (`HTTP 409` with `{ duplicateApplicationNumber: true }`).
  - Offline-first frontend: automatically falls back to client-side `localStorage` sequence generation if the backend is offline.
- **Official 2-Page Tabular Print Record**:
  - Strictly calibrated to **EXACTLY 2 A4 PORTRAIT PAGES** during browser printing (`Ctrl+P` / `Cmd+P` / Print button).
  - Taller physical photograph boxes for applicant passport photo, civil dress joint photo, and dependent photos.
  - Authentic layout featuring Self Declaration, Receipt for Applicant, Verified & Countersigned attestations, and 10 Important Instructions.

## Project Structure

```text
canteen-smart-card-mern/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   └── package.json
├── server/
│   ├── data/             # Auto-generated runtime storage (counter.json, records.json)
│   ├── .env
│   ├── package.json
│   ├── server.js         # Express REST API
│   ├── storage.js        # Atomic file-based persistence module
│   ├── test-concurrency.sh
│   └── test-duplicate.sh
├── package.json
└── README.md
```

## API Endpoints

- `GET /api/health` — Health check
- `GET /api/applications/next-number` — Atomic sequential number generator (`OE-XXXXXXX`)
- `POST /api/applications` — Save application record (returns `409` on duplicate number)
- `GET /api/applications` — Retrieve all saved records
- `GET /api/applications/:id` — Retrieve a single record by ID

## Quick Start

### 1. Install All Dependencies

```bash
npm run install-all
```

### 2. Run Both Server & Client Concurrently

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5001](http://localhost:5001)

### 3. Run Acceptance Tests

Ensure the server is running, then execute:

```bash
# Test concurrent number generation (e.g. 20 simultaneous requests)
./server/test-concurrency.sh 20

# Test duplicate application rejection
./server/test-duplicate.sh
```

### 4. Build for Production

```bash
npm run build
```

## Concurrency Guarantee & Scope

> [!NOTE]
> **Single Process Model**: Node.js executes JavaScript on a single thread. Because read-modify-write operations in `storage.js` execute synchronously, simultaneous requests queued by Node's event loop are processed sequentially without interleaving. This guarantees strict sequence uniqueness and crash resilience without requiring a database engine, provided the server runs as a **single Node.js process** (fork mode PM2, instances: 1).

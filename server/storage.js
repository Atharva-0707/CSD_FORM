/**
 * storage.js — Concurrency-safe, crash-safe file-based persistence.
 *
 * WHY THIS IS SAFE WITHOUT A DATABASE
 * ─────────────────────────────────────
 * Node.js runs JavaScript in a single thread. The synchronous fs calls
 * (readFileSync, writeFileSync) block that thread until they complete.
 *
 * When two HTTP requests arrive "simultaneously", they are enqueued on the
 * event loop and dispatched one-at-a-time. Because every read-modify-write
 * in this module is entirely synchronous, the following is guaranteed:
 *
 *   Request A:  readFileSync → increment → writeFileSync   ← fully done
 *   Request B:  readFileSync → increment → writeFileSync   ← only now starts
 *
 * Neither request can observe a half-written state, and they can never both
 * read the same "current" counter value and both increment it to the same
 * "next" value. This is the same atomicity guarantee a database $inc or
 * SELECT FOR UPDATE gives you, achieved here through Node's event-loop
 * serialisation instead of a database engine.
 *
 * ⚠️  SINGLE-PROCESS GUARANTEE ONLY
 * This guarantee holds ONLY when the app runs as a single Node.js process
 * (e.g. PM2 fork mode with instances: 1). If the app were ever scaled to
 * multiple processes or machines sharing these files, you would need real
 * file locking (e.g. proper-lockfile), a database, or a task queue to
 * prevent races between processes.
 *
 * WHY WRITES ARE CRASH-SAFE
 * ──────────────────────────
 * We never overwrite a file in place. Instead:
 *   1. writeFileSync(tmpPath, newData)   — write to a temp file
 *   2. renameSync(tmpPath, realPath)     — atomic swap at the filesystem level
 *
 * A rename is near-instantaneous and atomic on POSIX filesystems. If the
 * process is killed between step 1 and step 2, only the temp file is lost;
 * the real file retains the previous complete version. The data is never
 * left truncated or partially written.
 *
 * No external dependencies — only Node's built-in fs, path, and crypto.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR    = path.join(__dirname, "data");
const COUNTER_PATH = path.join(DATA_DIR, "counter.json");
const RECORDS_PATH = path.join(DATA_DIR, "records.json");

// ─── Distinguishable error type ─────────────────────────────────────────────

export class DuplicateApplicationNumberError extends Error {
  constructor(applicationNumber) {
    super(`Application number already exists: ${applicationNumber}`);
    this.name = "DuplicateApplicationNumberError";
    this.applicationNumber = applicationNumber;
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Read and parse a JSON file, returning defaultValue if the file does not exist. */
function readJson(filePath, defaultValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return defaultValue;
    throw err;
  }
}

/**
 * Write data to filePath atomically:
 *   1. Serialise to JSON.
 *   2. Write to <filePath>.tmp.<random>.
 *   3. Rename (atomic on POSIX) over the real file.
 *
 * If the process is killed between steps 2 and 3, the real file is
 * untouched. If killed mid-write in step 2, only a stray tmp file
 * remains — the real file is still the old complete version.
 */
function writeJsonAtomic(filePath, data) {
  const tmpPath = `${filePath}.tmp.${crypto.randomBytes(4).toString("hex")}`;
  const serialised = JSON.stringify(data, null, 2);
  fs.writeFileSync(tmpPath, serialised, "utf8");
  fs.renameSync(tmpPath, filePath);
}

/** Ensure the data directory exists. Called once at module load. */
function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

ensureDataDir();

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the next integer in a strictly-increasing sequence, starting at 1.
 *
 * CONCURRENCY-SAFE: the entire read → increment → write sequence is
 * synchronous, so no two concurrent requests can observe the same value.
 * See the module-level comment for a full explanation.
 *
 * @returns {number} The next sequence number.
 */
export function getNextApplicationNumber() {
  // SYNCHRONOUS read — blocks the event loop until done.
  const counter = readJson(COUNTER_PATH, { sequence: 0 });
  const next = counter.sequence + 1;

  // SYNCHRONOUS write (via atomic rename) — completes before any other
  // JS code can run, so no concurrent request can read the same value.
  writeJsonAtomic(COUNTER_PATH, { sequence: next });

  return next;
}

/**
 * Persists a new record to disk.
 *
 * Assigns a unique `id` and `createdAt` timestamp if not already present.
 * Throws DuplicateApplicationNumberError if a record with the same
 * `applicationNumber` already exists — defense-in-depth against duplicates.
 *
 * @param {object} data - The form data to persist.
 * @returns {object} The saved record (with id and createdAt).
 * @throws {DuplicateApplicationNumberError}
 */
export function saveRecord(data) {
  // SYNCHRONOUS read of entire records file.
  const records = readJson(RECORDS_PATH, []);

  // Defense-in-depth: reject if this application number already exists.
  const alreadyExists = records.some(
    (r) => r.applicationNumber === data.applicationNumber
  );
  if (alreadyExists) {
    throw new DuplicateApplicationNumberError(data.applicationNumber);
  }

  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  };

  records.push(record);

  // SYNCHRONOUS atomic write — the array is complete before the response
  // is sent and before any other request's code runs.
  writeJsonAtomic(RECORDS_PATH, records);

  return record;
}

/**
 * Returns all saved records, most-recent first.
 * @returns {object[]}
 */
export function getAllRecords() {
  const records = readJson(RECORDS_PATH, []);
  // Sort descending by createdAt
  return [...records].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * Returns a single record by its id, or null if not found.
 * @param {string} id
 * @returns {object|null}
 */
export function getRecordById(id) {
  const records = readJson(RECORDS_PATH, []);
  return records.find((r) => r.id === id) ?? null;
}

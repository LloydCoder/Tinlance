import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

const BLOB_API = "https://blob.vercel-storage.com";
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED: Record<string, { extensions: string[]; magic: (bytes: Uint8Array) => boolean }> = {
  "application/pdf": { extensions: [".pdf"], magic: (b) => b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d },
  "image/png": { extensions: [".png"], magic: (b) => b.length >= 8 && b.slice(0, 8).every((v, i) => v === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][i]) },
  "image/jpeg": { extensions: [".jpg", ".jpeg"], magic: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "text/plain": { extensions: [".txt", ".log", ".md", ".diff", ".patch"], magic: (b) => !b.includes(0) },
  "text/csv": { extensions: [".csv"], magic: (b) => !b.includes(0) },
  "application/json": { extensions: [".json"], magic: (b) => !b.includes(0) },
};

export function maxUploadBytes() { return MAX_UPLOAD_BYTES; }

function token() {
  const value = process.env.BLOB_READ_WRITE_TOKEN;
  if (!value) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  return value;
}

function extension(name: string) {
  const lower = name.toLowerCase();
  const index = lower.lastIndexOf(".");
  return index >= 0 ? lower.slice(index) : "";
}

export function validateEvidenceFile(file: File) {
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new Error("file_size_not_allowed");
  const rule = ALLOWED[file.type];
  if (!rule || !rule.extensions.includes(extension(file.name))) throw new Error("file_type_not_allowed");
}

export async function validateMagicBytes(file: File) {
  const rule = ALLOWED[file.type];
  if (!rule) throw new Error("file_type_not_allowed");
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!rule.magic(bytes)) throw new Error("file_content_mismatch");
}

export function sha256(buffer: ArrayBuffer) {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

/**
 * Reads private evidence into a bounded buffer and verifies it against the
 * immutable upload manifest before any bytes can be returned to a caller.
 */
export async function readVerifiedPrivateEvidence(
  response: Response,
  expectedSize: bigint,
  expectedHash: string,
): Promise<ArrayBuffer> {
  if (expectedSize <= 0n || expectedSize > BigInt(MAX_UPLOAD_BYTES)) {
    throw new Error("evidence_size_invalid");
  }
  if (!/^[a-f0-9]{64}$/i.test(expectedHash)) {
    throw new Error("evidence_manifest_invalid");
  }
  if (!response.ok || !response.body) {
    throw new Error("evidence_unavailable");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_UPLOAD_BYTES || BigInt(total) > expectedSize) {
        await reader.cancel().catch(() => undefined);
        throw new Error("evidence_size_mismatch");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (BigInt(total) !== expectedSize) {
    throw new Error("evidence_size_mismatch");
  }

  const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
  const actualHash = Buffer.from(createHash("sha256").update(bytes).digest("hex"), "hex");
  const manifestHash = Buffer.from(expectedHash.toLowerCase(), "hex");
  if (actualHash.length !== manifestHash.length || !timingSafeEqual(actualHash, manifestHash)) {
    throw new Error("evidence_integrity_mismatch");
  }

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export async function putPrivateEvidence(input: { organizationId: string; projectId: string; file: File }) {
  validateEvidenceFile(input.file);
  await validateMagicBytes(input.file);
  const bytes = await input.file.arrayBuffer();
  const hash = sha256(bytes);
  const pathname = `evidence/${input.organizationId}/${input.projectId}/${randomUUID()}`;
  const response = await fetch(`${BLOB_API}/${pathname}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token()}`,
      access: "private",
      "x-api-version": "7",
      "x-content-type": input.file.type,
      "x-cache-control-max-age": "60",
    },
    body: Buffer.from(bytes),
  });
  if (!response.ok) throw new Error(`blob_upload_failed:${response.status}`);
  const blob = (await response.json()) as { url: string; pathname: string; downloadUrl?: string; etag?: string };
  return { ...blob, hash, size: input.file.size, mimeType: input.file.type };
}

export function isTrustedPrivateBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && /^[a-z0-9][a-z0-9-]*\\.private\\.blob\\.vercel-storage\\.com$/i.test(url.hostname)
      && !url.username
      && !url.password
      && !url.port
      && !url.search
      && !url.hash
      && url.pathname.length > 1;
  } catch {
    return false;
  }
}

export async function getPrivateEvidence(storageReference: string) {
  if (!isTrustedPrivateBlobUrl(storageReference)) throw new Error("invalid_storage_reference");
  const response = await fetch(storageReference, { headers: { authorization: `Bearer ${token()}` }, cache: "no-store" });
  if (!response.ok) return null;
  return response;
}

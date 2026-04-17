/**
 * Reusable hook that encapsulates the two-step secure upload flow:
 *   1. Ask the backend for a pre-signed PUT URL + storage key.
 *   2. PUT the file directly to S3 — no credentials reach the browser.
 *
 * Returns the storage key on success (store this, never the URL).
 * To display the image later, call api.getSignedUrl(key).
 */
import { api } from '@/lib/api';

export type UploadFolder = 'products' | 'categories' | 'avatars';

const MAX_FILE_SIZE = 250 * 1024; // 250 KB — must match backend

export async function uploadToS3(file: File, folder: UploadFolder): Promise<string> {
  // Client-side guard — avoids a round-trip when the file is already too large.
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must not exceed ${MAX_FILE_SIZE / 1024} KB`);
  }

  // Step 1 — get signed PUT URL + key from our backend.
  const presign = await api.requestUploadUrl(folder, file.name, file.type, file.size);
  if (!presign.success || !presign.data) {
    throw new Error(presign.error ?? 'Failed to get upload URL');
  }

  const { uploadUrl, key } = presign.data;

  // Step 2 — upload directly to S3; backend never touches the bytes.
  await api.uploadFileToS3(uploadUrl, file);

  // Return the key — this is what gets stored in the database.
  return key;
}

/**
 * Upload multiple files concurrently and return their keys in order.
 */
export async function uploadManyToS3(files: File[], folder: UploadFolder): Promise<string[]> {
  return Promise.all(files.map((f) => uploadToS3(f, folder)));
}

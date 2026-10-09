import "server-only";

/**
 * Finds the Vercel Blob token. The default name is BLOB_READ_WRITE_TOKEN, but a store connected with a custom
 * prefix gets a name like MYSTORE_READ_WRITE_TOKEN, so any variable ending in READ_WRITE_TOKEN works.
 */
export function blobToken(): string | undefined {
  const direct = process.env.BLOB_READ_WRITE_TOKEN;
  if (direct) return direct;
  const key = Object.keys(process.env).find(k => k.endsWith("READ_WRITE_TOKEN") && process.env[k]);
  return key ? process.env[key] : undefined;
}

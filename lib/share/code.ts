/** Limits for links from strangers: a few KB in the URL, never a decompression bomb. */
const MAX_CODE_LENGTH = 8_000;
const MAX_TEXT_BYTES = 32_000;

/**
 * Packs text into a URL-safe code (deflated, base64url), so a link carries its own content without
 * any server storage. Share links put one value per line, which compresses well.
 */
export async function packText(text: string): Promise<string> {
  return toBase64Url(await transform(new TextEncoder().encode(text), new CompressionStream("deflate-raw")));
}

/** The text in `code`, or null for anything that is not a valid code. */
export async function unpackText(code: string): Promise<string | null> {
  if (!code || code.length > MAX_CODE_LENGTH || !/^[\w-]+$/.test(code)) return null;
  try {
    return new TextDecoder().decode(await transform(fromBase64Url(code), new DecompressionStream("deflate-raw"), MAX_TEXT_BYTES));
  } catch {
    return null;
  }
}

/** Runs `input` through a (de)compression stream, giving up once the output exceeds `maxBytes`. */
async function transform(input: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream, maxBytes = Infinity) {
  const reader = new Blob([input]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("Shared content is too large");
    }
    chunks.push(value);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(code.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
}

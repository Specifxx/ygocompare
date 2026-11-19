// A product photo for a share image (the Hot 100's, src/app/hot-100/opengraph-image.tsx): fetched when the image is drawn,
// with a timeout, and kept only as PNG or JPEG, the formats next/og draws. Anything else is null and the image draws a
// plain tile instead, so a slow or missing photo never fails the image.
/** A product photo as a data URI, or null (timeout, error, or a format the renderer cannot draw). */
export async function ogPhoto(url: string | null | undefined): Promise<string | null> {
  if (!url || !/^https:\/\//.test(url)) return null;
  try {
    const res = await fetch(url, { headers: { accept: "image/png,image/jpeg;q=0.9" }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (type !== "image/png" && type !== "image/jpeg") return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length && buf.length < 1_500_000 ? `data:${type};base64,${buf.toString("base64")}` : null;
  } catch {
    return null;
  }
}


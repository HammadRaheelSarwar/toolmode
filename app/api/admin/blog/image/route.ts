import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin, writeAdminAudit } from "../../../../../lib/admin.server";

const types: Record<string, { extension: string; matches: (bytes: Uint8Array) => boolean }> = {
  "image/jpeg": { extension: "jpg", matches: bytes => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", matches: bytes => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  "image/webp": { extension: "webp", matches: bytes => bytes.slice(0,4).reduce((text, byte) => text + String.fromCharCode(byte), "") === "RIFF" && bytes.slice(8,12).reduce((text, byte) => text + String.fromCharCode(byte), "") === "WEBP" }
};

export async function POST(request: Request) {
  const access = await requireAdmin(["admin", "super_admin", "content_manager"]);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 4 * 1024 * 1024 + 256 * 1024) return NextResponse.json({ error: "Image upload request is too large." }, { status: 413 });
  const form = await request.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a featured image." }, { status: 400 });
  if (file.size < 1 || file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Featured images must be 4 MB or smaller." }, { status: 413 });
  const mime = file.type.split(";")[0].toLowerCase(); const descriptor = types[mime];
  if (!descriptor) return NextResponse.json({ error: "Use a JPEG, PNG or WebP image." }, { status: 415 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!descriptor.matches(bytes)) return NextResponse.json({ error: "The image contents do not match the selected file type." }, { status: 415 });
  const path = `${new Date().getUTCFullYear()}/${randomUUID()}.${descriptor.extension}`;
  const { error } = await access.admin.storage.from("blog-media").upload(path, bytes, { contentType: mime, upsert: false });
  if (error) return NextResponse.json({ error: "Could not upload the featured image. Apply the Phase 6 migration." }, { status: 503 });
  const { data } = access.admin.storage.from("blog-media").getPublicUrl(path);
  const audit = await writeAdminAudit(access.admin, access.user.id, "blog.image_uploaded", "blog_image", path, { mime, sizeBytes: file.size });
  if (audit.error) return NextResponse.json({ error: "Image uploaded, but the audit entry failed." }, { status: 500 });
  return NextResponse.json({ url: data.publicUrl });
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const imageFile = form.get("image");
    const blurStr = (form.get("blur") as string) || "10";
    const blur = Math.min(40, Math.max(2, Number(blurStr) || 10));

    if (!(imageFile instanceof File)) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, and WebP images are supported." }, { status: 400 });
    }
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 10 MB or smaller." }, { status: 400 });
    }

    const removeBgKey = process.env.REMOVE_BG_API_KEY;
    const clipdropKey = process.env.CLIPDROP_API_KEY;

    if (!removeBgKey && !clipdropKey) {
      return NextResponse.json(
        { error: "Background blur requires an API key for subject detection. Configure REMOVE_BG_API_KEY or CLIPDROP_API_KEY in your environment variables." },
        { status: 503 }
      );
    }

    const apiForm = new FormData();
    apiForm.append("image_file", imageFile);

    let maskBuffer: Buffer;
    if (removeBgKey) {
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": removeBgKey },
        body: apiForm,
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return NextResponse.json({ error: `Subject detection failed: ${errorText}` }, { status: 502 });
      }
      maskBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      const response = await fetch("https://clipdrop-api.co/remove-background/v1", {
        method: "POST",
        headers: { "x-api-key": clipdropKey! },
        body: apiForm,
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        return NextResponse.json({ error: `Subject detection failed: ${errorText}` }, { status: 502 });
      }
      maskBuffer = Buffer.from(await response.arrayBuffer());
    }

    // Return foreground mask PNG + blur param header; client composites
    return new NextResponse(new Uint8Array(maskBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "X-Blur-Intensity": String(blur),
        "Content-Disposition": `attachment; filename="bg-mask.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[background-blur]", error);
    return NextResponse.json({ error: "Background blur failed. Please try again." }, { status: 500 });
  }
}

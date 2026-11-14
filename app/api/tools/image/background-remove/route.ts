import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const imageFile = form.get("image");
    const bgMode = (form.get("bgMode") as string) || "transparent";
    const bgColor = (form.get("bgColor") as string) || "#ffffff";

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
        { error: "Background removal requires an API key. Configure REMOVE_BG_API_KEY or CLIPDROP_API_KEY in your environment variables to enable this tool." },
        { status: 503 }
      );
    }

    let resultBuffer: Buffer;

    if (removeBgKey) {
      const apiForm = new FormData();
      apiForm.append("image_file", imageFile);
      apiForm.append("size", "auto");
      if (bgMode === "white") apiForm.append("bg_color", "ffffff");
      else if (bgMode === "black") apiForm.append("bg_color", "000000");
      else if (bgMode === "custom") apiForm.append("bg_color", bgColor.replace("#", ""));

      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": removeBgKey },
        body: apiForm,
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        if (response.status === 402) return NextResponse.json({ error: "Remove.bg API quota exceeded." }, { status: 503 });
        if (response.status === 403) return NextResponse.json({ error: "Remove.bg API key is invalid." }, { status: 503 });
        return NextResponse.json({ error: `Background removal service error: ${errorText}` }, { status: 502 });
      }
      resultBuffer = Buffer.from(await response.arrayBuffer());
    } else {
      const apiForm = new FormData();
      apiForm.append("image_file", imageFile);
      const response = await fetch("https://clipdrop-api.co/remove-background/v1", {
        method: "POST",
        headers: { "x-api-key": clipdropKey! },
        body: apiForm,
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        if (response.status === 402) return NextResponse.json({ error: "Clipdrop API quota exceeded." }, { status: 503 });
        if (response.status === 403) return NextResponse.json({ error: "Clipdrop API key is invalid." }, { status: 503 });
        return NextResponse.json({ error: `Background removal service error: ${errorText}` }, { status: 502 });
      }
      resultBuffer = Buffer.from(await response.arrayBuffer());
    }

    return new NextResponse(new Uint8Array(resultBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="background-removed.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[background-remove]", error);
    return NextResponse.json({ error: "Background removal failed. Please try again." }, { status: 500 });
  }
}

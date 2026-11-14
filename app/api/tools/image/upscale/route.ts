import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const form = await request.formData();
    const imageFile = form.get("image");
    const scale = (form.get("scale") as string) === "4" ? 4 : 2;

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

    const clipdropKey = process.env.CLIPDROP_API_KEY;
    const replicateKey = process.env.REPLICATE_API_KEY;

    if (!clipdropKey && !replicateKey) {
      return NextResponse.json(
        { error: "Image upscaling requires an API key. Configure CLIPDROP_API_KEY or REPLICATE_API_KEY in your environment variables to enable this tool." },
        { status: 503 }
      );
    }

    if (clipdropKey) {
      const apiForm = new FormData();
      apiForm.append("image_file", imageFile);
      // Clipdrop upscaling: target dimensions based on scale
      // We'll use a reasonable target; Clipdrop handles the actual upscale
      const response = await fetch("https://clipdrop-api.co/image-upscaling/v1/upscale", {
        method: "POST",
        headers: { "x-api-key": clipdropKey },
        body: apiForm,
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        if (response.status === 402) return NextResponse.json({ error: "Clipdrop API quota exceeded." }, { status: 503 });
        if (response.status === 403) return NextResponse.json({ error: "Clipdrop API key is invalid." }, { status: 503 });
        return NextResponse.json({ error: `Upscaling service error: ${errorText}` }, { status: 502 });
      }
      const resultBuffer = Buffer.from(await response.arrayBuffer());
      const resultMime = response.headers.get("content-type") || "image/png";
      return new NextResponse(new Uint8Array(resultBuffer), {
        status: 200,
        headers: {
          "Content-Type": resultMime,
          "Content-Disposition": `attachment; filename="upscaled-image.png"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // Replicate Real-ESRGAN
    const imageBytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(imageBytes).toString("base64");
    const dataUri = `data:${imageFile.type};base64,${base64}`;

    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${replicateKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        input: { image: dataUri, scale, face_enhance: false },
      }),
    });
    if (!startResponse.ok) {
      return NextResponse.json({ error: "Could not start upscaling job. Check your Replicate API key." }, { status: 502 });
    }
    const prediction = await startResponse.json() as { id: string; status: string; output?: string; error?: string };

    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise<void>(resolve => setTimeout(resolve, 3000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Bearer ${replicateKey}` },
      });
      const result = await pollResponse.json() as { status: string; output?: string; error?: string };
      if (result.status === "succeeded" && result.output) {
        const imageResponse = await fetch(result.output);
        const resultBuffer = Buffer.from(await imageResponse.arrayBuffer());
        return new NextResponse(new Uint8Array(resultBuffer), {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="upscaled-image.png"`,
            "Cache-Control": "no-store",
          },
        });
      }
      if (result.status === "failed") {
        return NextResponse.json({ error: result.error || "Upscaling failed on the AI server." }, { status: 502 });
      }
    }
    return NextResponse.json({ error: "Upscaling timed out. Please try a smaller image." }, { status: 504 });
  } catch (error) {
    console.error("[upscale]", error);
    return NextResponse.json({ error: "Image upscaling failed. Please try again." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voice = "af_bella", speed = 1.0, gain = 1.0, lang = "en-us" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ success: false, error: "Text prompt is required" }, { status: 400 });
    }

    const ttsBaseUrl = process.env.TTS_BASE_URL || "http://77.54.200.11:15137";
    const gpuApiKey = process.env.GPU_API_KEY || "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF";

    const targetUrl = ttsBaseUrl.endsWith("/synthesize") ? ttsBaseUrl : `${ttsBaseUrl.replace(/\/+$/, "")}/synthesize`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const gpuRes = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": gpuApiKey,
        "Authorization": `Bearer ${gpuApiKey}`,
      },
      body: JSON.stringify({
        text,
        voice,
        speed: speed || 1.0,
        gain: gain || 1.0,
        lang: lang || "en-us",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!gpuRes.ok) {
      const errText = await gpuRes.text().catch(() => "");
      console.error(`[TTS Proxy Error] HTTP ${gpuRes.status}: ${errText}`);
      return NextResponse.json(
        { success: false, error: `GPU TTS Error: HTTP ${gpuRes.status}` },
        { status: gpuRes.status }
      );
    }

    const audioArrayBuffer = await gpuRes.arrayBuffer();

    return new NextResponse(audioArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioArrayBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[TTS Proxy Exception]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "GPU TTS server unreachable" },
      { status: 502 }
    );
  }
}

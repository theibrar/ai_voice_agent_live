import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const t0 = performance.now();
  try {
    const body = await req.json();
    const {
      engineId = "",
      baseUrl = "",
      apiKey = "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF",
      category = "llm",
    } = body;

    if (!baseUrl) {
      return NextResponse.json({ online: false, latencyMs: 0, message: "No endpoint URL configured" }, { status: 400 });
    }

    const cleanBase = baseUrl.replace(/\/+$/, "");
    let probeUrl = cleanBase;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
    };

    if (category === "llm" || engineId === "eng-vllm-qwen") {
      probeUrl = cleanBase.endsWith("/v1") ? `${cleanBase}/models` : `${cleanBase}/v1/models`;
    } else if (cleanBase.includes("59835") || engineId === "eng-prosody-testbench") {
      probeUrl = `${cleanBase}/`;
    } else {
      probeUrl = `${cleanBase}/health`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(probeUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    const latencyMs = Math.max(1, Math.round(performance.now() - t0));

    if (res.ok || res.status === 200 || res.status === 401) {
      // If 200 OK (or reachable endpoint)
      return NextResponse.json({
        online: true,
        latencyMs,
        message: `Online • ${latencyMs}ms live latency (HTTP ${res.status})`,
      });
    } else {
      return NextResponse.json({
        online: false,
        latencyMs,
        message: `HTTP ${res.status}`,
      });
    }
  } catch (err: any) {
    const latencyMs = Math.max(1, Math.round(performance.now() - t0));
    return NextResponse.json({
      online: false,
      latencyMs,
      message: err.name === "AbortError" ? "Connection Timed Out" : err.message || "Failed to reach endpoint",
    });
  }
}

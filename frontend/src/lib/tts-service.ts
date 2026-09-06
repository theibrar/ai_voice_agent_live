/**
 * Real-Time Kokoro-82M Neural Audio Synthesis Client
 * Exclusively connects to the GPU worker cluster at 77.54.200.11:15137.
 * Local browser speech synthesis is STRICTLY DISABLED.
 */

let activeAudioElement: HTMLAudioElement | null = null;

export interface TTSResult {
  success: boolean;
  error?: string;
  latencyMs?: number;
  audioBlob?: Blob;
}

export async function playKokoroNeuralAudio(
  text: string,
  voice: string = "af_bella",
  speed: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void
): Promise<TTSResult> {
  if (typeof window === "undefined") {
    return { success: false, error: "Window context unavailable" };
  }

  // Stop any currently playing audio stream
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }

  const startTime = Date.now();

  const endpoints = [
    "/api/v1/tts/synthesize",
    "/api/tts/synthesize",
    "http://77.54.200.11:15137/synthesize",
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF",
          "Authorization": "Bearer IbraSoft-GPUZvrMmfSn3ePVE9spRQ2hi751fGSXq5sFpovfUl7XOggbMRRHee8zRk4SWV7YBSUF",
        },
        body: JSON.stringify({
          text,
          voice,
          speed: speed || 1.0,
          gain: 1.0,
          lang: "en-us",
        }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        activeAudioElement = audio;

        audio.onplay = () => {
          if (onStart) onStart();
        };
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          activeAudioElement = null;
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          activeAudioElement = null;
          if (onEnd) onEnd();
        };

        await audio.play();
        return {
          success: true,
          audioBlob,
          latencyMs: Date.now() - startTime,
        };
      }
    } catch {
      // Try next endpoint
    }
  }

  // If GPU server is offline, DO NOT PLAY BROWSER SPEECH. Report error immediately.
  if (onEnd) onEnd();

  return {
    success: false,
    error: "GPU Neural TTS Server (77.54.200.11) is unreachable or offline.",
  };
}

export function stopNeuralAudio() {
  if (typeof window === "undefined") return;
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
}

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F172A",
          borderRadius: 8,
          border: "1.5px solid #3157D5",
          padding: 4,
          gap: 2,
        }}
      >
        <div style={{ width: 3, height: 10, background: "#38BDF8", borderRadius: 2 }} />
        <div style={{ width: 3, height: 16, background: "#3157D5", borderRadius: 2 }} />
        <div style={{ width: 3, height: 22, background: "#FFFFFF", borderRadius: 2 }} />
        <div style={{ width: 3, height: 14, background: "#F59E0B", borderRadius: 2 }} />
        <div style={{ width: 3, height: 8, background: "#D99025", borderRadius: 2 }} />
      </div>
    ),
    { ...size }
  );
}

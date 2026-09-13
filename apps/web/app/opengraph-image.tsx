import { ImageResponse } from "next/og";

export const alt = "Tinlance — AI Engineering and Forward-Deployed Engineering";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#090c0b",
          color: "#ffffff",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: 30, fontWeight: 800 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "#c9ff4d", color: "#0a0d0b" }}>T</div>
          Tinlance
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: 950 }}>
          <div style={{ color: "#c9ff4d", fontSize: 22, fontWeight: 700, letterSpacing: "0.16em" }}>AI ENGINEERING / FDE / SECURITY</div>
          <div style={{ fontSize: 72, lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.055em" }}>Make AI work inside the business.</div>
          <div style={{ color: "#aab2ac", fontSize: 28 }}>Production-oriented engineering, governed workflows, security, evaluation and evidence.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#7f8982", fontSize: 18 }}>
          <span>tinlance.com</span>
          <span>Evidence before claims.</span>
        </div>
      </div>
    ),
    size,
  );
}

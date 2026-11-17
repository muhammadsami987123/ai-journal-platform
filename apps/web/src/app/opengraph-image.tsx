import { ImageResponse } from "next/og";

export const alt = "AI Journal — write a little, understand a lot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#faf8f5",
          padding: "72px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 8,
              backgroundColor: "#f7e8df",
              border: "1px solid #e8cdbd",
              color: "#a94f2a",
              fontSize: 28,
              fontWeight: 700
            }}
          >
            J
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#1f1b16", fontWeight: 600 }}>
            AI Journal
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#1f1b16",
              maxWidth: 900
            }}
          >
            Write a little. Understand a lot.
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#57514a", maxWidth: 820 }}>
            A private daily journal with guided questions, moods and voice — plus an assistant that
            drafts, never rewrites.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 20, color: "#857c72" }}>
          <div style={{ display: "flex" }}>Your original words stay untouched</div>
          <div style={{ display: "flex", color: "#d5cabc" }}>•</div>
          <div style={{ display: "flex" }}>Nothing applies without approval</div>
          <div style={{ display: "flex", color: "#d5cabc" }}>•</div>
          <div style={{ display: "flex" }}>Export or delete any time</div>
        </div>
      </div>
    ),
    size
  );
}

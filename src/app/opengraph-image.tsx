import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0a0908",
          color: "#fbfffe",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 0,
            background: "#faa916",
            right: 80,
            top: 70,
            transform: "rotate(12deg)"
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 330,
            height: 180,
            border: "18px solid #96031a",
            right: 210,
            bottom: 92,
            transform: "rotate(-9deg)"
          }}
        />
        <div style={{ display: "flex", fontSize: 34, color: "#faa916" }}>Playful software engineering</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 112, lineHeight: 0.92, fontWeight: 900 }}>Girwan Dhakal</div>
          <div style={{ fontSize: 36, maxWidth: 760, marginTop: 28, color: "#fbfffe" }}>
            Fast, polished web experiences with product sense and front-end craft.
          </div>
        </div>
      </div>
    ),
    size
  );
}

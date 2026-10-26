import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "LearnSphere LMS - Intelligent Academic Cloud Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#030712",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1e1b4b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #0f172a 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Glow circles */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "20%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px rgba(236, 72, 153, 0.4)",
            }}
          >
            <div style={{ color: "#ffffff", fontSize: "26px", fontWeight: "bold" }}>âš¡</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
              LearnSphere <span style={{ color: "#ec4899" }}>LMS</span>
            </span>
            <span style={{ fontSize: "14px", color: "#9ca3af", letterSpacing: "1px", textTransform: "uppercase" }}>
              Academic Cloud Platform
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "950px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(236, 72, 153, 0.12)",
              border: "1px solid rgba(236, 72, 153, 0.3)",
              borderRadius: "9999px",
              padding: "6px 16px",
              color: "#f472b6",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            â˜… NEXT-GENERATION CLOUD EDUCATION SYSTEM
          </div>
          <div
            style={{
              fontSize: "54px",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.12,
              letterSpacing: "-1.5px",
            }}
          >
            The Intelligent Operating System for Modern Academies
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#9ca3af",
              lineHeight: 1.4,
            }}
          >
            Automated grading ledgers, WebRTC virtual classrooms, institutional identity management, and cloud course tracking.
          </div>
        </div>

        {/* Feature Badges */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            "âš¡ Automated GPA Ledger",
            "ðŸ“¹ WebRTC Video Halls",
            "ðŸ›¡ï¸ Enterprise RBAC",
            "âœ¨ Real-time Quizzes",
          ].map((tag, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "rgba(17, 24, 39, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "10px 18px",
                color: "#e5e7eb",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

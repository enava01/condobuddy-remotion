import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

// ─── Design tokens ───────────────────────────────────────────────────────────
const DARK = "#050505";
const LIGHT = "#f5f5f7";
const GRAY = "#6e6e73";
const WA_GREEN = "#25D366";
const BLUE = "#0071e3";
const FONT = fontFamily;

// ─── Scene durations ─────────────────────────────────────────────────────────
export const SCENE_DURATIONS = {
  problem: 150,
  whatsapp: 180,
  kiosk: 165,
  dashboard: 165,
  benefits: 120,
};
export const TRANSITION_FRAMES = 18;
export const CONDO_TOTAL_FRAMES =
  SCENE_DURATIONS.problem +
  SCENE_DURATIONS.whatsapp +
  SCENE_DURATIONS.kiosk +
  SCENE_DURATIONS.dashboard +
  SCENE_DURATIONS.benefits -
  4 * TRANSITION_FRAMES; // 708 frames ≈ 23.6s at 30fps

// ─── Helpers ─────────────────────────────────────────────────────────────────
function useFadeUp(delay = 0): { opacity: number; translateY: number } {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    translateY: interpolate(progress, [0, 1], [28, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
}

function useScaleIn(delay = 0): { opacity: number; scale: number } {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });
  return {
    opacity: interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    scale: interpolate(progress, [0, 1], [0.9, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
}

// ─── Scene 1: El Problema ─────────────────────────────────────────────────────
const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headline = useFadeUp(0);
  const sub = useFadeUp(10);

  const cards = [
    { label: "Esperas largas", detail: "15–30 min por visita" },
    { label: "Registros manuales", detail: "Sin historial digital" },
    { label: "Intercomunicadores", detail: "Sin respuesta" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* Ambient purple glow */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 500,
          background:
            "radial-gradient(ellipse, rgba(120,60,220,0.14) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Headline */}
      <div
        style={{
          opacity: headline.opacity,
          transform: `translateY(${headline.translateY}px)`,
          fontSize: 96,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: -4,
          textAlign: "center",
          lineHeight: 1,
          marginBottom: 8,
          position: "relative",
        }}
      >
        Sin control.
      </div>

      {/* Subheadline */}
      <div
        style={{
          opacity: sub.opacity,
          transform: `translateY(${sub.translateY}px)`,
          fontSize: 40,
          fontWeight: 300,
          color: GRAY,
          letterSpacing: -1,
          textAlign: "center",
          marginBottom: 80,
          position: "relative",
        }}
      >
        La gestión residencial, rota.
      </div>

      {/* Problem cards */}
      <div style={{ display: "flex", gap: 24, position: "relative" }}>
        {cards.map((c, i) => {
          const p = spring({
            frame: frame - (20 + i * 12),
            fps,
            config: { damping: 200 },
          });
          const opacity = interpolate(p, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateY = interpolate(p, [0, 1], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 20,
                padding: "28px 40px",
                textAlign: "center",
                minWidth: 280,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#ffffff",
                  marginBottom: 8,
                  letterSpacing: -0.5,
                }}
              >
                {c.label}
              </div>
              <div style={{ fontSize: 18, color: GRAY, fontWeight: 400 }}>
                {c.detail}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: WhatsApp Approval ───────────────────────────────────────────────
const SceneWhatsApp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phone = useScaleIn(0);
  const text = useFadeUp(8);
  const msg1 = useFadeUp(15);
  const msg2 = useFadeUp(30);

  // Confirmation bubble pops in at frame 95
  const confirmP = spring({
    frame: frame - 95,
    fps,
    config: { damping: 14, stiffness: 200 },
  });
  const confirmOpacity = interpolate(confirmP, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const confirmScale = interpolate(confirmP, [0, 1], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: LIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        gap: 100,
        overflow: "hidden",
      }}
    >
      {/* Phone mockup */}
      <div
        style={{
          transform: `scale(${phone.scale})`,
          opacity: phone.opacity,
          width: 300,
          height: 580,
          background: "#111",
          borderRadius: 48,
          boxShadow:
            "0 50px 120px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.25)",
          border: "11px solid #222",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Dynamic island */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 100,
            height: 26,
            background: "#000",
            borderRadius: 14,
            zIndex: 20,
          }}
        />

        {/* WhatsApp header */}
        <div
          style={{
            background: "#075E54",
            paddingTop: 44,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#1e8069",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            🏢
          </div>
          <div>
            <div
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              CondoBuddy
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
              en línea
            </div>
          </div>
        </div>

        {/* Chat body */}
        <div
          style={{
            background: "#ECE5DD",
            height: "100%",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingTop: 14,
          }}
        >
          {/* Notification bubble */}
          <div
            style={{
              opacity: msg1.opacity,
              transform: `translateY(${msg1.translateY}px)`,
              alignSelf: "flex-start",
              background: "#fff",
              borderRadius: "14px 14px 14px 3px",
              padding: "10px 14px",
              maxWidth: "88%",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#1d1d1f",
                marginBottom: 4,
                lineHeight: 1.4,
              }}
            >
              🔔 Tienes una visita
            </div>
            <div
              style={{ fontSize: 14, fontWeight: 700, color: "#075E54" }}
            >
              Ricardo García
            </div>
            <div style={{ fontSize: 12, color: "#667781", marginTop: 2 }}>
              Quiere ingresar ahora
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#94a3b8",
                textAlign: "right",
                marginTop: 4,
              }}
            >
              14:32 ✓✓
            </div>
          </div>

          {/* Action buttons bubble */}
          <div
            style={{
              opacity: msg2.opacity,
              transform: `translateY(${msg2.translateY}px)`,
              alignSelf: "flex-start",
              background: "#fff",
              borderRadius: "14px 14px 14px 3px",
              padding: "10px 14px",
              maxWidth: "88%",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, color: "#444" }}>
              ¿Permites el acceso?
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div
                style={{
                  background: WA_GREEN,
                  color: "#fff",
                  borderRadius: 8,
                  padding: "7px 0",
                  fontSize: 12,
                  fontWeight: 700,
                  flex: 1,
                  textAlign: "center",
                }}
              >
                ✓ Aprobar
              </div>
              <div
                style={{
                  background: "#ff3b30",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "7px 0",
                  fontSize: 12,
                  fontWeight: 700,
                  flex: 1,
                  textAlign: "center",
                }}
              >
                ✗ Rechazar
              </div>
            </div>
          </div>

          {/* Confirmation (resident reply) */}
          <div
            style={{
              opacity: confirmOpacity,
              transform: `scale(${confirmScale})`,
              transformOrigin: "bottom right",
              alignSelf: "flex-end",
              background: WA_GREEN,
              borderRadius: "14px 14px 3px 14px",
              padding: "10px 16px",
              maxWidth: "75%",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}
            >
              ✅ Acceso aprobado
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.75)",
                marginTop: 3,
                textAlign: "right",
              }}
            >
              14:32 ✓✓
            </div>
          </div>
        </div>
      </div>

      {/* Right: copy */}
      <div
        style={{
          opacity: text.opacity,
          transform: `translateY(${text.translateY}px)`,
          maxWidth: 480,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#1d1d1f",
            letterSpacing: -3,
            lineHeight: 1.04,
            marginBottom: 24,
          }}
        >
          Un tap.
          <br />
          Aprobado.
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: GRAY,
            lineHeight: 1.55,
            letterSpacing: -0.3,
          }}
        >
          Por WhatsApp.
          <br />
          Sin apps. Sin fricción.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Guard Kiosk / QR Scan ──────────────────────────────────────────
const QRCode: React.FC = () => {
  // 11×11 simplified QR-like grid
  const SIZE = 11;
  const CELL = 14;
  // Finder patterns corners
  const isFinderTL = (r: number, c: number) => r < 7 && c < 7;
  const isFinderTR = (r: number, c: number) => r < 7 && c >= SIZE - 7;
  const isFinderBL = (r: number, c: number) => r >= SIZE - 7 && c < 7;

  const finderBorder = (r: number, c: number, maxR: number, maxC: number) => {
    const minR = 0,
      minC = 0;
    return (
      r === minR || r === maxR || c === minC || c === maxC
    );
  };

  const isDark = (r: number, c: number): boolean => {
    if (isFinderTL(r, c)) {
      if (finderBorder(r, c, 6, 6)) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    if (isFinderTR(r, c)) {
      const lc = c - (SIZE - 7);
      if (finderBorder(r, lc, 6, 6)) return true;
      if (r >= 2 && r <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    }
    if (isFinderBL(r, c)) {
      const lr = r - (SIZE - 7);
      if (finderBorder(lr, c, 6, 6)) return true;
      if (lr >= 2 && lr <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Timing strips
    if (r === 6 || c === 6) return (r + c) % 2 === 0;
    // Data modules (pseudo-random)
    return (r * 7 + c * 11 + r * c) % 3 === 0;
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${SIZE}, ${CELL}px)`,
        gridTemplateRows: `repeat(${SIZE}, ${CELL}px)`,
      }}
    >
      {Array.from({ length: SIZE * SIZE }).map((_, i) => {
        const r = Math.floor(i / SIZE);
        const c = i % SIZE;
        return (
          <div
            key={i}
            style={{
              width: CELL,
              height: CELL,
              background: isDark(r, c) ? "#000" : "transparent",
            }}
          />
        );
      })}
    </div>
  );
};

const SceneKiosk: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screen = useScaleIn(0);
  const text = useFadeUp(8);

  // Scan line sweeps from 20→90 frames
  const scanY = interpolate(frame, [20, 90], [0, 154], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanOpacity = interpolate(frame, [85, 95], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Success state
  const successP = spring({
    frame: frame - 98,
    fps,
    config: { damping: 14, stiffness: 180 },
  });
  const successScale = interpolate(successP, [0, 1], [0.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const successOpacity = interpolate(successP, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Parking badge
  const parkingP = useFadeUp(115);

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        gap: 100,
        overflow: "hidden",
      }}
    >
      {/* Green ambient glow */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "35%",
          width: 700,
          height: 500,
          background:
            "radial-gradient(ellipse, rgba(37,211,102,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Left: Kiosk screen */}
      <div
        style={{
          transform: `scale(${screen.scale})`,
          opacity: screen.opacity,
          width: 360,
          height: 480,
          background: "#0d0d0d",
          borderRadius: 24,
          border: "1.5px solid rgba(255,255,255,0.10)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 36,
          gap: 24,
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 12,
              color: GRAY,
              fontWeight: 600,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Control de Acceso
          </div>
          <div style={{ fontSize: 20, color: "#fff", fontWeight: 600 }}>
            Escanea tu código
          </div>
        </div>

        {/* QR container */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 16,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <QRCode />

          {/* Scan line */}
          <div
            style={{
              position: "absolute",
              top: 16 + scanY,
              left: 0,
              right: 0,
              height: 2,
              opacity: scanOpacity,
              background:
                "linear-gradient(90deg, transparent 0%, #25D366 20%, #25D366 80%, transparent 100%)",
              boxShadow: "0 0 10px rgba(37,211,102,0.9)",
            }}
          />

          {/* Success overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: successOpacity,
            }}
          >
            <div
              style={{
                transform: `scale(${successScale})`,
                fontSize: 56,
                lineHeight: 1,
              }}
            >
              ✅
            </div>
          </div>
        </div>

        {/* Status text */}
        <div
          style={{
            opacity: successOpacity,
            fontSize: 18,
            fontWeight: 700,
            color: WA_GREEN,
            textAlign: "center",
            letterSpacing: -0.3,
          }}
        >
          Acceso Autorizado
        </div>

        {/* Parking badge */}
        <div
          style={{
            opacity: parkingP.opacity,
            transform: `translateY(${parkingP.translateY}px)`,
            background: "rgba(0,113,227,0.14)",
            border: "1px solid rgba(0,113,227,0.28)",
            borderRadius: 14,
            padding: "12px 22px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>🚗</span>
          <div>
            <div
              style={{
                fontSize: 14,
                color: BLUE,
                fontWeight: 700,
                letterSpacing: -0.3,
              }}
            >
              Cajón P-07 asignado
            </div>
            <div style={{ fontSize: 12, color: GRAY }}>
              Estacionamiento norte
            </div>
          </div>
        </div>
      </div>

      {/* Right: copy */}
      <div
        style={{
          opacity: text.opacity,
          transform: `translateY(${text.translateY}px)`,
          maxWidth: 420,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: -3,
            lineHeight: 1.04,
            marginBottom: 24,
          }}
        >
          Sin apps.
          <br />
          Sin fricciones.
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: GRAY,
            lineHeight: 1.55,
            letterSpacing: -0.3,
          }}
        >
          El guardia escanea.
          <br />
          El sistema hace el resto.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: Admin Dashboard ─────────────────────────────────────────────────
const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const card = useScaleIn(0);
  const text = useFadeUp(5);

  const entries = [
    {
      dot: "#34c759",
      label: "Ricardo García — Acceso aprobado",
      time: "14:32",
    },
    {
      dot: BLUE,
      label: "Cajón P-07 asignado automáticamente",
      time: "14:33",
    },
    {
      dot: BLUE,
      label: "Paquete entregado — Torre B",
      time: "14:45",
    },
    {
      dot: "#34c759",
      label: "María López — Visita registrada",
      time: "15:02",
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: LIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        gap: 80,
        overflow: "hidden",
      }}
    >
      {/* Left: copy */}
      <div
        style={{
          opacity: text.opacity,
          transform: `translateY(${text.translateY}px)`,
          maxWidth: 420,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#1d1d1f",
            letterSpacing: -3,
            lineHeight: 1.04,
            marginBottom: 24,
          }}
        >
          Control total.
          <br />
          En tiempo real.
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: GRAY,
            lineHeight: 1.55,
            letterSpacing: -0.3,
          }}
        >
          Visibilidad completa
          <br />
          de cada movimiento.
        </div>
      </div>

      {/* Right: dashboard card */}
      <div
        style={{
          opacity: card.opacity,
          transform: `scale(${card.scale})`,
          width: 500,
          background: "#ffffff",
          borderRadius: 24,
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Card header */}
        <div
          style={{
            padding: "22px 28px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#34c759",
              boxShadow: "0 0 8px rgba(52,199,89,0.6)",
              flexShrink: 0,
            }}
          />
          <div
            style={{ fontSize: 17, fontWeight: 600, color: "#1d1d1f" }}
          >
            Actividad en tiempo real
          </div>
          <div
            style={{ marginLeft: "auto", fontSize: 14, color: GRAY }}
          >
            Hoy · {entries.length} eventos
          </div>
        </div>

        {/* Log rows */}
        {entries.map((e, i) => {
          const p = spring({
            frame: frame - (8 + i * 18),
            fps,
            config: { damping: 200 },
          });
          const opacity = interpolate(p, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateX = interpolate(p, [0, 1], [18, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateX(${translateX}px)`,
                padding: "18px 28px",
                borderBottom:
                  i < entries.length - 1
                    ? "1px solid rgba(0,0,0,0.04)"
                    : "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: e.dot,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#1d1d1f",
                }}
              >
                {e.label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: GRAY,
                  flexShrink: 0,
                }}
              >
                {e.time}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 5: Benefits ────────────────────────────────────────────────────────
const SceneBenefits: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logo = useFadeUp(0);
  const tagline = useFadeUp(55);

  const benefits = [
    { icon: "⚡️", label: "Acceso rápido" },
    { icon: "🛡", label: "Mayor seguridad" },
    { icon: "👁", label: "Visibilidad total" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* Blue orb left */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          left: "15%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,113,227,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Green orb right */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(37,211,102,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Wordmark */}
      <div
        style={{
          opacity: logo.opacity,
          transform: `translateY(${logo.translateY}px)`,
          textAlign: "center",
          marginBottom: 56,
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          CondoBuddy
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 300,
            color: GRAY,
            marginTop: 16,
            letterSpacing: -0.3,
          }}
        >
          El sistema operativo de tu comunidad.
        </div>
      </div>

      {/* Benefit pills */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 64,
          position: "relative",
        }}
      >
        {benefits.map((b, i) => {
          const p = spring({
            frame: frame - (15 + i * 12),
            fps,
            config: { damping: 200 },
          });
          const opacity = interpolate(p, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateY = interpolate(p, [0, 1], [30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.11)",
                borderRadius: 100,
                padding: "18px 36px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>{b.icon}</span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: -0.5,
                }}
              >
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Domain */}
      <div
        style={{
          opacity: tagline.opacity,
          transform: `translateY(${tagline.translateY}px)`,
          fontSize: 17,
          color: "rgba(255,255,255,0.3)",
          fontWeight: 400,
          letterSpacing: 1,
          position: "relative",
        }}
      >
        condobuddy.com
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ─────────────────────────────────────────────────────────
export const CondoBuddy: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.problem}
      >
        <SceneProblem />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.whatsapp}
      >
        <SceneWhatsApp />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.kiosk}
      >
        <SceneKiosk />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.dashboard}
      >
        <SceneDashboard />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
      />

      <TransitionSeries.Sequence
        durationInFrames={SCENE_DURATIONS.benefits}
      >
        <SceneBenefits />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

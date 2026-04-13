/**
 * CondoBuddyProduct — Unified visual system pass
 *
 * Design principles applied
 * ─────────────────────────────────────────────────────────────────
 *  • Consistent radius language   (R_SM / R_MD / R_LG)
 *  • Three-tier soft shadow system (SHADOW_SOFT / CARD / FLOAT)
 *  • Spacing scale via SP{}       (8 · 16 · 24 · 32 · 44 · 64 · 96)
 *  • Organic background (no grid noise, layered soft radial blobs)
 *  • Scene-aware accent tinting on backgrounds
 *  • Staggered spring-based entrances throughout
 *  • Consistent card inner highlight ring across all surfaces
 *  • Mascot treated as a card-system element, not a paste-on
 */

import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {loadFont} from "@remotion/google-fonts/Sora";

// ─── FONTS ───────────────────────────────────────────────────────────────────

const {fontFamily: SORA} = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
const DISPLAY_FONT = `"Sora", ${SORA}, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;
const BODY_FONT    = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif`;

// ─── ASSETS ──────────────────────────────────────────────────────────────────

const MOBILE    = staticFile("assets/mobile.mov");
const KIOSK     = staticFile("assets/kiosk.mov");
const ADMIN     = staticFile("assets/admin.mov");
const MASCOT    = staticFile("assets/mascot.mp4");
const VOICEOVER = staticFile("assets/voiceover_processed.mp3");
const MUSIC     = staticFile("assets/music.mp3");

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

// Colors
const BG       = "#FFFFFF";
const BG_SOFT  = "#F8FAFC";
const TEXT     = "#0F172A";
const TEXT_MID = "#475569";
const TEXT_LOW = "#94A3B8";
const BLUE     = "#3B82F6";
const PURPLE   = "#8B5CF6";
const TEAL     = "#14B8A6";
const BORDER   = "rgba(15,23,42,0.07)";

// Radius system — applied consistently to ALL card surfaces
const R_SM = 16;   // chips, pills
const R_MD = 24;   // role cards, character frames
const R_LG = 32;   // video cards, major surfaces

// Shadow system — three tiers, all low-contrast + large blur
const SHADOW_CARD = [
  "0 1px 3px rgba(15,23,42,0.03)",
  "0 6px 24px rgba(15,23,42,0.05)",
  "0 22px 60px rgba(15,23,42,0.07)",
].join(", ");

const SHADOW_FLOAT = [
  "0 2px 6px rgba(15,23,42,0.04)",
  "0 14px 36px rgba(15,23,42,0.07)",
  "0 40px 100px rgba(15,23,42,0.08)",
].join(", ");

// Spacing scale
const SP = {
  xs: 8, sm: 16, md: 24, base: 32, lg: 44, xl: 64, frame: 96,
} as const;

// Inner highlight ring — applied to all card surfaces for glass depth
const INNER_RING: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: R_LG,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
  border: "1px solid rgba(255,255,255,0.55)",
  pointerEvents: "none",
};

// ─── TIMING CONSTANTS ────────────────────────────────────────────────────────

const FPS                          = 30;
const AUDIO_DURATION_SECONDS       = 65.306063;
const AUDIO_TOTAL_FRAMES           = Math.ceil(AUDIO_DURATION_SECONDS * FPS);
const MASCOT_DURATION_SECONDS      = 8;
const MASCOT_TOTAL_FRAMES          = Math.round(MASCOT_DURATION_SECONDS * FPS);
const COLD_OPEN_DURATION           = Math.round(2.5 * FPS);
const HOOK_TEXT_DURATION           = Math.round(2.5 * FPS);
const COLD_OPEN_FRAMES             = COLD_OPEN_DURATION + HOOK_TEXT_DURATION;
const VOICEOVER_START_FRAME        = COLD_OPEN_FRAMES;
const TURNING_B_VISUAL_DELAY       = 6;
const MUSIC_FADE_IN_FRAMES         = 22;
const MUSIC_FADE_OUT_FRAMES        = 18;
const MUSIC_COLD_OPEN_VOLUME       = 0.1;
const MUSIC_UNDER_VO_VOLUME        = 0.046; // slight raise → continuous bed presence masks micro-transitions
const MUSIC_TRANSITION_VOLUME      = 0.068;
const MUSIC_FINAL_VOLUME           = 0.082;
const MUSIC_PAUSE_LIFT             = 0.024; // wider lift → audible bridge over voiceover edit points
const VOICEOVER_BASE_VOLUME        = 0.90;  // slight headroom → reduces clipping-adjacent perception
const MASCOT_AUDIO_COLD_OPEN_VOLUME   = 0.2;
const MASCOT_AUDIO_TRANSITION_VOLUME  = 0.06;
const MASCOT_AUDIO_FINAL_VOLUME       = 0.12;
const HAS_MASCOT_AUDIO             = true;

export const CONDO_PRODUCT_TOTAL_FRAMES = VOICEOVER_START_FRAME + AUDIO_TOTAL_FRAMES;

const TIMELINE = {
  coldOpen: {from: 0,                           to: VOICEOVER_START_FRAME},
  resident: {from: VOICEOVER_START_FRAME,       to: VOICEOVER_START_FRAME + 121},
  problem:  {from: VOICEOVER_START_FRAME + 121, to: VOICEOVER_START_FRAME + 327},
  people:   {from: VOICEOVER_START_FRAME + 327, to: VOICEOVER_START_FRAME + 579},
  turningA: {from: VOICEOVER_START_FRAME + 579, to: VOICEOVER_START_FRAME + 817 + TURNING_B_VISUAL_DELAY},
  turningB: {from: VOICEOVER_START_FRAME + 817 + TURNING_B_VISUAL_DELAY, to: VOICEOVER_START_FRAME + 1028},
  mobile:   {from: VOICEOVER_START_FRAME + 1028, to: VOICEOVER_START_FRAME + 1214},
  kiosk:    {from: VOICEOVER_START_FRAME + 1214, to: VOICEOVER_START_FRAME + 1424},
  admin:    {from: VOICEOVER_START_FRAME + 1424, to: VOICEOVER_START_FRAME + 1607},
  benefits: {from: VOICEOVER_START_FRAME + 1607, to: VOICEOVER_START_FRAME + 1835},
  final:    {from: VOICEOVER_START_FRAME + 1835, to: CONDO_PRODUCT_TOTAL_FRAMES},
} as const;

/**
 * All detected silence windows in the voiceover (threshold −24.93 dB, min 250 ms).
 * Each entry covers the FULL silence duration — onset to end — not just the tail.
 * Waveform-mapped via FFmpeg silencedetect on the actual audio file.
 *
 * Previous values only covered the last few frames of each pause, leaving
 * the majority of each silence without musical fill — causing perceived dead air.
 */
const MUSIC_LIFTS = [
  // ── Resident scene ─────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 66,  to: VOICEOVER_START_FRAME + 82},   // 2.205–2.715s (510ms)
  {from: VOICEOVER_START_FRAME + 107, to: VOICEOVER_START_FRAME + 122},  // 3.576–4.032s (456ms) → scene cut
  // ── Problem scene ──────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 144, to: VOICEOVER_START_FRAME + 157},  // 4.806–5.204s (398ms)
  {from: VOICEOVER_START_FRAME + 188, to: VOICEOVER_START_FRAME + 213},  // 6.275–7.077s (802ms)
  {from: VOICEOVER_START_FRAME + 235, to: VOICEOVER_START_FRAME + 252},  // 7.838–8.368s (530ms)
  {from: VOICEOVER_START_FRAME + 303, to: VOICEOVER_START_FRAME + 328},  // 10.112–10.892s (781ms) → scene cut
  // ── People scene ───────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 375, to: VOICEOVER_START_FRAME + 389},  // 12.501–12.923s (422ms)
  {from: VOICEOVER_START_FRAME + 421, to: VOICEOVER_START_FRAME + 437},  // 14.049–14.540s (491ms)
  {from: VOICEOVER_START_FRAME + 472, to: VOICEOVER_START_FRAME + 492},  // 15.746–16.377s (630ms)
  {from: VOICEOVER_START_FRAME + 513, to: VOICEOVER_START_FRAME + 527},  // 17.106–17.518s (412ms)
  {from: VOICEOVER_START_FRAME + 553, to: VOICEOVER_START_FRAME + 580},  // 18.428–19.310s (882ms) → scene cut
  // ── TurningA scene ─────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 644, to: VOICEOVER_START_FRAME + 663},  // 21.466–22.069s (603ms)
  {from: VOICEOVER_START_FRAME + 794, to: VOICEOVER_START_FRAME + 818},  // 26.457–27.220s (762ms) → scene cut
  // ── TurningB scene ─────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 863, to: VOICEOVER_START_FRAME + 875},  // 28.752–29.142s (389ms)
  {from: VOICEOVER_START_FRAME + 911, to: VOICEOVER_START_FRAME + 927},  // 30.365–30.854s (490ms)
  {from: VOICEOVER_START_FRAME + 993, to: VOICEOVER_START_FRAME + 1029}, // 33.092–34.271s (1179ms) → scene cut [was only last 10f!]
  // ── Mobile scene ───────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 1076, to: VOICEOVER_START_FRAME + 1109}, // 35.870–36.943s (1073ms) [was completely missing!]
  {from: VOICEOVER_START_FRAME + 1187, to: VOICEOVER_START_FRAME + 1215}, // 39.552–40.474s (922ms) → scene cut [was only last 8f!]
  // ── Kiosk scene ────────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 1294, to: VOICEOVER_START_FRAME + 1308}, // 43.118–43.553s (435ms)
  {from: VOICEOVER_START_FRAME + 1349, to: VOICEOVER_START_FRAME + 1383}, // 44.968–46.070s (1102ms) [was completely missing!]
  {from: VOICEOVER_START_FRAME + 1412, to: VOICEOVER_START_FRAME + 1425}, // 47.057–47.473s (416ms) → scene cut
  // ── Admin scene ────────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 1480, to: VOICEOVER_START_FRAME + 1501}, // 49.326–50.006s (681ms) [was completely missing!]
  {from: VOICEOVER_START_FRAME + 1592, to: VOICEOVER_START_FRAME + 1609}, // 53.075–53.584s (509ms) → scene cut
  // ── Benefits scene ─────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 1689, to: VOICEOVER_START_FRAME + 1710}, // 56.295–56.983s (688ms) [was completely missing!]
  {from: VOICEOVER_START_FRAME + 1775, to: VOICEOVER_START_FRAME + 1787}, // 59.152–59.520s (368ms) [was completely missing!]
  {from: VOICEOVER_START_FRAME + 1812, to: VOICEOVER_START_FRAME + 1836}, // 60.405–61.170s (765ms) → scene cut [was only last 9f!]
  // ── Final scene ────────────────────────────────────────────────────────────
  {from: VOICEOVER_START_FRAME + 1861, to: VOICEOVER_START_FRAME + 1883}, // 62.042–62.747s (705ms) [was completely missing!]
  {from: VOICEOVER_START_FRAME + 1905, to: VOICEOVER_START_FRAME + 1918}, // 63.491–63.909s (418ms) [was completely missing!]
] as const;

const sceneDuration = (key: keyof typeof TIMELINE) =>
  TIMELINE[key].to - TIMELINE[key].from;

const COLD_OPEN_SCENE_DURATION = sceneDuration("coldOpen");
const TURNING_B_SCENE_DURATION = sceneDuration("turningB");
const FINAL_SCENE_DURATION     = sceneDuration("final");

const VIDEO_OFFSETS = {
  mobileProblem: 0,
  mobileReveal:  300,
  kioskReveal:   600,
  adminReveal:   480,
  mascotColdOpen:    18,
  mascotTransition: 108,
  mascotFinal:      156,
} as const;

/* eslint-disable @remotion/non-pure-animation */
const MASCOT_AUDIO_SEGMENTS = {
  coldOpen: {
    sequenceFrom: TIMELINE.coldOpen.from,
    duration: Math.min(COLD_OPEN_SCENE_DURATION, MASCOT_TOTAL_FRAMES - VIDEO_OFFSETS.mascotColdOpen),
    startFrom: VIDEO_OFFSETS.mascotColdOpen,
  },
  transition: {
    sequenceFrom: TIMELINE.turningB.from,
    duration: Math.min(TURNING_B_SCENE_DURATION, MASCOT_TOTAL_FRAMES - VIDEO_OFFSETS.mascotTransition),
    startFrom: VIDEO_OFFSETS.mascotTransition,
  },
  final: {
    sequenceFrom: TIMELINE.final.from,
    duration: Math.min(FINAL_SCENE_DURATION, MASCOT_TOTAL_FRAMES - VIDEO_OFFSETS.mascotFinal),
    startFrom: VIDEO_OFFSETS.mascotFinal,
  },
} as const;
/* eslint-enable @remotion/non-pure-animation */

// ─── EASING + MOTION HELPERS ─────────────────────────────────────────────────

const easeOut   = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

/** Fade in → hold → fade out within a scene's local frame range. */
const fadeScene = (frame: number, total: number, enter = 18, exit = 18) => {
  const safeTotal = Math.max(total, 2);
  const enterEnd = Math.min(enter, safeTotal - 1);

  if (exit <= 0) {
    return interpolate(frame, [0, enterEnd, safeTotal], [0, 1, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeInOut,
    });
  }

  const exitStart = Math.max(enterEnd + 1, safeTotal - exit);

  return interpolate(frame, [0, enterEnd, exitStart, safeTotal], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
};

/** Shared spring config for all element entrances. */
const enterProgress = (frame: number, fps: number, delay = 0) =>
  spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 20,
      stiffness: 90,
      mass: 1,
    },
  });

// ─── AUDIO VOLUME FUNCTIONS ──────────────────────────────────────────────────

const getVoiceoverVolume = (frame: number) => {
  // Keep the processed voiceover flat through the body.
  // The previous per-cut micro-dips stacked with the pause lifts and made
  // the local cut at 27.23s (VO frame 817) read as a level jump.
  return interpolate(
    frame,
    [0, 10, AUDIO_TOTAL_FRAMES - 14, AUDIO_TOTAL_FRAMES],
    [0, VOICEOVER_BASE_VOLUME, VOICEOVER_BASE_VOLUME, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
};

const getMusicVolume = (frame: number) => {
  const bed = interpolate(
    frame,
    [
      0,
      MUSIC_FADE_IN_FRAMES,
      COLD_OPEN_DURATION,
      COLD_OPEN_FRAMES,
      TIMELINE.final.from - 12,
      CONDO_PRODUCT_TOTAL_FRAMES - MUSIC_FADE_OUT_FRAMES,
      CONDO_PRODUCT_TOTAL_FRAMES,
    ],
    [
      0,
      MUSIC_COLD_OPEN_VOLUME * 0.6,
      MUSIC_COLD_OPEN_VOLUME,
      MUSIC_UNDER_VO_VOLUME,
      MUSIC_UNDER_VO_VOLUME,
      MUSIC_FINAL_VOLUME,
      0,
    ],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  const finalLift = interpolate(
    frame,
    [TIMELINE.final.from - 12, TIMELINE.final.from + 28, CONDO_PRODUCT_TOTAL_FRAMES],
    [0, MUSIC_TRANSITION_VOLUME - MUSIC_UNDER_VO_VOLUME, MUSIC_FINAL_VOLUME - MUSIC_UNDER_VO_VOLUME],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  const pauseLiftWindow = (from: number, to: number) => {
    // Pre-attack 10 frames before pause: music begins rising early,
    // creating a smooth perceptual bridge before the VO cuts out.
    // Extended 14-frame tail lets the bed drift back down naturally.
    const start        = Math.max(0, from - 10);
    const attackEnd    = Math.min(from + 4, to - 2);
    const releaseStart = Math.max(attackEnd + 1, to - 2);
    const end          = Math.max(releaseStart + 1, to + 14);
    return [start, attackEnd, releaseStart, end] as const;
  };

  const pauseLift = MUSIC_LIFTS.reduce((acc, window) => {
    const [start, attackEnd, releaseStart, end] = pauseLiftWindow(window.from, window.to);
    return Math.max(
      acc,
      interpolate(frame, [start, attackEnd, releaseStart, end], [0, MUSIC_PAUSE_LIFT, MUSIC_PAUSE_LIFT, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut,
      }),
    );
  }, 0);

  return bed + pauseLift + finalLift;
};

const getMascotVolume = (frame: number, section: "coldOpen" | "transition" | "final") => {
  if (!HAS_MASCOT_AUDIO) return 0;
  if (section === "coldOpen") {
    return interpolate(
      frame,
      [0, 14, COLD_OPEN_DURATION, COLD_OPEN_FRAMES - 10, COLD_OPEN_FRAMES],
      [0, MASCOT_AUDIO_COLD_OPEN_VOLUME * 0.65, MASCOT_AUDIO_COLD_OPEN_VOLUME, 0.08, 0],
      {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
    );
  }
  if (section === "transition") {
    return interpolate(
      frame,
      [0, 8, 24, TURNING_B_SCENE_DURATION - 16, TURNING_B_SCENE_DURATION],
      [0, MASCOT_AUDIO_TRANSITION_VOLUME, MASCOT_AUDIO_TRANSITION_VOLUME * 0.85, 0.02, 0],
      {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
    );
  }
  return interpolate(
    frame,
    [0, 10, FINAL_SCENE_DURATION - 22, FINAL_SCENE_DURATION],
    [0, MASCOT_AUDIO_FINAL_VOLUME, MASCOT_AUDIO_FINAL_VOLUME * 0.7, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
};

// ─── MASCOT MOMENT ───────────────────────────────────────────────────────────

/**
 * The mascot.mp4 video rendered as a floating, breathing element.
 * Uses the same float + scale language as VideoCard.
 */
const MascotMoment: React.FC<{
  startFrom    : number;
  width        : number;
  height       : number;
  totalDuration: number;
  opacity     ?: number;
}> = ({startFrom, width, height, totalDuration, opacity = 1}) => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, totalDuration], [1, 1.015], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });

  const floatY = Math.sin(frame * 0.03) * 3.5;
  const tilt = Math.sin(frame * 0.018) * 0.25;

  return (
    <div
      style={{
        width,
        height,
        opacity,
        transform: `translateY(${floatY}px) scale(${scale}) rotate(${tilt}deg)`,
        transformOrigin: "50% 60%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 28,
          overflow: "hidden",
          background: "rgba(255,255,255,0.82)",
          boxShadow:
            "0 18px 50px rgba(15,23,42,0.10), 0 6px 18px rgba(15,23,42,0.06)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          position: "relative",
          isolation: "isolate",
          maskImage:
            "radial-gradient(circle at center, black 88%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 88%, transparent 100%)",
        }}
      >
        <OffthreadVideo
          src={MASCOT}
          startFrom={startFrom}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            backgroundColor: "transparent",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: 28,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.45)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: 28,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.00) 28%, rgba(15,23,42,0.03) 100%)",
          }}
        />
      </div>
    </div>
  );
};

// ─── BACKGROUND ──────────────────────────────────────────────────────────────

type AccentKey = "blue" | "purple" | "teal" | "neutral";

const ACCENT_BLOBS: Record<AccentKey, [string, string]> = {
  blue:    ["rgba(59,130,246,0.07)",  "rgba(20,184,166,0.05)"],
  purple:  ["rgba(139,92,246,0.07)", "rgba(59,130,246,0.05)"],
  teal:    ["rgba(20,184,166,0.07)", "rgba(59,130,246,0.05)"],
  neutral: ["rgba(59,130,246,0.05)", "rgba(15,23,42,0.03)"],
};

/**
 * Unified scene background.
 * Two large radial blobs drift slowly in opposite directions.
 * No grid overlay — the organic softness is the system, not the noise.
 */
const Background: React.FC<{
  children: React.ReactNode;
  opacity ?: number;
  accent  ?: AccentKey;
}> = ({children, opacity = 1, accent = "neutral"}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.009) * 22;
  const [blobA, blobB] = ACCENT_BLOBS[accent];

  return (
    <AbsoluteFill
      style={{
        opacity,
        overflow  : "hidden",
        background: `linear-gradient(168deg, ${BG} 0%, ${BG_SOFT} 55%, #EFF6FF 100%)`,
      }}
    >
      {/* Top-left ambient orb */}
      <div
        style={{
          position    : "absolute",
          width       : 960,
          height      : 960,
          left        : -320 + drift,
          top         : -360,
          borderRadius: "50%",
          background  : `radial-gradient(circle, ${blobA} 0%, transparent 62%)`,
          filter      : "blur(48px)",
          pointerEvents: "none",
        }}
      />
      {/* Bottom-right ambient orb */}
      <div
        style={{
          position    : "absolute",
          width       : 880,
          height      : 880,
          right       : -310 - drift,
          bottom      : -320,
          borderRadius: "50%",
          background  : `radial-gradient(circle, ${blobB} 0%, transparent 68%)`,
          filter      : "blur(48px)",
          pointerEvents: "none",
        }}
      />
      {/* Very subtle top-edge vignette for depth */}
      <div
        style={{
          position  : "absolute",
          top       : 0,
          left      : 0,
          right     : 0,
          height    : 160,
          background: "linear-gradient(to bottom, rgba(248,250,252,0.40) 0%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

// ─── EXPLAINER TEXT ──────────────────────────────────────────────────────────

/**
 * The primary text component. Accepts:
 *  - eyebrow  : small uppercase label above the headline
 *  - title    : headline (Sora, display weight)
 *  - body     : supporting sentence (system font, lighter weight)
 */
const ExplainerText: React.FC<{
  title      : string;
  body      ?: string;
  eyebrow   ?: string;
  eyebrowColor?: string;
  centered  ?: boolean;
  maxWidth  ?: number;
  titleColor?: string;
  delay     ?: number;
}> = ({
  title,
  body,
  eyebrow,
  eyebrowColor = BLUE,
  centered     = false,
  maxWidth     = 760,
  titleColor   = TEXT,
  delay        = 0,
}) => {
  const frame   = useCurrentFrame();
  const {fps}   = useVideoConfig();
  const enter   = enterProgress(frame, fps, delay);
  const opacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const y = interpolate(enter, [0, 1], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width   : maxWidth,
        textAlign: centered ? "center" : "left",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      {eyebrow ? (
        <div
          style={{
            fontFamily   : BODY_FONT,
            fontSize     : 15,
            lineHeight   : 1,
            fontWeight   : 700,
            letterSpacing: "0.09em",
            color        : eyebrowColor,
            textTransform: "uppercase",
            marginBottom : SP.sm,
          }}
        >
          {eyebrow}
        </div>
      ) : null}

      <div
        style={{
          fontFamily   : DISPLAY_FONT,
          fontSize     : 84,
          lineHeight   : 0.96,
          fontWeight   : 600,
          letterSpacing: "-0.03em",
          color        : titleColor,
        }}
      >
        {title}
      </div>

      {body ? (
        <div
          style={{
            marginTop    : SP.md,
            fontFamily   : BODY_FONT,
            fontSize     : 28,
            lineHeight   : 1.32,
            fontWeight   : 400,
            letterSpacing: "-0.015em",
            color        : TEXT_MID,
          }}
        >
          {body}
        </div>
      ) : null}
    </div>
  );
};

// ─── VIDEO CARD ──────────────────────────────────────────────────────────────

/**
 * The hero surface for all product video clips.
 * Same radius, shadow, and inner highlight across mobile / kiosk / admin.
 */
const VideoCard: React.FC<{
  src          : string;
  startFrom    : number;
  totalDuration: number;
  frameWidth   : number;
  frameHeight  : number;
  objectFit   ?: "contain" | "cover";
  accent      ?: string;
}> = ({
  src,
  startFrom,
  totalDuration,
  frameWidth,
  frameHeight,
  objectFit = "contain",
  accent = BLUE,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = enterProgress(frame, fps);
  const opacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardY = interpolate(enter, [0, 1], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tilt = Math.sin(frame * 0.012) * 0.18;

  const zoom = interpolate(frame, [0, totalDuration], [1, 1.028], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });

  return (
    <div
      style={{
        position: "relative",
        width: frameWidth,
        height: frameHeight,
        borderRadius: R_LG,
        background: "rgba(255,255,255,0.94)",
        border: `1px solid ${BORDER}`,
        boxShadow:
          "0 2px 6px rgba(15,23,42,0.04), 0 14px 36px rgba(15,23,42,0.07), 0 40px 100px rgba(15,23,42,0.08)",
        overflow: "hidden",
        opacity,
        transform: `translateY(${cardY}px) rotate(${tilt}deg)`,
        isolation: "isolate",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(140deg, ${accent}0D 0%, transparent 44%)`,
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${zoom})`,
          transformOrigin: "50% 50%",
          borderRadius: R_LG,
          overflow: "hidden",
          maskImage:
            "radial-gradient(circle at center, black 92%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 92%, transparent 100%)",
        }}
      >
        <OffthreadVideo
          src={src}
          startFrom={startFrom}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit,
            backgroundColor: BG,
            display: "block",
          }}
        />
      </div>

      <div style={{...INNER_RING, borderRadius: R_LG, zIndex: 2}} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          borderRadius: R_LG,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.00) 30%, rgba(15,23,42,0.03) 100%)",
        }}
      />
    </div>
  );
};
// ─── CHARACTER SKETCHES + ROLE CARDS ─────────────────────────────────────────

const SketchFrame: React.FC<{accent: string; children: React.ReactNode}> = ({accent, children}) => (
  <svg
    viewBox="0 0 180 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{width: 128, height: 128}}
  >
    <circle cx="90" cy="90" r="68" fill={`${accent}0E`} />
    <circle cx="90" cy="90" r="56" fill={`${accent}08`} />
    <g stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  </svg>
);

const LoreSketch: React.FC = () => (
  <SketchFrame accent={BLUE}>
    <circle cx="88" cy="64" r="24" />
    <path d="M56 138 C64 110 112 110 120 138" />
    <path d="M70 54 C76 42 98 40 110 50" />
    <rect x="118" y="92" width="26" height="42" rx="8" />
    <path d="M124 102 H136" />
    <path d="M124 110 H133" />
  </SketchFrame>
);

const RobertSketch: React.FC = () => (
  <SketchFrame accent={TEAL}>
    <circle cx="90" cy="64" r="22" />
    <path d="M60 138 C68 112 112 112 120 138" />
    <path d="M66 44 C74 34 104 34 112 44" />
    <rect x="118" y="82" width="28" height="46" rx="8" />
    <path d="M124 96 H138" />
    <path d="M124 106 H136" />
  </SketchFrame>
);

const CarmenSketch: React.FC = () => (
  <SketchFrame accent={PURPLE}>
    <circle cx="90" cy="64" r="22" />
    <path d="M60 138 C68 112 112 112 120 138" />
    <path d="M70 44 C76 34 104 34 110 44" />
    <rect x="116" y="88" width="34" height="28" rx="8" />
    <path d="M122 98 H144" />
    <path d="M122 106 H140" />
  </SketchFrame>
);

/**
 * Character role card — same radius/shadow system as VideoCard, smaller scale.
 */
const RoleCard: React.FC<{
  name  : string;
  role  : string;
  accent: string;
  sketch: React.ReactNode;
}> = ({name, role, accent, sketch}) => (
  <div
    style={{
      width       : 336,
      padding     : SP.base,
      borderRadius: R_MD,
      background  : "rgba(255,255,255,0.92)",
      border      : `1px solid ${BORDER}`,
      boxShadow   : SHADOW_CARD,
      position    : "relative",
      overflow    : "hidden",
    }}
  >
    {/* Accent wash behind sketch */}
    <div
      style={{
        position  : "absolute",
        top       : 0,
        left      : 0,
        right     : 0,
        height    : 160,
        background: `linear-gradient(160deg, ${accent}08 0%, transparent 70%)`,
        pointerEvents: "none",
      }}
    />

    <div style={{marginBottom: SP.md, position: "relative"}}>{sketch}</div>

    <div
      style={{
        fontFamily   : BODY_FONT,
        fontSize     : 13,
        lineHeight   : 1,
        fontWeight   : 700,
        letterSpacing: "0.09em",
        color        : accent,
        textTransform: "uppercase",
        marginBottom : SP.sm,
      }}
    >
      {role}
    </div>

    <div
      style={{
        fontFamily   : DISPLAY_FONT,
        fontSize     : 44,
        lineHeight   : 0.98,
        fontWeight   : 600,
        letterSpacing: "-0.03em",
        color        : TEXT,
      }}
    >
      {name}
    </div>

    {/* Inner ring — consistent with all card surfaces */}
    <div
      style={{
        ...INNER_RING,
        borderRadius : R_MD,
      }}
    />
  </div>
);

// ─── SCENE COMPONENTS ────────────────────────────────────────────────────────

const ColdOpenScene: React.FC<{totalDuration: number}> = ({totalDuration}) => {
  const frame  = useCurrentFrame();
  const opacity  = fadeScene(frame, totalDuration, 18, 12);
  const reveal   = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut,
  });
  const firstLine = interpolate(frame, [COLD_OPEN_DURATION + 6, COLD_OPEN_DURATION + 24], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut,
  });
  const secondLine = interpolate(frame, [COLD_OPEN_DURATION + 34, COLD_OPEN_DURATION + 58], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut,
  });
  const textY = interpolate(frame, [COLD_OPEN_DURATION, totalDuration], [10, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const mascotLift = interpolate(frame, [0, totalDuration], [0, -22], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut,
  });
  const mascotReactScale = interpolate(frame, [COLD_OPEN_DURATION + 24, totalDuration], [1, 1.016], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut,
  });
  const mascotReactTilt = interpolate(frame, [COLD_OPEN_DURATION + 34, totalDuration], [0, -1.3], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut,
  });

  return (
    <AbsoluteFill
      style={{
        opacity,
        overflow  : "hidden",
        background: `linear-gradient(168deg, ${BG} 0%, ${BG_SOFT} 60%, #EFF6FF 100%)`,
      }}
    >
      {/* Primary ambient gradient */}
      <div
        style={{
          position  : "absolute",
          inset     : 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 32%, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.04) 42%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Secondary warmth from bottom */}
      <div
        style={{
          position  : "absolute",
          inset     : 0,
          background: "radial-gradient(ellipse 60% 40% at 50% 92%, rgba(20,184,166,0.05) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Mascot — hero of the cold open */}
      <div
        style={{
          position      : "absolute",
          inset         : 0,
          display       : "flex",
          alignItems    : "flex-start",
          justifyContent: "center",
          opacity       : reveal,
          paddingTop    : 44,
        }}
      >
        <div
          style={{
            transform      : `translateY(${mascotLift}px) scale(${mascotReactScale}) rotate(${mascotReactTilt}deg)`,
            transformOrigin: "50% 60%",
          }}
        >
          <MascotMoment
            startFrom={VIDEO_OFFSETS.mascotColdOpen}
            width={600}
            height={600}
            totalDuration={totalDuration}
          />
        </div>
      </div>

      {/* Hook text — lower third, kept clear of the mascot silhouette */}
      <div
        style={{
          position      : "absolute",
          left          : 0,
          right         : 0,
          bottom        : 82,
          display       : "flex",
          justifyContent: "center",
          transform     : `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            width         : 1120,
            display       : "flex",
            flexDirection : "column",
            alignItems    : "center",
            textAlign     : "center",
            padding       : `0 ${SP.frame}px`,
          }}
        >
          <div
            style={{
              fontFamily   : DISPLAY_FONT,
              fontSize     : 78,
              lineHeight   : 0.98,
              fontWeight   : 600,
              letterSpacing: "-0.033em",
              color        : TEXT,
              opacity      : firstLine,
            }}
          >
            Tu comida ya llegó...
          </div>
          <div
            style={{
              marginTop    : 24,
              fontFamily   : DISPLAY_FONT,
              fontSize     : 88,
              lineHeight   : 0.94,
              fontWeight   : 600,
              letterSpacing: "-0.036em",
              color        : PURPLE,
              opacity      : secondLine,
            }}
          >
            ...pero sigue en la entrada.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ResidentScene: React.FC<{totalDuration: number}> = ({totalDuration}) => {
  const frame   = useCurrentFrame();
  const opacity = fadeScene(frame, totalDuration, 8, 12);

  return (
    <Background opacity={opacity} accent="blue">
      <div
        style={{
          position             : "absolute",
          inset                : 0,
          padding              : `${SP.frame}px ${SP.frame}px`,
          display              : "grid",
          gridTemplateColumns  : "520px 1fr",
          gap                  : SP.lg,
          alignItems           : "center",
        }}
      >
        <ExplainerText
          eyebrow="Lore · Residente"
          eyebrowColor={BLUE}
          title="Solo quiere que sus cosas lleguen."
          body="Sin llamadas. Sin esperas. Sin complicaciones."
          maxWidth={520}
          delay={4}
        />
        <VideoCard
          src={MOBILE}
          startFrom={VIDEO_OFFSETS.mobileProblem}
          totalDuration={totalDuration}
          frameWidth={1120}
          frameHeight={760}
          objectFit="contain"
          accent={BLUE}
        />
      </div>
    </Background>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ProblemScene: React.FC<{totalDuration: number}> = ({totalDuration}) => {
  const frame   = useCurrentFrame();
  const opacity = fadeScene(frame, totalDuration);

  return (
    <Background opacity={opacity} accent="purple">
      <div
        style={{
          position           : "absolute",
          inset              : 0,
          padding            : `${SP.frame + 8}px ${SP.frame}px ${SP.frame}px`,
          display            : "grid",
          gridTemplateColumns: "600px 1fr",
          gap                : SP.lg,
          alignItems         : "center",
        }}
      >
        <ExplainerText
          eyebrow="El problema"
          eyebrowColor={PURPLE}
          title="Hoy dependes de llamadas, interfones y procesos manuales."
          body="Demasiada fricción para algo que debería resolverse en segundos."
          maxWidth={600}
          delay={6}
        />
        <VideoCard
          src={MOBILE}
          startFrom={VIDEO_OFFSETS.mobileProblem}
          totalDuration={totalDuration}
          frameWidth={1028}
          frameHeight={760}
          objectFit="contain"
          accent={PURPLE}
        />
      </div>
    </Background>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const CharacterScene: React.FC<{totalDuration: number}> = ({totalDuration}) => {
  const frame   = useCurrentFrame();
  const opacity = fadeScene(frame, totalDuration);
  const roles   = [
    {name: "Lore",    role: "Residente",      accent: BLUE,   sketch: <LoreSketch />},
    {name: "Roberto", role: "Guardia",         accent: TEAL,   sketch: <RobertSketch />},
    {name: "Carmen",  role: "Administración",  accent: PURPLE, sketch: <CarmenSketch />},
  ];

  return (
    <Background opacity={opacity} accent="neutral">
      <div
        style={{
          position      : "absolute",
          inset         : 0,
          display       : "flex",
          flexDirection : "column",
          justifyContent: "center",
          alignItems    : "center",
          padding       : `${SP.xl}px ${SP.frame}px`,
        }}
      >
        <ExplainerText
          eyebrow="Tres personas"
          eyebrowColor={TEXT_LOW}
          title="Tres personas. Un mismo problema."
          body="Nadie quiere una app extra. Nadie quiere más pasos."
          centered
          maxWidth={960}
          delay={6}
        />
        <div style={{marginTop: SP.xl, display: "flex", gap: SP.base}}>
          {roles.map((role, i) => {
            const cardIn = interpolate(frame, [20 + i * 10, 44 + i * 10], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut,
            });
            return (
              <div
                key={role.name}
                style={{
                  opacity  : cardIn,
                  transform: `translateY(${interpolate(cardIn, [0, 1], [20, 0])}px)`,
                }}
              >
                <RoleCard {...role} />
              </div>
            );
          })}
        </div>
      </div>
    </Background>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const TurningPointScene: React.FC<{
  totalDuration: number;
  title        : string;
  subtitle    ?: string;
  showMascot  ?: boolean;
}> = ({totalDuration, title, subtitle, showMascot = false}) => {
  const frame   = useCurrentFrame();
  const {fps}   = useVideoConfig();
  const opacity = fadeScene(frame, totalDuration, 10, 10);

  const mascotEnter = spring({
    frame,
    fps,
    config: {damping: 18, stiffness: 100, mass: 1},
    durationInFrames: 32,
  });
  const mascotY = interpolate(mascotEnter, [0, 1], [30, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const mascotOp = interpolate(mascotEnter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <Background opacity={opacity} accent="neutral">
      <div
        style={{
          position      : "absolute",
          inset         : 0,
          display       : "flex",
          alignItems    : "center",
          justifyContent: "center",
          padding       : `0 ${SP.frame * 2}px`,
        }}
      >
        <ExplainerText
          title={title}
          body={subtitle}
          centered
          maxWidth={1180}
          delay={4}
        />
      </div>

      {showMascot ? (
        <div
          style={{
            position : "absolute",
            right    : SP.frame + 28,
            bottom   : SP.xl + 8,
            opacity  : mascotOp,
            transform: `translateY(${mascotY}px)`,
          }}
        >
          <MascotMoment
            startFrom={VIDEO_OFFSETS.mascotTransition}
            width={196}
            height={196}
            totalDuration={totalDuration}
          />
        </div>
      ) : null}
    </Background>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const VideoScene: React.FC<{
  totalDuration: number;
  src          : string;
  startFrom    : number;
  eyebrow      : string;
  title        : string;
  body         : string;
  accent       : string;
  accentKey    : AccentKey;
  align        : "left" | "right";
  frameHeight  : number;
}> = ({totalDuration, src, startFrom, eyebrow, title, body, accent, accentKey, align, frameHeight}) => {
  const frame   = useCurrentFrame();
  const opacity = fadeScene(frame, totalDuration);

  const textBlock = (
    <ExplainerText
      eyebrow={eyebrow}
      eyebrowColor={accent}
      title={title}
      body={body}
      maxWidth={520}
      delay={6}
    />
  );
  const card = (
    <VideoCard
      src={src}
      startFrom={startFrom}
      totalDuration={totalDuration}
      frameWidth={1100}
      frameHeight={frameHeight}
      objectFit="contain"
      accent={accent}
    />
  );

  return (
    <Background opacity={opacity} accent={accentKey}>
      <div
        style={{
          position           : "absolute",
          inset              : 0,
          padding            : `${SP.frame}px`,
          display            : "grid",
          gridTemplateColumns: align === "left" ? "1fr 520px" : "520px 1fr",
          gap                : SP.lg,
          alignItems         : "center",
        }}
      >
        {align === "left" ? <>{card}{textBlock}</> : <>{textBlock}{card}</>}
      </div>
    </Background>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const BenefitSequence: React.FC<{totalDuration: number}> = ({totalDuration}) => {
  const frame   = useCurrentFrame();
  const {fps}   = useVideoConfig();
  const opacity = fadeScene(frame, totalDuration, 10, 10);
  const beats   = [
    {label: "Sin apps nuevas", color: BLUE,   from: 0,   to: 68},
    {label: "Sin aprendizaje",  color: PURPLE, from: 68,  to: 144},
    {label: "Sin fricción",     color: TEAL,   from: 144, to: totalDuration},
  ];

  // Springs for scale — called unconditionally (no hooks in loops)
  const sp1 = spring({frame: frame - beats[0].from - 6, fps, config: {damping: 18, stiffness: 120, mass: 0.9}});
  const sp2 = spring({frame: frame - beats[1].from - 6, fps, config: {damping: 18, stiffness: 120, mass: 0.9}});
  const sp3 = spring({frame: frame - beats[2].from - 6, fps, config: {damping: 18, stiffness: 120, mass: 0.9}});
  const springs = [sp1, sp2, sp3];

  return (
    <Background opacity={opacity} accent="neutral">
      <div
        style={{
          position      : "absolute",
          inset         : 0,
          display       : "flex",
          alignItems    : "center",
          justifyContent: "center",
          padding       : `0 ${SP.frame * 2}px`,
        }}
      >
        <div style={{position: "relative", width: "100%", height: 160}}>
          {beats.map((beat, i) => {
            const sp          = springs[i];
            const beatOpacity = interpolate(
              frame,
              [beat.from + 4, beat.from + 18, beat.to - 14, beat.to],
              [0, 1, 1, 0],
              {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
            );
            const beatScale = interpolate(sp, [0, 1], [0.90, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });

            return (
              <div
                key={beat.label}
                style={{
                  position      : "absolute",
                  inset         : 0,
                  display       : "flex",
                  alignItems    : "center",
                  justifyContent: "center",
                  fontFamily    : DISPLAY_FONT,
                  fontSize      : 94,
                  lineHeight    : 0.95,
                  fontWeight    : 600,
                  letterSpacing : "-0.033em",
                  color         : beat.color,
                  opacity       : beatOpacity,
                  transform     : `scale(${beatScale})`,
                }}
              >
                {beat.label}
              </div>
            );
          })}
        </div>
      </div>
    </Background>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const FinalScene: React.FC<{totalDuration: number}> = ({totalDuration}) => {
  const frame   = useCurrentFrame();
  const {fps}   = useVideoConfig();
  const opacity = fadeScene(frame, totalDuration, 12, 0);
  const drift   = Math.sin(frame * 0.008) * 18;

  // Staggered entrance for each text element
  const titleEnter = spring({frame: frame - 4,  fps, config: {damping: 16, stiffness: 110, mass: 0.9}});
  const subEnter   = spring({frame: frame - 18, fps, config: {damping: 16, stiffness: 110, mass: 0.9}});
  const urlEnter   = spring({frame: frame - 32, fps, config: {damping: 18, stiffness: 100, mass: 1}});

  const mk = (sp: number) => ({
    opacity  : interpolate(sp, [0, 1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
    y        : interpolate(sp, [0, 1], [18, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
    scale    : interpolate(sp, [0, 1], [0.97, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
  });
  const title = mk(titleEnter);
  const sub   = mk(subEnter);
  const url   = mk(urlEnter);

  // Mascot entrance
  const mascotSpring = spring({frame: frame - 8, fps, config: {damping: 18, stiffness: 90, mass: 1}});
  const mascotY  = interpolate(mascotSpring, [0, 1], [28, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const mascotOp = interpolate(mascotSpring, [0, 1], [0, 0.95], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{overflow: "hidden", opacity}}>
      {/* Animated gradient background — same system as ColdOpen */}
      <div
        style={{
          position  : "absolute",
          inset     : 0,
          background: `linear-gradient(168deg, ${BG} 0%, ${BG_SOFT} 55%, #EFF6FF 100%)`,
        }}
      />
      <div
        style={{
          position  : "absolute",
          width     : 1000,
          height    : 1000,
          left      : -280 + drift,
          top       : -360,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 62%)",
          filter    : "blur(48px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position  : "absolute",
          width     : 900,
          height    : 900,
          right     : -260 - drift,
          bottom    : -340,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 68%)",
          filter    : "blur(48px)",
          pointerEvents: "none",
        }}
      />

      {/* Wordmark + tagline */}
      <div
        style={{
          position      : "absolute",
          inset         : 0,
          display       : "flex",
          alignItems    : "center",
          justifyContent: "center",
          flexDirection : "column",
          textAlign     : "center",
          padding       : `0 ${SP.frame * 2}px`,
        }}
      >
        <div
          style={{
            opacity  : title.opacity,
            transform: `translateY(${title.y}px) scale(${title.scale})`,
            fontFamily   : DISPLAY_FONT,
            fontSize     : 112,
            lineHeight   : 0.94,
            fontWeight   : 600,
            letterSpacing: "-0.035em",
            color        : TEXT,
          }}
        >
          CondoBuddy
        </div>

        <div
          style={{
            marginTop    : SP.md,
            opacity      : sub.opacity,
            transform    : `translateY(${sub.y}px)`,
            fontFamily   : BODY_FONT,
            fontSize     : 36,
            lineHeight   : 1.1,
            fontWeight   : 400,
            letterSpacing: "-0.025em",
            color        : TEXT_MID,
          }}
        >
          Acceso sin fricción
        </div>

        {/* Domain label */}
        <div
          style={{
            marginTop    : SP.xl,
            opacity      : url.opacity,
            transform    : `translateY(${url.y}px) scale(${url.scale})`,
            display      : "inline-flex",
            alignItems   : "center",
            gap          : SP.xs,
            paddingBlock : SP.sm,
            paddingInline: SP.md,
            borderRadius : R_SM,
            background   : "rgba(15,23,42,0.04)",
            border       : `1px solid ${BORDER}`,
          }}
        >
          <div
            style={{
              width       : 8,
              height      : 8,
              borderRadius: "50%",
              background  : BLUE,
              flexShrink  : 0,
            }}
          />
          <span
            style={{
              fontFamily   : BODY_FONT,
              fontSize     : 20,
              fontWeight   : 500,
              letterSpacing: "-0.01em",
              color        : TEXT_MID,
            }}
          >
            condobuddy.mx
          </span>
        </div>
      </div>

      {/* Mascot — positioned bottom-right, same card-system logic */}
      <div
        style={{
          position : "absolute",
          right    : SP.frame + 20,
          bottom   : SP.xl + 16,
          opacity  : mascotOp,
          transform: `translateY(${mascotY}px)`,
        }}
      >
        <MascotMoment
          startFrom={VIDEO_OFFSETS.mascotFinal}
          width={232}
          height={232}
          totalDuration={totalDuration}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─── ROOT COMPOSITION ────────────────────────────────────────────────────────

export const CondoBuddyProduct: React.FC = () => {
  return (
    <AbsoluteFill style={{background: BG}}>
      {/* ── Audio ──────────────────────────────────────────────────────────── */}
      <Audio src={MUSIC} volume={getMusicVolume} />

      <Sequence
        from={MASCOT_AUDIO_SEGMENTS.coldOpen.sequenceFrom}
        durationInFrames={MASCOT_AUDIO_SEGMENTS.coldOpen.duration}
      >
        <Audio
          src={MASCOT}
          startFrom={MASCOT_AUDIO_SEGMENTS.coldOpen.startFrom}
          volume={(f) => getMascotVolume(f, "coldOpen")}
        />
      </Sequence>

      <Sequence from={VOICEOVER_START_FRAME} durationInFrames={AUDIO_TOTAL_FRAMES}>
        <Audio src={VOICEOVER} volume={getVoiceoverVolume} />
      </Sequence>

      <Sequence
        from={MASCOT_AUDIO_SEGMENTS.transition.sequenceFrom}
        durationInFrames={MASCOT_AUDIO_SEGMENTS.transition.duration}
      >
        <Audio
          src={MASCOT}
          startFrom={MASCOT_AUDIO_SEGMENTS.transition.startFrom}
          volume={(f) => getMascotVolume(f, "transition")}
        />
      </Sequence>

      <Sequence
        from={MASCOT_AUDIO_SEGMENTS.final.sequenceFrom}
        durationInFrames={MASCOT_AUDIO_SEGMENTS.final.duration}
      >
        <Audio
          src={MASCOT}
          startFrom={MASCOT_AUDIO_SEGMENTS.final.startFrom}
          volume={(f) => getMascotVolume(f, "final")}
        />
      </Sequence>

      {/* ── Scenes ─────────────────────────────────────────────────────────── */}
      <Sequence from={TIMELINE.coldOpen.from} durationInFrames={sceneDuration("coldOpen")}>
        <ColdOpenScene totalDuration={sceneDuration("coldOpen")} />
      </Sequence>

      <Sequence from={TIMELINE.resident.from} durationInFrames={sceneDuration("resident")}>
        <ResidentScene totalDuration={sceneDuration("resident")} />
      </Sequence>

      <Sequence from={TIMELINE.problem.from} durationInFrames={sceneDuration("problem")}>
        <ProblemScene totalDuration={sceneDuration("problem")} />
      </Sequence>

      <Sequence from={TIMELINE.people.from} durationInFrames={sceneDuration("people")}>
        <CharacterScene totalDuration={sceneDuration("people")} />
      </Sequence>

      <Sequence from={TIMELINE.turningA.from} durationInFrames={sceneDuration("turningA")}>
        <TurningPointScene
          totalDuration={sceneDuration("turningA")}
          title="¿Y si nadie tuviera que instalar nada?"
        />
      </Sequence>

      <Sequence from={TIMELINE.turningB.from} durationInFrames={sceneDuration("turningB")}>
        <TurningPointScene
          totalDuration={sceneDuration("turningB")}
          title="¿Y si todo funcionara desde WhatsApp?"
          subtitle="Y desde una sola pantalla para todos los demás."
          showMascot
        />
      </Sequence>

      <Sequence from={TIMELINE.mobile.from} durationInFrames={sceneDuration("mobile")}>
        <VideoScene
          totalDuration={sceneDuration("mobile")}
          src={MOBILE}
          startFrom={VIDEO_OFFSETS.mobileReveal}
          eyebrow="Lore · Residente"
          title="Autoriza desde WhatsApp."
          body="El residente usa lo que ya conoce."
          accent={BLUE}
          accentKey="blue"
          align="left"
          frameHeight={780}
        />
      </Sequence>

      <Sequence from={TIMELINE.kiosk.from} durationInFrames={sceneDuration("kiosk")}>
        <VideoScene
          totalDuration={sceneDuration("kiosk")}
          src={KIOSK}
          startFrom={VIDEO_OFFSETS.kioskReveal}
          eyebrow="Roberto · Guardia"
          title="El guardia usa una sola pantalla."
          body="Sin instalar nada. Sin cambiar de sistema."
          accent={TEAL}
          accentKey="teal"
          align="right"
          frameHeight={720}
        />
      </Sequence>

      <Sequence from={TIMELINE.admin.from} durationInFrames={sceneDuration("admin")}>
        <VideoScene
          totalDuration={sceneDuration("admin")}
          src={ADMIN}
          startFrom={VIDEO_OFFSETS.adminReveal}
          eyebrow="Carmen · Administración"
          title="La administración tiene control total."
          body="Visibilidad real, en tiempo real."
          accent={PURPLE}
          accentKey="purple"
          align="left"
          frameHeight={780}
        />
      </Sequence>

      <Sequence from={TIMELINE.benefits.from} durationInFrames={sceneDuration("benefits")}>
        <BenefitSequence totalDuration={sceneDuration("benefits")} />
      </Sequence>

      <Sequence from={TIMELINE.final.from} durationInFrames={sceneDuration("final")}>
        <FinalScene totalDuration={sceneDuration("final")} />
      </Sequence>
    </AbsoluteFill>
  );
};

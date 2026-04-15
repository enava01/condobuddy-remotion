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
const VOICEOVER = staticFile("assets/voiceover-dani.mp3");
const MUSIC     = staticFile("assets/music.mp3");

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

// Colors
const BG       = "#FFFFFF";
const BG_SOFT  = "#F8FAFC";
const TEXT     = "#0F172A";
const TEXT_MID = "#475569";
const BLUE     = "#3B82F6";
const PURPLE   = "#8B5CF6";
const TEAL     = "#14B8A6";
const BORDER   = "rgba(15,23,42,0.07)";

// Radius system — applied consistently to ALL card surfaces
const R_MD = 24;   // role cards, character frames
const R_LG = 32;   // video cards, major surfaces

// Shadow system — three tiers, all low-contrast + large blur
const SHADOW_CARD = [
  "0 1px 3px rgba(15,23,42,0.03)",
  "0 6px 24px rgba(15,23,42,0.05)",
  "0 22px 60px rgba(15,23,42,0.07)",
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
const AUDIO_DURATION_SECONDS       = 79.229375;
const AUDIO_TOTAL_FRAMES           = Math.ceil(AUDIO_DURATION_SECONDS * FPS);
const MASCOT_DURATION_SECONDS      = 8;
const MASCOT_TOTAL_FRAMES          = Math.round(MASCOT_DURATION_SECONDS * FPS);
const VO_OFFSET_SECONDS            = 2;
const VOICEOVER_START_FRAME        = Math.round(2 * FPS);
const COLD_OPEN_DURATION           = VOICEOVER_START_FRAME;
const MUSIC_FADE_IN_FRAMES         = 22;
const MUSIC_FADE_OUT_FRAMES        = 18;
const MUSIC_COLD_OPEN_VOLUME       = 0.082;
const MUSIC_UNDER_VO_VOLUME        = 0.046;  // raised: continuous bed presence fills micro-transitions
const MUSIC_PAUSE_LIFT             = 0.024;  // music rise during each detected pause
const MUSIC_TRANSITION_VOLUME      = 0.058;
const MUSIC_FINAL_VOLUME           = 0.068;
const VOICEOVER_BASE_VOLUME        = 0.90;
const MASCOT_AUDIO_COLD_OPEN_VOLUME   = 0.2;
const MASCOT_AUDIO_TRANSITION_VOLUME  = 0.06;
const MASCOT_AUDIO_FINAL_VOLUME       = 0.12;
const HAS_MASCOT_AUDIO             = false;

export const CONDO_PRODUCT_TOTAL_FRAMES = VOICEOVER_START_FRAME + AUDIO_TOTAL_FRAMES;

const secondsToFrames = (seconds: number) => Math.round(seconds * FPS);
const toVideoFrame = (audioSeconds: number) =>
  Math.round((audioSeconds + VO_OFFSET_SECONDS) * FPS);
const COLD_OPEN_FRAMES = secondsToFrames(6.78);
const MIN_PHRASE_DURATION_FRAMES = secondsToFrames(1.5);
const ROBERTO_SCENE_EXTENSION_FRAMES = 10;
const CARMEN_SCENE_EXTENSION_FRAMES = secondsToFrames(1.75);

const PAUSE_AFTER_BUILD_FRAMES = 12;

const SCENE_MARKERS = {
  tension   : toVideoFrame(4.78),
  lore      : toVideoFrame(10.995),
  roberto   : toVideoFrame(17.725),
  carmen    : toVideoFrame(25.27),
  build     : toVideoFrame(32.865),
  pause     : toVideoFrame(40.14) - PAUSE_AFTER_BUILD_FRAMES,
  bigIdea   : toVideoFrame(40.14),
  handoff   : toVideoFrame(41.616),
  mobile    : toVideoFrame(48.903),
  kiosk     : toVideoFrame(58.065),
  admin     : toVideoFrame(62.367),
  benefits  : toVideoFrame(65.67),
  resolution: toVideoFrame(69.596),
  final     : toVideoFrame(72.862),
} as const;

const TIMELINE = {
  coldOpen  : {from: 0, to: COLD_OPEN_FRAMES},
  tension   : {from: SCENE_MARKERS.tension,    to: SCENE_MARKERS.lore},
  lore      : {from: SCENE_MARKERS.lore,       to: SCENE_MARKERS.roberto},
  roberto   : {from: SCENE_MARKERS.roberto,    to: SCENE_MARKERS.carmen + ROBERTO_SCENE_EXTENSION_FRAMES},
  carmen    : {from: SCENE_MARKERS.carmen + ROBERTO_SCENE_EXTENSION_FRAMES, to: SCENE_MARKERS.build + CARMEN_SCENE_EXTENSION_FRAMES},
  build     : {from: SCENE_MARKERS.build + CARMEN_SCENE_EXTENSION_FRAMES, to: SCENE_MARKERS.pause},
  pause     : {from: SCENE_MARKERS.pause,      to: SCENE_MARKERS.bigIdea},
  bigIdea   : {from: SCENE_MARKERS.bigIdea,    to: SCENE_MARKERS.handoff},
  handoff   : {from: SCENE_MARKERS.handoff,    to: SCENE_MARKERS.mobile},
  mobile    : {from: SCENE_MARKERS.mobile,     to: SCENE_MARKERS.kiosk},
  kiosk     : {from: SCENE_MARKERS.kiosk,      to: SCENE_MARKERS.admin},
  admin     : {from: SCENE_MARKERS.admin,      to: SCENE_MARKERS.benefits},
  benefits  : {from: SCENE_MARKERS.benefits,   to: SCENE_MARKERS.resolution},
  resolution: {from: SCENE_MARKERS.resolution, to: SCENE_MARKERS.final},
  final     : {from: SCENE_MARKERS.final,      to: CONDO_PRODUCT_TOTAL_FRAMES},
} as const;

const sceneDuration = (key: keyof typeof TIMELINE) =>
  TIMELINE[key].to - TIMELINE[key].from;

const COLD_OPEN_SCENE_DURATION = sceneDuration("coldOpen");
const HANDOFF_SCENE_DURATION = sceneDuration("handoff");
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
    sequenceFrom: TIMELINE.handoff.from,
    duration: Math.min(HANDOFF_SCENE_DURATION, MASCOT_TOTAL_FRAMES - VIDEO_OFFSETS.mascotTransition),
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

type TimedPhrase = {
  text: string;
  from: number;
  to: number;
};

const normalizeTimedPhrases = ({
  phrases,
  minDurationFrames,
  sceneDurationFrames,
  minGapFrames = 2,
  trailingPaddingFrames = 12,
}: {
  phrases: TimedPhrase[];
  minDurationFrames: number;
  sceneDurationFrames: number;
  minGapFrames?: number;
  trailingPaddingFrames?: number;
}) => {
  const sceneEnd = Math.max(0, sceneDurationFrames - trailingPaddingFrames);

  return phrases.reduce<TimedPhrase[]>((acc, phrase) => {
    const previous = acc.length > 0 ? acc[acc.length - 1] : undefined;
    const from = previous
      ? Math.max(phrase.from, previous.to + minGapFrames)
      : phrase.from;
    const to = Math.min(
      sceneEnd,
      Math.max(phrase.to, from + minDurationFrames),
    );

    acc.push({
      ...phrase,
      from,
      to: Math.max(from, to),
    });

    return acc;
  }, []);
};

const getPhraseOpacity = (frame: number, from: number, to: number) => {
  const duration = Math.max(0, to - from);

  if (duration <= 1) {
    return frame >= from && frame <= to ? 1 : 0;
  }

  if (duration <= 10) {
    const midpoint = from + Math.max(1, Math.floor(duration / 2));
    return interpolate(frame, [from, midpoint, to], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return interpolate(frame, [from, from + 4, to - 4, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
};

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

/**
 * All detected silence windows in GLOBAL frame coordinates.
 * Waveform-mapped via FFmpeg silencedetect (threshold −29.75 dB, min 230 ms)
 * on voiceover-dani.mp3. Each entry covers the full silence onset → end.
 */
const MUSIC_LIFTS = [
  // ── Early / tension scene ──────────────────────────────────────────────────
  {from:  101, to:  119},  // 1.375–1.950s (576ms)
  {from:  155, to:  169},  // 3.169–3.620s → tension cut
  {from:  208, to:  218},  // 4.933–5.264s
  {from:  243, to:  254},  // 6.108–6.470s
  {from:  306, to:  318},  // 8.197–8.615s → lore cut
  // ── Lore scene ─────────────────────────────────────────────────────────────
  {from:  396, to:  406},  // 11.193–11.535s
  {from:  431, to:  440},  // 12.354–12.666s
  {from:  467, to:  479},  // 13.553–13.977s → lore.to
  {from:  536, to:  551},  // 15.871–16.366s
  // ── Roberto scene ──────────────────────────────────────────────────────────
  {from:  662, to:  672},  // 20.054–20.396s
  {from:  719, to:  731},  // 21.946–22.366s → roberto.to
  // ── Carmen scene ───────────────────────────────────────────────────────────
  {from:  781, to:  794},  // 24.030–24.456s
  {from:  829, to:  840},  // 25.638–25.991s → carmen.to
  // ── Build scene ────────────────────────────────────────────────────────────
  {from:  878, to:  889},  // 27.257–27.619s
  {from:  932, to:  943},  // 29.061–29.439s
  {from:  987, to:  998},  // 30.894–31.254s → build.to
  // ── Pause → bigIdea ────────────────────────────────────────────────────────
  {from: 1093, to: 1106},  // 34.440–34.868s → bigIdea.to
  // ── Transition scene ───────────────────────────────────────────────────────
  {from: 1146, to: 1157},  // 36.192–36.569s
  {from: 1197, to: 1208},  // 37.907–38.258s → transition.to
  // ── Mobile scene ───────────────────────────────────────────────────────────
  {from: 1235, to: 1246},  // 39.149–39.543s
  {from: 1286, to: 1299},  // 40.861–41.313s → mobile.to
  // ── Kiosk scene ────────────────────────────────────────────────────────────
  {from: 1347, to: 1357},  // 42.913–43.247s
  {from: 1378, to: 1385},  // 43.938–44.174s → kiosk.to
  // ── Admin scene ────────────────────────────────────────────────────────────
  {from: 1405, to: 1414},  // 44.844–45.129s
  {from: 1455, to: 1465},  // 46.500–46.829s → admin.to
  // ── Benefits / resolution ──────────────────────────────────────────────────
  {from: 1545, to: 1554},  // 49.487–49.796s
  {from: 1586, to: 1594},  // 50.869–51.122s → resolution.from
  // ── Resolution scene ───────────────────────────────────────────────────────
  {from: 1625, to: 1633},  // 52.170–52.426s
  {from: 1664, to: 1671},  // 53.455–53.707s
  {from: 1698, to: 1707},  // 54.604–54.905s → final.from
  // ── Final scene ────────────────────────────────────────────────────────────
  {from: 1730, to: 1740},  // 55.676–55.990s
  {from: 1757, to: 1765},  // 56.567–56.849s
  {from: 1789, to: 1799},  // 57.620–57.977s
  {from: 1818, to: 1827},  // 58.606–58.909s
] as const;

const getVoiceoverVolume = (frame: number) => {
  return interpolate(
    frame,
    [0, 10, AUDIO_TOTAL_FRAMES - 14, AUDIO_TOTAL_FRAMES],
    [0, VOICEOVER_BASE_VOLUME, VOICEOVER_BASE_VOLUME, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
};

const getMusicVolume = (frame: number) => {
  // ── Bed curve ──────────────────────────────────────────────────────────────
  // FIX: COLD_OPEN_FRAMES === TIMELINE.tension.from (both = 169) — duplicate
  // removed. The transition from cold-open to under-VO volume happens at
  // TIMELINE.tension.from in a single keyframe.
  const bed = interpolate(
    frame,
    [
      0,
      MUSIC_FADE_IN_FRAMES,
      COLD_OPEN_DURATION,
      TIMELINE.tension.from,
      TIMELINE.bigIdea.from,
      TIMELINE.final.from - 12,
      CONDO_PRODUCT_TOTAL_FRAMES - MUSIC_FADE_OUT_FRAMES,
      CONDO_PRODUCT_TOTAL_FRAMES,
    ],
    [
      0,
      MUSIC_COLD_OPEN_VOLUME * 0.7,
      MUSIC_COLD_OPEN_VOLUME,
      MUSIC_UNDER_VO_VOLUME,          // was: 0.92× then UNDER (two frames, same value)
      MUSIC_UNDER_VO_VOLUME * 0.7,
      MUSIC_FINAL_VOLUME,
      MUSIC_FINAL_VOLUME,
      0,
    ],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  const coldOpenSwell = interpolate(
    frame,
    [0, COLD_OPEN_DURATION - 10, COLD_OPEN_DURATION + 10],
    [0, 0.012, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut},
  );

  const tensionUndertone = interpolate(
    frame,
    [TIMELINE.tension.from, TIMELINE.tension.from + 18, TIMELINE.tension.to],
    [0, 0.008, 0.004],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut},
  );

  const ideaLift = interpolate(
    frame,
    [TIMELINE.bigIdea.from - 8, TIMELINE.bigIdea.from + 6, TIMELINE.bigIdea.to],
    [0, MUSIC_TRANSITION_VOLUME - MUSIC_UNDER_VO_VOLUME, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut},
  );

  const revealLift = interpolate(
    frame,
    [TIMELINE.mobile.from - 4, TIMELINE.mobile.from + 10, TIMELINE.mobile.from + 26],
    [0, 0.01, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut},
  );

  const finalLift = interpolate(
    frame,
    [TIMELINE.final.from - 12, TIMELINE.final.from + 24, CONDO_PRODUCT_TOTAL_FRAMES - MUSIC_FADE_OUT_FRAMES],
    [0, 0.014, 0.01],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  // ── Pause lifts — music fills every detected silence window ────────────────
  // Pre-attack 10 frames before silence onset, tail 14 frames after silence end.
  const pauseLiftWindow = (from: number, to: number) => {
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

  return bed + coldOpenSwell + tensionUndertone + ideaLift + revealLift + finalLift + pauseLift;
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
      [0, 8, 24, HANDOFF_SCENE_DURATION - 16, HANDOFF_SCENE_DURATION],
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
  bodyDelay ?: number;
  titleSize ?: number;
  titleLineHeight?: number;
  bodySize ?: number;
  bodyLineHeight?: number;
  eyebrowSize ?: number;
  eyebrowSpacing?: number;
}> = ({
  title,
  body,
  eyebrow,
  eyebrowColor = BLUE,
  centered     = false,
  maxWidth     = 760,
  titleColor   = TEXT,
  delay        = 0,
  bodyDelay    = 6,
  titleSize    = 100,
  titleLineHeight = 0.96,
  bodySize     = 36,
  bodyLineHeight = 1.28,
  eyebrowSize  = 15,
  eyebrowSpacing = SP.sm,
}) => {
  const frame   = useCurrentFrame();
  const {fps}   = useVideoConfig();
  const enter   = enterProgress(frame, fps, delay);
  const bodyEnter = enterProgress(frame, fps, delay + bodyDelay);
  const opacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const y = interpolate(enter, [0, 1], [20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const bodyOpacity = interpolate(bodyEnter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const bodyY = interpolate(bodyEnter, [0, 1], [18, 0], {
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
            fontSize     : eyebrowSize,
            lineHeight   : 1,
            fontWeight   : 700,
            letterSpacing: "0.09em",
            color        : eyebrowColor,
            textTransform: "uppercase",
            marginBottom : eyebrowSpacing,
          }}
        >
          {eyebrow}
        </div>
      ) : null}

      <div
        style={{
          fontFamily   : DISPLAY_FONT,
          fontSize     : titleSize,
          lineHeight   : titleLineHeight,
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
            fontSize     : bodySize,
            lineHeight   : bodyLineHeight,
            fontWeight   : 400,
            letterSpacing: "-0.015em",
            color        : TEXT_MID,
            opacity      : bodyOpacity,
            transform    : `translateY(${bodyY}px)`,
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
  entranceDelay?: number;
}> = ({
  src,
  startFrom,
  totalDuration,
  frameWidth,
  frameHeight,
  objectFit = "contain",
  accent = BLUE,
  entranceDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = enterProgress(frame, fps, entranceDelay);
  const revealOpacity = interpolate(frame, [entranceDelay, entranceDelay + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  const opacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) * revealOpacity;

  const cardY = interpolate(enter, [0, 1], [14, 0], {
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
  const hookOneFrom = secondsToFrames(2.215);
  const hookOneTo = secondsToFrames(3.563);
  const hookTwoFrom = secondsToFrames(4.34);
  const hookTwoTo = secondsToFrames(5.924);
  const reveal   = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut,
  });
  const firstLine = interpolate(frame, [hookOneFrom, hookOneFrom + 8, hookOneTo - 8, hookOneTo], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut,
  });
  const secondLine = interpolate(frame, [hookTwoFrom, hookTwoFrom + 8, hookTwoTo - 8, hookTwoTo], [0, 1, 1, 0], {
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

const TensionScene: React.FC<{totalDuration: number}> = ({totalDuration}) => {
  const frame = useCurrentFrame();
  const opacity = fadeScene(frame, totalDuration, 10, 10);
  const zoom = interpolate(frame, [0, totalDuration], [1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  const lines = [
    {
      text: "Y no es solo la espera...",
      from: secondsToFrames(6.78) - TIMELINE.tension.from,
      to: secondsToFrames(8.27) - TIMELINE.tension.from,
    },
    {
      text: "es no saber...",
      from: secondsToFrames(8.799) - TIMELINE.tension.from,
      to: secondsToFrames(9.73) - TIMELINE.tension.from,
    },
    {
      text: "quién está realmente entrando.",
      from: secondsToFrames(10.104) - TIMELINE.tension.from,
      to: secondsToFrames(11.952) - TIMELINE.tension.from,
    },
  ] as const;

  return (
    <AbsoluteFill style={{overflow: "hidden", opacity, background: `linear-gradient(168deg, ${BG} 0%, ${BG_SOFT} 60%, #EFF6FF 100%)`}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 78% 56% at 50% 34%, rgba(15,23,42,0.14) 0%, rgba(15,23,42,0.04) 46%, transparent 74%)",
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: 88,
          transform: `scale(${zoom})`,
        }}
      >
        <div style={{opacity: 0.72, transform: "translateY(18px)"}}>
          <MascotMoment
            startFrom={VIDEO_OFFSETS.mascotColdOpen + 42}
            width={456}
            height={456}
            totalDuration={totalDuration}
            opacity={1}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: `0 ${SP.frame * 2.4}px 88px`,
        }}
      >
        <div style={{position: "relative", width: 960, minHeight: 252, transform: "translateY(-54px)"}}>
          {lines.map((line) => {
            const lineOpacity = interpolate(
              frame,
              [line.from, line.from + 10, line.to - 12, line.to],
              [0, 1, 1, 0],
              {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut},
            );
            return (
              <div
                key={line.text}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: lineOpacity,
                  fontFamily: DISPLAY_FONT,
                  fontSize: 78,
                  lineHeight: 1.02,
                  fontWeight: 600,
                  letterSpacing: "-0.028em",
                  color: TEXT,
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const CharacterFocusScene: React.FC<{
  totalDuration: number;
  accent: string;
  accentKey: AccentKey;
  eyebrow: string;
  title: string;
  body: string;
  phrases?: TimedPhrase[];
  card: React.ReactNode;
  align: "left" | "right";
}> = ({totalDuration, accent, accentKey, eyebrow, title, body, phrases, card, align}) => {
  const frame = useCurrentFrame();
  const opacity = fadeScene(frame, totalDuration, 10, 10);
  const editorialFocus = eyebrow === "Lore · Residente" || eyebrow === "Carmen · Administración";
  const textLift = interpolate(frame, [0, totalDuration], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const layoutWidth = editorialFocus ? 1360 : 1400;
  const gridTemplateColumns = align === "left"
    ? (editorialFocus ? "minmax(0, 1.02fr) minmax(320px, 0.78fr)" : "minmax(0, 1.04fr) minmax(320px, 0.8fr)")
    : (editorialFocus ? "minmax(320px, 0.78fr) minmax(0, 1.02fr)" : "minmax(320px, 0.8fr) minmax(0, 1.04fr)");
  const textMaxWidth = editorialFocus ? 472 : 500;
  const textJustify = align === "left" ? "flex-start" : "flex-start";
  const cardJustify = align === "left" ? "flex-start" : "flex-end";
  const cardTransformOrigin = align === "left" ? "left top" : "right top";
  const cardTransform = editorialFocus
    ? (align === "left" ? "translateY(46px) translateX(-8px) scale(1.03)" : "translateY(46px) translateX(8px) scale(1.03)")
    : (align === "left" ? "translateY(18px) translateX(-4px) scale(1.02)" : "translateY(18px) translateX(4px) scale(1.02)");

  return (
    <Background opacity={opacity} accent={accentKey}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `${SP.frame - 8}px ${SP.frame - 12}px`,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: layoutWidth,
            display: "grid",
            gridTemplateColumns,
            alignItems: editorialFocus ? "start" : "center",
            gap: editorialFocus ? 30 : 34,
          }}
        >
          {align === "left" ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: textJustify,
                  paddingTop: editorialFocus ? 14 : 0,
                  transform: editorialFocus ? `translateY(${textLift}px)` : undefined,
                }}
              >
                {phrases ? (
                  <div style={{width: textMaxWidth, position: "relative", minHeight: editorialFocus ? 290 : 250}}>
                    <div
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 18,
                        lineHeight: 1,
                        fontWeight: 700,
                        letterSpacing: "0.09em",
                        color: accent,
                        textTransform: "uppercase",
                        marginBottom: 20,
                      }}
                    >
                      {eyebrow}
                    </div>
                    <div style={{position: "relative", minHeight: 220}}>
                      {phrases.map((phrase, index) => (
                        <div
                          key={phrase.text}
                          style={{
                            position: "absolute",
                            inset: 0,
                            opacity: getPhraseOpacity(frame, phrase.from, phrase.to),
                            fontFamily: index === 0 ? DISPLAY_FONT : BODY_FONT,
                            fontSize: index === 0 ? (editorialFocus ? 80 : 86) : 38,
                            lineHeight: index === 0 ? (editorialFocus ? 1.01 : 0.99) : 1.24,
                            fontWeight: index === 0 ? 600 : 500,
                            letterSpacing: index === 0 ? "-0.03em" : "-0.02em",
                            color: index === 0 ? TEXT : TEXT_MID,
                          }}
                        >
                          {phrase.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ExplainerText
                    eyebrow={eyebrow}
                    eyebrowColor={accent}
                    title={title}
                    body={body}
                    maxWidth={textMaxWidth}
                    delay={4}
                    bodyDelay={12}
                    titleSize={editorialFocus ? 80 : 86}
                    titleLineHeight={editorialFocus ? 1.01 : 0.99}
                    bodySize={editorialFocus ? 34 : 34}
                    bodyLineHeight={editorialFocus ? 1.32 : 1.28}
                    eyebrowSize={18}
                    eyebrowSpacing={20}
                  />
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: cardJustify,
                  alignItems: "flex-start",
                  transform: cardTransform,
                  transformOrigin: cardTransformOrigin,
                }}
              >
                {card}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: cardJustify,
                  alignItems: "flex-start",
                  transform: cardTransform,
                  transformOrigin: cardTransformOrigin,
                }}
              >
                {card}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: textJustify,
                  paddingTop: editorialFocus ? 14 : 0,
                  transform: editorialFocus ? `translateY(${textLift}px)` : undefined,
                }}
              >
                {phrases ? (
                  <div style={{width: textMaxWidth, position: "relative", minHeight: editorialFocus ? 290 : 250}}>
                    <div
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 18,
                        lineHeight: 1,
                        fontWeight: 700,
                        letterSpacing: "0.09em",
                        color: accent,
                        textTransform: "uppercase",
                        marginBottom: 20,
                      }}
                    >
                      {eyebrow}
                    </div>
                    <div style={{position: "relative", minHeight: 220}}>
                      {phrases.map((phrase, index) => (
                        <div
                          key={phrase.text}
                          style={{
                            position: "absolute",
                            inset: 0,
                            opacity: getPhraseOpacity(frame, phrase.from, phrase.to),
                            fontFamily: index === 0 ? DISPLAY_FONT : BODY_FONT,
                            fontSize: index === 0 ? (editorialFocus ? 80 : 86) : 38,
                            lineHeight: index === 0 ? (editorialFocus ? 1.01 : 0.99) : 1.24,
                            fontWeight: index === 0 ? 600 : 500,
                            letterSpacing: index === 0 ? "-0.03em" : "-0.02em",
                            color: index === 0 ? TEXT : TEXT_MID,
                          }}
                        >
                          {phrase.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ExplainerText
                    eyebrow={eyebrow}
                    eyebrowColor={accent}
                    title={title}
                    body={body}
                    maxWidth={textMaxWidth}
                    delay={4}
                    bodyDelay={12}
                    titleSize={editorialFocus ? 80 : 86}
                    titleLineHeight={editorialFocus ? 1.01 : 0.99}
                    bodySize={editorialFocus ? 34 : 34}
                    bodyLineHeight={editorialFocus ? 1.32 : 1.28}
                    eyebrowSize={18}
                    eyebrowSpacing={20}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Background>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cinematic breath between build and bigIdea.
 * No content — just the neutral background for a clean visual pause.
 */
const PauseScene: React.FC = () => (
  <Background accent="neutral">
    <AbsoluteFill />
  </Background>
);

// ─────────────────────────────────────────────────────────────────────────────

const ProblemBuildScene: React.FC<{totalDuration: number}> = ({totalDuration}) => {
  const frame = useCurrentFrame();
  const opacity = fadeScene(frame, totalDuration, 8, 6);
  const buildIn = spring({
    frame: frame - 4,
    fps: FPS,
    config: {damping: 18, stiffness: 108, mass: 0.9},
  });
  const buildOpacity = interpolate(buildIn, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buildY = interpolate(buildIn, [0, 1], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Leave a short cinematic breath after "sin herramientas" without adding a blank scene.
  const trailingHoldStart = Math.max(0, totalDuration - 10);
  const trailingHoldOpacity = interpolate(
    frame,
    [0, trailingHoldStart, totalDuration],
    [1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  return (
    <Background opacity={opacity} accent="neutral">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${SP.frame * 2}px`,
        }}
      >
        <div
          style={{
            width: 1280,
            opacity: buildOpacity * trailingHoldOpacity,
            transform: `translateY(${buildY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 90,
              lineHeight: 0.95,
              fontWeight: 600,
              letterSpacing: "-0.033em",
              color: TEXT,
            }}
          >
            Demasiados pasos.
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: DISPLAY_FONT,
              fontSize: 84,
              lineHeight: 0.97,
              fontWeight: 600,
              letterSpacing: "-0.031em",
              color: TEXT_MID,
            }}
          >
            Demasiadas suposiciones.
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: DISPLAY_FONT,
              fontSize: 78,
              lineHeight: 1,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: TEXT,
            }}
          >
            Demasiada responsabilidad... sin herramientas.
          </div>
        </div>
      </div>
    </Background>
  );
};

const TurningPointScene: React.FC<{
  totalDuration: number;
  title        : string;
  subtitle    ?: string;
  showMascot  ?: boolean;
  titleDelay  ?: number;
  bodyDelay   ?: number;
}> = ({totalDuration, title, subtitle, showMascot = false, titleDelay = 4, bodyDelay = 14}) => {
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
          maxWidth={980}
          delay={titleDelay}
          bodyDelay={bodyDelay}
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
  cardEntranceDelay?: number;
}> = ({
  totalDuration,
  src,
  startFrom,
  eyebrow,
  title,
  body,
  accent,
  accentKey,
  align,
  frameHeight,
  cardEntranceDelay = 0,
}) => {
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
      entranceDelay={cardEntranceDelay}
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

  // Distribute beats evenly across the scene so each phrase breathes
  const beatDur = Math.floor(totalDuration / 3);
  const beats = [
    {label: "Sin apps nuevas", color: BLUE,   from: 0,           to: beatDur},
    {label: "Sin aprendizaje", color: PURPLE, from: beatDur,     to: beatDur * 2},
    {label: "Sin fricción",    color: TEAL,   from: beatDur * 2, to: totalDuration},
  ];

  // Springs for scale — called unconditionally (no hooks in loops)
  const sp1 = spring({frame: frame - beats[0].from - 4, fps, config: {damping: 18, stiffness: 120, mass: 0.9}});
  const sp2 = spring({frame: frame - beats[1].from - 4, fps, config: {damping: 18, stiffness: 120, mass: 0.9}});
  const sp3 = spring({frame: frame - beats[2].from - 4, fps, config: {damping: 18, stiffness: 120, mass: 0.9}});
  const springs = [sp1, sp2, sp3];

  const getBeatOpacity = (from: number, to: number) => {
    const fadeLen = Math.max(6, Math.min(12, Math.floor((to - from) * 0.2)));
    return interpolate(
      frame,
      [from, from + fadeLen, to - fadeLen, to],
      [0, 1, 1, 0],
      {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut},
    );
  };

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
            const beatOpacity = getBeatOpacity(beat.from, beat.to);
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

const ResolutionScene: React.FC<{totalDuration: number}> = ({totalDuration}) => {
  const opacity = fadeScene(useCurrentFrame(), totalDuration, 10, 12);

  return (
    <Background opacity={opacity} accent="neutral">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `0 ${SP.frame * 2}px`,
        }}
      >
        <ExplainerText
          title="Más simple..."
          body="pero también... más seguro."
          centered
          maxWidth={980}
          delay={4}
          bodyDelay={28}
        />
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

  // CondoBuddy: fades in early, holds through most of scene
  const titleOpacity = interpolate(
    frame,
    [0, 10, totalDuration - 16, totalDuration],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut},
  );
  // Acceso sin fricción: enters after CondoBuddy is established, holds to end
  const subOpacity = interpolate(
    frame,
    [55, 78, totalDuration - 10, totalDuration],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut},
  );
  const titleY = interpolate(frame, [0, 14], [20, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut});
  const subY   = interpolate(subOpacity, [0, 1], [14, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

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
            opacity  : titleOpacity,
            transform: `translateY(${titleY}px)`,
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
            opacity      : subOpacity,
            transform    : `translateY(${subY}px)`,
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

      <Sequence from={TIMELINE.tension.from} durationInFrames={sceneDuration("tension")}>
        <TensionScene totalDuration={sceneDuration("tension")} />
      </Sequence>

      <Sequence from={TIMELINE.lore.from} durationInFrames={sceneDuration("lore")}>
        <CharacterFocusScene
          totalDuration={sceneDuration("lore")}
          accent={BLUE}
          accentKey="blue"
          eyebrow="Lore · Residente"
          title="Lore solo quiere que su familia esté tranquila..."
          body="sin dudas... sin riesgos."
          phrases={normalizeTimedPhrases({
            phrases: [
              {
                text: "Lorena solo quiere que su familia esté tranquila...",
                from: secondsToFrames(12.995) - TIMELINE.lore.from,
                to: secondsToFrames(15.953) - TIMELINE.lore.from,
              },
              {
                text: "sin dudas...",
                from: secondsToFrames(16.28) - TIMELINE.lore.from,
                to: secondsToFrames(17.18) - TIMELINE.lore.from,
              },
              {
                text: "sin riesgos.",
                from: secondsToFrames(17.506) - TIMELINE.lore.from,
                to: secondsToFrames(18.583) - TIMELINE.lore.from,
              },
            ],
            minDurationFrames: MIN_PHRASE_DURATION_FRAMES,
            sceneDurationFrames: sceneDuration("lore"),
          })}
          align="left"
          card={<RoleCard name="Lore" role="Residente" accent={BLUE} sketch={<LoreSketch />} />}
        />
      </Sequence>

      <Sequence from={TIMELINE.roberto.from} durationInFrames={sceneDuration("roberto")}>
        <CharacterFocusScene
          totalDuration={sceneDuration("roberto")}
          accent={TEAL}
          accentKey="teal"
          eyebrow="Roberto · Guardia"
          title="Roberto quiere hacer bien su trabajo..."
          body="pero depende de llamadas, libretas... y decisiones en segundos."
          phrases={normalizeTimedPhrases({
            phrases: [
              {
                text: "Roberto quiere hacer bien su trabajo...",
                from: secondsToFrames(19.725) - TIMELINE.roberto.from,
                to: secondsToFrames(21.644) - TIMELINE.roberto.from,
              },
              {
                text: "pero depende de llamadas, libretas...",
                from: secondsToFrames(22.092) - TIMELINE.roberto.from,
                to: secondsToFrames(23.902) - TIMELINE.roberto.from,
              },
              {
                text: "y decisiones en segundos.",
                from: secondsToFrames(24.088) - TIMELINE.roberto.from,
                to: secondsToFrames(24.924) - TIMELINE.roberto.from,
              },
            ],
            minDurationFrames: MIN_PHRASE_DURATION_FRAMES,
            sceneDurationFrames: sceneDuration("roberto"),
          })}
          align="right"
          card={<RoleCard name="Roberto" role="Guardia" accent={TEAL} sketch={<RobertSketch />} />}
        />
      </Sequence>

      <Sequence from={TIMELINE.carmen.from} durationInFrames={sceneDuration("carmen")}>
        <CharacterFocusScene
          totalDuration={sceneDuration("carmen")}
          accent={PURPLE}
          accentKey="purple"
          eyebrow="Carmen · Administración"
          title="Y Carmen necesita control..."
          body="pero no tiene visibilidad real..."
          phrases={normalizeTimedPhrases({
            phrases: [
              {
                text: "Y Carmen necesita control...",
                from: 0,
                to: secondsToFrames(27.991) - TIMELINE.carmen.from,
              },
              {
                text: "pero no tiene visibilidad real...",
                from: secondsToFrames(27.991) - TIMELINE.carmen.from,
                to: secondsToFrames(29.953) - TIMELINE.carmen.from,
              },
              {
                text: "de lo que está pasando.",
                from: secondsToFrames(30.511) - TIMELINE.carmen.from,
                to: Math.max(
                  secondsToFrames(33.727) - TIMELINE.carmen.from,
                  sceneDuration("carmen") - 12,
                ),
              },
            ],
            minDurationFrames: MIN_PHRASE_DURATION_FRAMES,
            sceneDurationFrames: sceneDuration("carmen"),
          })}
          align="left"
          card={<RoleCard name="Carmen" role="Administración" accent={PURPLE} sketch={<CarmenSketch />} />}
        />
      </Sequence>

      <Sequence from={TIMELINE.build.from} durationInFrames={sceneDuration("build")}>
        <ProblemBuildScene totalDuration={sceneDuration("build")} />
      </Sequence>

      <Sequence from={TIMELINE.pause.from} durationInFrames={sceneDuration("pause")}>
        <PauseScene />
      </Sequence>

      <Sequence from={TIMELINE.bigIdea.from} durationInFrames={sceneDuration("bigIdea")}>
        <TurningPointScene
          totalDuration={sceneDuration("bigIdea")}
          title="¿Y si nadie tuviera que instalar nada?"
          titleDelay={4}
        />
      </Sequence>

      <Sequence from={TIMELINE.handoff.from} durationInFrames={sceneDuration("handoff")}>
        <TurningPointScene
          totalDuration={sceneDuration("handoff")}
          title="¿Y si todo funcionara... desde donde ya estás?"
          subtitle="Y con lo que ya tienes..."
          showMascot
          titleDelay={0}
          bodyDelay={18}
        />
      </Sequence>

      <Sequence from={TIMELINE.mobile.from} durationInFrames={sceneDuration("mobile")}>
        <VideoScene
          totalDuration={sceneDuration("mobile")}
          src={MOBILE}
          startFrom={VIDEO_OFFSETS.mobileReveal}
          eyebrow="Lore · Residente"
          title="autorizas desde WhatsApp."
          body="Cada acceso queda registrado. Cada entrada validada."
          accent={BLUE}
          accentKey="blue"
          align="left"
          frameHeight={780}
          cardEntranceDelay={4}
        />
      </Sequence>

      <Sequence from={TIMELINE.kiosk.from} durationInFrames={sceneDuration("kiosk")}>
        <VideoScene
          totalDuration={sceneDuration("kiosk")}
          src={KIOSK}
          startFrom={VIDEO_OFFSETS.kioskReveal}
          eyebrow="Roberto · Guardia"
          title="Roberto no adivina..."
          body="actúa con información."
          accent={TEAL}
          accentKey="teal"
          align="right"
          frameHeight={720}
          cardEntranceDelay={4}
        />
      </Sequence>

      <Sequence from={TIMELINE.admin.from} durationInFrames={sceneDuration("admin")}>
        <VideoScene
          totalDuration={sceneDuration("admin")}
          src={ADMIN}
          startFrom={VIDEO_OFFSETS.adminReveal}
          eyebrow="Carmen · Administración"
          title="Y Carmen ve todo..."
          body="en tiempo real."
          accent={PURPLE}
          accentKey="purple"
          align="left"
          frameHeight={780}
        />
      </Sequence>

      <Sequence from={TIMELINE.benefits.from} durationInFrames={sceneDuration("benefits")}>
        <BenefitSequence totalDuration={sceneDuration("benefits")} />
      </Sequence>

      <Sequence from={TIMELINE.resolution.from} durationInFrames={sceneDuration("resolution")}>
        <ResolutionScene totalDuration={sceneDuration("resolution")} />
      </Sequence>

      <Sequence from={TIMELINE.final.from} durationInFrames={sceneDuration("final")}>
        <FinalScene totalDuration={sceneDuration("final")} />
      </Sequence>
    </AbsoluteFill>
  );
};

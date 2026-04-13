import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type MascotMood =
  | "neutral"
  | "curious"
  | "happy"
  | "celebrate"
  | "confused"
  | "wave";

export type MascotPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "center-right"
  | "brand-right";

const MASCOT = staticFile("assets/maxito.png");

const POSITIONS: Record<MascotPosition, React.CSSProperties> = {
  "bottom-right": { right: 72, bottom: 56 },
  "bottom-left": { left: 72, bottom: 56 },
  "top-right": { right: 72, top: 56 },
  "top-left": { left: 72, top: 56 },
  "center-right": { right: 86, top: "50%", transform: "translateY(-50%)" },
  "brand-right": { right: 172, bottom: 110 },
};

const moodTilt = (mood: MascotMood, frame: number) => {
  if (mood === "celebrate") {
    return Math.sin(frame * 0.08) * 5;
  }

  if (mood === "wave") {
    return Math.sin(frame * 0.06) * 4;
  }

  if (mood === "curious" || mood === "confused") {
    return Math.sin(frame * 0.05) * 2.5;
  }

  return Math.sin(frame * 0.04) * 1.8;
};

const moodScale = (mood: MascotMood, frame: number) => {
  if (mood === "celebrate") {
    return 1 + Math.sin(frame * 0.12) * 0.035;
  }

  if (mood === "happy") {
    return 1 + Math.sin(frame * 0.08) * 0.02;
  }

  return 1;
};

export const MascotBuddy: React.FC<{ mood?: MascotMood }> = () => {
  return (
    <Img
      src={MASCOT}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  );
};

export const AnimatedMascotWrapper: React.FC<{
  children: React.ReactNode;
  mood?: MascotMood;
}> = ({ children, mood = "neutral" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: {
      damping: 16,
      stiffness: 120,
      mass: 0.9,
    },
  });

  const opacity = interpolate(enter, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lift = interpolate(enter, [0, 1], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const floatY = Math.sin(frame * 0.05) * 7;
  const tilt = moodTilt(mood, frame);
  const scale = interpolate(enter, [0, 1], [0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${lift + floatY}px) scale(${scale * moodScale(mood, frame)}) rotate(${tilt}deg)`,
        transformOrigin: "50% 85%",
      }}
    >
      {children}
    </div>
  );
};

export const AnimatedMascot: React.FC<{
  size?: number;
  mood?: MascotMood;
  position?: MascotPosition;
  style?: React.CSSProperties;
}> = ({ size = 128, mood = "neutral", position = "bottom-right", style }) => {
  const height = Math.round(size * (797 / 842));
  const baseTransform = POSITIONS[position].transform;

  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height,
        zIndex: 40,
        pointerEvents: "none",
        filter:
          "drop-shadow(0 24px 36px rgba(59,130,246,0.16)) drop-shadow(0 8px 14px rgba(15,23,42,0.12))",
        ...POSITIONS[position],
        ...style,
      }}
    >
      <div style={baseTransform ? { transform: baseTransform } : undefined}>
        <AnimatedMascotWrapper mood={mood}>
          <MascotBuddy mood={mood} />
        </AnimatedMascotWrapper>
      </div>
    </div>
  );
};

export const MascotLayer: React.FC<{
  size?: number;
  mood?: MascotMood;
  position?: MascotPosition;
  style?: React.CSSProperties;
}> = ({ size, mood, position, style }) => {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <AnimatedMascot size={size} mood={mood} position={position} style={style} />
    </div>
  );
};

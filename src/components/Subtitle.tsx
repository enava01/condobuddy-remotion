import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Word } from "./Word";

const Subtitle: React.FC<{
  text: string;
  position: "top" | "bottom" | "center";
}> = ({ text, position }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enterFrames = Math.max(6, Math.floor(0.22 * fps));
  const exitStart = Math.max(enterFrames + 1, Math.floor(0.72 * fps));

  const enter = interpolate(frame, [0, enterFrames], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exit = interpolate(frame, [exitStart, fps], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
      }}
    >
      <AbsoluteFill>
        <Word stroke enterProgress={enter} exitProgress={exit} position={position} text={text} />
      </AbsoluteFill>
      <AbsoluteFill>
        <Word
          enterProgress={enter}
          exitProgress={exit}
          position={position}
          text={text}
          stroke={false}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Subtitle;

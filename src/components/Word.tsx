import { makeTransform, scale, translateY } from "@remotion/animation-utils";
import { loadFont } from "@remotion/google-fonts/BreeSerif";
import { fitText } from "@remotion/layout-utils";
import type React from "react";
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";

export const Word: React.FC<{
  enterProgress: number;
  exitProgress: number;
  position: "top" | "bottom" | "center";
  text: string;
  stroke: boolean;
}> = ({ enterProgress, exitProgress, position, text, stroke }) => {
  const { fontFamily } = loadFont();
  const { width } = useVideoConfig();
  const desiredFontSize = 120;

  const fittedText = fitText({
    fontFamily,
    text,
    withinWidth: width * 0.8,
  });

  const fontSize = Math.min(desiredFontSize, fittedText.fontSize);
  const topByPosition = position === "top" ? 220 : undefined;
  const bottomByPosition = position === "bottom" ? 260 : undefined;
  const isCentered = position === "center";
  const scaleValue = interpolate(enterProgress - exitProgress, [0, 1], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateYValue = interpolate(
    enterProgress - exitProgress,
    [0, 1],
    [position === "top" ? -32 : 42, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: isCentered ? "center" : undefined,
        alignItems: "center",
        top: topByPosition,
        bottom: bottomByPosition,
        height: isCentered ? undefined : 220,
      }}
    >
      <div
        style={{
          fontSize,
          color: "white",
          WebkitTextStroke: stroke ? "20px black" : undefined,
          transform: makeTransform([
            scale(scaleValue),
            translateY(translateYValue),
          ]),
          fontFamily,
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 0.98,
          letterSpacing: 1,
          maxWidth: width * 0.86,
          padding: "0 24px",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

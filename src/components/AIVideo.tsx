import { loadFont } from "@remotion/google-fonts/BreeSerif";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { INTRO_DURATION, SEQUENCE_PREMOUNT } from "../lib/constants";
import { TimelineSchema } from "../lib/types";
import { calculateFrameTiming, getAudioPath } from "../lib/utils";
import { Background } from "./Background";
import Subtitle from "./Subtitle";

export const aiVideoSchema = z.object({
  timeline: TimelineSchema.nullable(),
});

const { fontFamily } = loadFont();

const IntroCard: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 12], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [INTRO_DURATION - 10, INTRO_DURATION], [0, 1], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        display: "flex",
        zIndex: 10,
        opacity: 1 - exit,
      }}
    >
      <div
        style={{
          fontSize: 120,
          lineHeight: "0.95em",
          width: "87%",
          color: "black",
          fontFamily,
          textTransform: "uppercase",
          backgroundColor: "#f7dd2b",
          padding: "26px 36px",
          border: "10px solid black",
          transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px) scale(${interpolate(
            enter,
            [0, 1],
            [0.96, 1],
          )})`,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.18)",
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};

export const AIVideo: React.FC<z.infer<typeof aiVideoSchema>> = ({
  timeline,
}) => {
  if (!timeline) {
    throw new Error("Expected timeline to be fetched");
  }

  const { id } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "white" }}>
      <Sequence durationInFrames={INTRO_DURATION} premountFor={SEQUENCE_PREMOUNT}>
        <IntroCard title={timeline.shortTitle} />
      </Sequence>

      {timeline.elements.map((element, index) => {
        const { startFrame, duration } = calculateFrameTiming(
          element.startMs,
          element.endMs,
          { includeIntro: index === 0 },
        );

        return (
          <Sequence
            key={`element-${index}`}
            from={startFrame}
            durationInFrames={duration}
            premountFor={SEQUENCE_PREMOUNT}
          >
            <Background project={id} item={element} />
          </Sequence>
        );
      })}

      {timeline.text.map((element, index) => {
        const { startFrame, duration } = calculateFrameTiming(
          element.startMs,
          element.endMs,
          { addIntroOffset: true },
        );

        return (
          <Sequence
            key={`element-${index}`}
            from={startFrame}
            durationInFrames={duration}
            premountFor={SEQUENCE_PREMOUNT}
          >
            <Subtitle key={index} text={element.text} position={element.position} />
          </Sequence>
        );
      })}

      {timeline.audio.map((element, index) => {
        const { startFrame, duration } = calculateFrameTiming(
          element.startMs,
          element.endMs,
          { addIntroOffset: true },
        );

        return (
          <Sequence
            key={`element-${index}`}
            from={startFrame}
            durationInFrames={duration}
            premountFor={SEQUENCE_PREMOUNT}
          >
            <Audio
              src={staticFile(getAudioPath(id, element.audioUrl))}
              volume={(f) =>
                interpolate(f, [0, 6, Math.max(duration - 8, 6), duration], [0, 1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              }
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

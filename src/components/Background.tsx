import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FPS } from "../lib/constants";
import { BackgroundElement } from "../lib/types";
import { calculateBlur, getImagePath } from "../lib/utils";

const EXTRA_SCALE = 0.2;

export const Background: React.FC<{
  item: BackgroundElement;
  project: string;
}> = ({ item, project }) => {
  const frame = useCurrentFrame();
  const localMs = (frame / FPS) * 1000;
  let animScale = 1 + EXTRA_SCALE;

  const currentScaleAnim = item.animations?.find(
    (anim) =>
      anim.type === "scale" && anim.startMs <= localMs && anim.endMs >= localMs,
  );

  if (currentScaleAnim) {
    const animationStartFrame = Math.floor(
      (currentScaleAnim.startMs * FPS) / 1000,
    );
    const animationEndFrame = Math.max(
      animationStartFrame + 1,
      Math.ceil((currentScaleAnim.endMs * FPS) / 1000),
    );

    animScale = interpolate(
      frame,
      [animationStartFrame, animationEndFrame],
      [currentScaleAnim.from, currentScaleAnim.to],
      {
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  }

  const blur = calculateBlur({ item, localMs });
  const maxBlur = 25;
  const currentBlur = maxBlur * blur;
  const durationFrames = Math.max(
    1,
    Math.ceil(((item.endMs - item.startMs) * FPS) / 1000),
  );
  const opacity = getTransitionOpacity({
    durationFrames,
    enterTransition: item.enterTransition,
    exitTransition: item.exitTransition,
    frame,
  });

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(getImagePath(project, item.imageUrl))}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          opacity,
          objectFit: "cover",
          filter: `blur(${currentBlur}px)`,
          WebkitFilter: `blur(${currentBlur}px)`,
          transform: `scale(${animScale})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.05) 38%, rgba(0,0,0,0.34) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const getTransitionOpacity = ({
  durationFrames,
  enterTransition,
  exitTransition,
  frame,
}: {
  durationFrames: number;
  enterTransition?: BackgroundElement["enterTransition"];
  exitTransition?: BackgroundElement["exitTransition"];
  frame: number;
}) => {
  const transitionFrames = Math.min(
    Math.floor(0.4 * FPS),
    Math.floor(durationFrames / 2),
  );

  if (transitionFrames <= 0) {
    return 1;
  }

  const enterOpacity =
    enterTransition === "fade" || enterTransition === "blur"
      ? interpolate(frame, [0, transitionFrames], [0, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  const exitOpacity =
    exitTransition === "fade" || exitTransition === "blur"
      ? interpolate(
          frame,
          [durationFrames - transitionFrames, durationFrames],
          [1, 0],
          {
            easing: Easing.in(Easing.cubic),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        )
      : 1;

  return Math.min(enterOpacity, exitOpacity);
};

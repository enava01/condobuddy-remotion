import { staticFile } from "remotion";
import { FPS, INTRO_DURATION } from "./constants";
import { BackgroundElement, Timeline } from "./types";

export const loadTimelineFromFile = async (filename: string) => {
  const res = await fetch(staticFile(filename));
  const json = await res.json();
  const timeline = json as Timeline;
  timeline.elements.sort((a, b) => a.startMs - b.startMs);

  const lengthMs = getTimelineDurationMs(timeline);
  const lengthFrames = Math.ceil((lengthMs / 1000) * FPS);

  return { timeline, lengthFrames };
};

const getLastEndMs = <
  T extends {
    endMs: number;
  },
>(
  items: T[],
) => {
  return items.length === 0
    ? 0
    : items.reduce((max, item) => Math.max(max, item.endMs), 0);
};

export const getTimelineDurationMs = (timeline: Timeline) => {
  return Math.max(
    getLastEndMs(timeline.elements),
    getLastEndMs(timeline.text),
    getLastEndMs(timeline.audio),
  );
};

export const calculateFrameTiming = (
  startMs: number,
  endMs: number,
  options: { includeIntro?: boolean; addIntroOffset?: boolean } = {},
) => {
  const { includeIntro = false, addIntroOffset = false } = options;

  const baseStartFrame = Math.floor((startMs * FPS) / 1000);
  const baseDuration = Math.max(1, Math.ceil(((endMs - startMs) * FPS) / 1000));
  const startFrame = baseStartFrame + (addIntroOffset ? INTRO_DURATION : 0);
  const duration = baseDuration + (includeIntro ? INTRO_DURATION : 0);

  return { startFrame, duration };
};

export const calculateBlur = ({
  item,
  localMs,
}: {
  item: BackgroundElement;
  localMs: number;
}) => {
  const maxBlur = 1;
  const fadeMs = 1000;

  const startMs = item.startMs;
  const endMs = item.endMs;

  const { enterTransition } = item;
  const { exitTransition } = item;

  if (enterTransition === "blur" && localMs < fadeMs) {
    return (1 - localMs / fadeMs) * maxBlur;
  }

  if (exitTransition === "blur" && localMs > endMs - startMs - fadeMs) {
    return (1 - (endMs - startMs - localMs) / fadeMs) * maxBlur;
  }

  return 0;
};

export const getTimelinePath = (proj: string) =>
  `content/${proj}/timeline.json`;

export const getImagePath = (proj: string, uid: string) =>
  `content/${proj}/images/${uid}.png`;

export const getAudioPath = (proj: string, uid: string) =>
  `content/${proj}/audio/${uid}.mp3`;

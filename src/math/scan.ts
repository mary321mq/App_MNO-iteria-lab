import { ScanInterval } from "../types/numerical";

export function scanIntervals(
  f: (x: number) => number,
  min: number,
  max: number,
  steps = 500,
): ScanInterval[] {
  const intervals: ScanInterval[] = [];
  const dx = (max - min) / steps;
  let previousX = min;
  let previousY: number | null = null;

  try {
    previousY = f(previousX);
  } catch {
    previousY = null;
  }

  for (let index = 1; index <= steps; index += 1) {
    const x = min + dx * index;
    let y: number | null = null;
    try {
      y = f(x);
    } catch {
      y = null;
    }

    if (previousY !== null && y !== null) {
      if (previousY === 0 || y === 0 || previousY * y < 0) {
        const mid = (previousX + x) / 2;
        intervals.push({
          a: previousX,
          b: x,
          kind: mid < 0 ? "negative" : mid > 0 ? "positive" : "mixed",
        });
      }
    }

    previousX = x;
    previousY = y;
  }

  return intervals;
}

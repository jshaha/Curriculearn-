export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (start: number, end: number, alpha: number): number =>
  start + (end - start) * alpha;

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");

export const uniqueSorted = (values: string[]): string[] =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

export const isValidUrl = (value: string): boolean => {
  try {
    // mailto links are valid for profile/contact usage.
    if (value.startsWith("mailto:")) {
      return true;
    }

    const url = new URL(value);
    return Boolean(url.protocol && url.host);
  } catch {
    return false;
  }
};

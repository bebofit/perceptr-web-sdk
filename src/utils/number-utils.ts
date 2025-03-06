import { isNumber } from "./type-utils";

/**
 * Clamps a value to a range.
 * @param value the value to clamp
 * @param min the minimum value
 * @param max the maximum value
 * @param label if provided then enables logging and prefixes all logs with labels
 * @param fallbackValue if provided then returns this value if the value is not a valid number
 */
export function clampToRange(
  value: unknown,
  min: number,
  max: number,
  label?: string,
  fallbackValue?: number
): number {
  if (min > max) {
    min = max;
  }
  if (!isNumber(value)) {
    return clampToRange(fallbackValue || max, min, max, label);
  } else if (value > max) {
    return max;
  } else if (value < min) {
    return min;
  } else {
    return value;
  }
}

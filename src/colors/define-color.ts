import { TermxBgColor } from "./termx-bg-color";
import { TermxFontColor } from "./termx-font-colors";

/**
 * Defines a new named color that can be used in the markup for
 * font and background colors.
 */
export function defineColor(
  name: string,
  c: `#${string}` | `rgb(${string})`
): void;
export function defineColor(
  name: string,
  c: { r: number; g: number; b: number }
): void;
export function defineColor(
  name: string,
  r: number,
  g: number,
  b: number
): void;
export function defineColor(name: string, ...args: any[]) {
  TermxBgColor.define(name, ...args);
  TermxFontColor.define(name, ...args);
}

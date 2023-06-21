import { TermxColors } from "./termx-colors";

const escape = "\u001b";

export class TermxFontColors extends TermxColors {
  protected static predefinedColors = {
    unset: `${escape}[0m`,
    red: `${escape}[31m`,
    green: `${escape}[32m`,
    yellow: `${escape}[33m`,
    blue: `${escape}[34m`,
    magenta: `${escape}[35m`,
    cyan: `${escape}[36m`,
    white: `${escape}[37m`,
    lightRed: `${escape}[91m`,
    lightGreen: `${escape}[92m`,
    lightYellow: `${escape}[93m`,
    lightBlue: `${escape}[94m`,
    lightMagenta: `${escape}[95m`,
    lightCyan: `${escape}[96m`,
    lightWhite: `${escape}[97m`,
  };

  static rgb(c: `#${string}` | `rgb(${string})`): string;
  static rgb(c: { r: number; g: number; b: number }): string;
  static rgb(r: number, g: number, b: number): string;
  static rgb(...args: any[]): string {
    const rgb = this.parseRgbArgs(args);

    return `${escape}[38;2;${rgb.r};${rgb.g};${rgb.b}m`;
  }
}

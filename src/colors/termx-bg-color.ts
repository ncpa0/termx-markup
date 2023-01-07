import { TermxColors } from "./termx-colors";

const escape = "\u001b";

export class TermxBgColor extends TermxColors {
  protected static predefinedColors = {
    unset: `${escape}[0m`,
    red: `${escape}[41m`,
    green: `${escape}[42m`,
    yellow: `${escape}[43m`,
    blue: `${escape}[44m`,
    magenta: `${escape}[45m`,
    cyan: `${escape}[46m`,
    white: `${escape}[47m`,
    lightRed: `${escape}[101m`,
    lightGreen: `${escape}[102m`,
    lightYellow: `${escape}[103m`,
    lightBlue: `${escape}[104m`,
    lightMagenta: `${escape}[105m`,
    lightCyan: `${escape}[106m`,
    lightWhite: `${escape}[107m`,
  };

  static rgb(c: `#${string}` | `rgb(${string})`): string;
  static rgb(c: { r: number; g: number; b: number }): string;
  static rgb(r: number, g: number, b: number): string;
  static rgb(...args: any[]): string {
    const rgb = this.parseRgbArgs(args);

    return `${escape}[48;2;${rgb.r};${rgb.g};${rgb.b}m`;
  }
}

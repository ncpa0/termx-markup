export class TermxColors {
  /** @abstract */
  protected static predefinedColors: { [key: string]: string } = {};

  protected static parseRgbArgs(args: any[]): {
    r: number;
    g: number;
    b: number;
  } {
    if (args.length === 1) {
      const arg = args[0];
      if (typeof arg === "string") {
        if (arg.startsWith("rgb(")) {
          const rgb = arg.slice(4, -1).split(",");
          return {
            r: Number(rgb[0]!),
            g: Number(rgb[1]!),
            b: Number(rgb[2]!),
          };
        } else if (arg.startsWith("#")) {
          const rgb = arg.slice(1).split("");
          return {
            r: parseInt(rgb[0]! + rgb[1]!, 16),
            g: parseInt(rgb[2]! + rgb[3]!, 16),
            b: parseInt(rgb[4]! + rgb[5]!, 16),
          };
        }
      } else if (typeof arg === "object") {
        return arg as { r: number; g: number; b: number };
      }
    } else if (args.length === 3) {
      return { r: args[0], g: args[1], b: args[2] };
    }

    throw new Error("Invalid rgb arguments");
  }

  static get(color: string): string {
    if (color in this.predefinedColors) {
      return this.predefinedColors[color]!;
    } else {
      return this.rgb(color);
    }
  }

  static define(name: string, ...color: any[]): void {
    if (name in this.predefinedColors) {
      throw new Error(`Color ${name} is already defined.`);
    }
    Object.assign(this.predefinedColors, { [name]: this.rgb(...color) });
  }

  /** @abstract */
  static rgb(...args: any[]): string {
    return "";
  }
}

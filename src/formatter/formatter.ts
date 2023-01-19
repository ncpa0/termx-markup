import { TermxBgColor } from "../colors/termx-bg-color";
import { TermxFontColor } from "../colors/termx-font-colors";
import { desanitizeHtml } from "../html-tag";
import type { XmlObject } from "../xml-parser";
import { parseXml } from "../xml-parser";
import type { Scope } from "./scope-tracker";
import { ScopeTracker } from "./scope-tracker";

const escape = "\u001b";
const Bold = `${escape}[1m`;
const Dimmed = `${escape}[2m`;
const Italic = `${escape}[3m`;
const Underscore = `${escape}[4m`;
const Blink = `${escape}[5m`;
const Inverted = `${escape}[7m`;
const StrikeThrough = `${escape}[9m`;

/**
 * Formats XML into a string that can be printed to the terminal.
 *
 * @example
 *   ```ts
 *   const markup = html`<p color="red">Hello World!</p>`;
 *
 *   const formatted = MarkupFormatter.format(markup);
 *   // formatted = "\u001b[31mHello World!\u001b[0m"
 *   ```
 */
export class MarkupFormatter {
  /**
   * Defines a new named color that can be used in the markup for
   * font and background colors.
   *
   * The given color can be in one of the following formats:
   *
   * - `#rrggbb` (hexadecimal)
   * - `rgb(r, g, b)` (decimal)
   * - `{ r: number, g: number, b: number }` (JSON object)
   */
  static defineColor(name: string, c: `#${string}` | `rgb(${string})`): void;
  static defineColor(
    name: string,
    c: { r: number; g: number; b: number }
  ): void;
  static defineColor(name: string, r: number, g: number, b: number): void;
  static defineColor(name: string, ...args: any[]) {
    TermxBgColor.define(name, ...args);
    TermxFontColor.define(name, ...args);
  }

  static format(text: string): string {
    const xml = parseXml(text);
    return TermxFontColor.get("unset") + desanitizeHtml(this.formatXml(xml));
  }

  private static formatXml(xml: XmlObject): string {
    let result = "";

    switch (xml.tag) {
      case "pre":
      case "line":
      case "span": {
        ScopeTracker.enterScope(this.createScope(xml));

        result +=
          this.scopeToTermMarks(ScopeTracker.currentScope) +
          this.join(
            xml.content.map((content) =>
              this.mapContents(content, xml.tag === "pre")
            )
          );

        ScopeTracker.exitScope();

        if (xml.tag === "line") {
          result += "\n";
        }

        result +=
          TermxFontColor.get("unset") +
          this.scopeToTermMarks(ScopeTracker.currentScope);

        return result;
      }
      case "br": {
        result += "\n";
        return result;
      }
      case "": {
        result += this.join(
          xml.content.map((content) => this.mapContents(content))
        );
        return result;
      }
    }

    throw new Error(`Invalid tag: <${xml.tag}>`);
  }

  private static join(strings: string[]) {
    let result = "";
    for (let i = 0; i < strings.length; i++) {
      result += strings[i];
    }
    return result;
  }

  private static mapContents(content: XmlObject | string, pre?: boolean) {
    if (typeof content === "string") {
      if (pre) {
        return content;
      }
      return content.replaceAll("\n", "").trim();
    }

    return this.formatXml(content);
  }

  private static scopeToTermMarks(scope: Scope): string {
    let result = ""; //TermxFontColor.get("unset");

    if (scope.color) {
      result += TermxFontColor.get(scope.color);
    }

    if (scope.bg) {
      result += TermxBgColor.get(scope.bg);
    }

    if (scope.bold) {
      result += Bold;
    }

    if (scope.dimmed) {
      result += Dimmed;
    }

    if (scope.italic) {
      result += Italic;
    }

    if (scope.underscore) {
      result += Underscore;
    }

    if (scope.blink) {
      result += Blink;
    }

    if (scope.inverted) {
      result += Inverted;
    }

    if (scope.strikethrough) {
      result += StrikeThrough;
    }

    return result;
  }

  private static createScope(xml: XmlObject): Scope {
    const scope: Scope = { ...ScopeTracker.currentScope };

    if (xml.tag) {
      scope.parentTag = xml.tag;
    }

    for (const [name, value] of xml.attributes) {
      switch (name) {
        case "color":
          scope.color = as(value, "string");
          break;
        case "bg":
          scope.bg = as(value, "string");
          break;
        case "bold":
          scope.bold = value === true || value === "true";
          break;
        case "dim":
          scope.dimmed = value === true || value === "true";
          break;
        case "italic":
          scope.italic = value === true || value === "true";
          break;
        case "underscore":
          scope.underscore = value === true || value === "true";
          break;
        case "blink":
          scope.blink = value === true || value === "true";
          break;
        case "invert":
          scope.inverted = value === true || value === "true";
          break;
        case "strike":
          scope.strikethrough = value === true || value === "true";
          break;
      }
    }

    return scope;
  }
}

function as(value: string | boolean, as: "string"): string;
function as(value: string | boolean, as: "boolean"): boolean;
function as(value: string | boolean, as: "string" | "boolean") {
  if (typeof value === as) {
    return value;
  }
  throw new Error(`Invalid attribute type: ${typeof value} (expected ${as})`);
}

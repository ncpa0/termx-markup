import { TermxBgColor } from "../colors/termx-bg-color";
import { TermxFontColor } from "../colors/termx-font-colors";
import { desanitizeHtml } from "../html-tag";
import type { XmlObject } from "../xml-parser";
import { parseXml } from "../xml-parser";
import type { Scope } from "./scope-tracker";
import { ScopeTracker } from "./scope-tracker";

const escape = "\u001b";
const Bold = `${escape}[1m`;

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

  private static formatXml(xml: XmlObject, isLast = true): string {
    let result = "";

    switch (xml.tag) {
      case "span":
      case "p": {
        const parentTag = ScopeTracker.currentScope.parentTag;

        ScopeTracker.enterScope(this.createScope(xml));

        result +=
          this.scopeToTermMarks(ScopeTracker.currentScope) +
          xml.content
            .map((content, index) => {
              if (typeof content === "string") {
                const shouldTrim = xml.textNode || xml.tag === "span";
                return shouldTrim ? content.trim() : content;
              }

              const isLast = this.isLastTag(index, xml.content);
              return this.formatXml(content, isLast);
            })
            .join("");

        ScopeTracker.exitScope();

        if (xml.tag === "p") {
          if (!(parentTag === "" && isLast)) {
            result += "\n";
          }
        }

        result +=
          TermxFontColor.get("unset") +
          this.scopeToTermMarks(ScopeTracker.currentScope);

        break;
      }
      case "br": {
        result += "\n";
        break;
      }
      case "": {
        result += xml.content
          .map((content, index) => {
            if (typeof content === "string") {
              const shouldTrim = xml.textNode || xml.tag === "span";
              return shouldTrim ? content.trim() : content;
            }

            const isLast = this.isLastTag(index, xml.content);
            return this.formatXml(content, isLast);
          })
          .join("");
        break;
      }
      default: {
        throw new Error(`Invalid tag: <${xml.tag}>`);
      }
    }

    return result;
  }

  private static isLastTag(
    tagIndex: number,
    content: (string | XmlObject)[]
  ): boolean {
    let isLast = true;

    for (let i = tagIndex + 1; i < content.length; i++) {
      if (typeof content[i] !== "string") {
        isLast = false;
        break;
      }
    }

    return isLast;
  }

  private static scopeToTermMarks(scope: Scope): string {
    let result = ""; //TermxFontColor.get("unset");

    if (scope.bold) {
      result += Bold;
    }

    if (scope.color) {
      result += TermxFontColor.get(scope.color);
    }

    if (scope.bg) {
      result += TermxBgColor.get(scope.bg);
    }

    return result;
  }

  private static createScope(xml: XmlObject): Scope {
    const scope: Scope = {};

    if (xml.tag) {
      scope.parentTag = xml.tag;
    }

    for (const [name, value] of xml.attributes) {
      switch (name) {
        case "bold":
          scope.bold = value === true || value === "true";
          break;
        case "color":
          scope.color = as(value, "string");
          break;
        case "bg":
          scope.bg = as(value, "string");
          break;
        default:
          throw new Error(`Invalid attribute: ${name}`);
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

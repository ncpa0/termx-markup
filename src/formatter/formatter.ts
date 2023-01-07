import { TermxBgColor } from "../colors/termx-bg-color";
import { TermxFontColor } from "../colors/termx-font-colors";
import { desanitizeHtml } from "../html-tag";
import type { XmlObject } from "../xml-parser";
import { parseXml } from "../xml-parser";
import type { Scope } from "./scope-tracker";
import { ScopeTracker } from "./scope-tracker";

const escape = "\u001b";
const Bold = `${escape}[1m`;

export class MarkupFormatter {
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
                return xml.textNode ? content.trim() : content;
              }

              const isLast = index === xml.content.length - 1;
              return this.formatXml(content, isLast);
            })
            .join("");

        ScopeTracker.exitScope();

        if (xml.tag === "p" && parentTag === "" && !isLast) {
          result += "\n";
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
              return xml.textNode ? content.trim() : content;
            }

            const isLast = index === xml.content.length - 1;
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

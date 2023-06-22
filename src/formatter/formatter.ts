import { TermxBgColors } from "../colors/termx-bg-color";
import { TermxFontColors } from "../colors/termx-font-colors";
import { desanitizeHtml } from "../html-tag";
import type { MarkupNode } from "../markup-parser";
import { parseMarkup } from "../markup-parser";
import { leftPad } from "./left-pad";
import type { Scope } from "./scope-tracker";
import { ScopeTracker } from "./scope-tracker";
import { CharacterGroup, TextRenderer } from "./text-renderer/text";

/**
 * Formats given Markup into a string that can be printed to the
 * terminal.
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
    TermxBgColors.define(name, ...args);
    TermxFontColors.define(name, ...args);
  }

  static format(
    markup: string,
    opt?: { keepTrailingNewLine?: boolean }
  ): string {
    const node = parseMarkup(markup);
    const text = this.parse(node, new TextRenderer());

    if (opt?.keepTrailingNewLine !== true) {
      text.removeTrailingNewLine();
    }

    return desanitizeHtml(text.render());
  }

  private static parse(node: MarkupNode, result: TextRenderer): TextRenderer {
    switch (node.tag) {
      case "pre": {
        ScopeTracker.enterScope(this.createScope(node));

        const charGroup = new CharacterGroup(ScopeTracker.currentScope);

        for (let i = 0; i < node.content.length; i++) {
          const content = node.content[i]!;

          if (typeof content === "string") {
            result.appendText(charGroup.createChars(content));
          } else {
            console.warn(
              "The <pre> tag should only contain text. All other tags will be ignored."
            );
          }
        }

        ScopeTracker.exitScope();

        return result;
      }
      case "li": {
        ScopeTracker.enterScope(this.createScope(node));

        const charGroup = new CharacterGroup(ScopeTracker.currentScope);

        const contents = node.content
          .map((c) => (typeof c === "string" ? this.parseStringContent(c) : c))
          .filter((c) => (typeof c === "string" ? c.trim().length : true));

        for (let i = 0; i < contents.length; i++) {
          const isLast = i === contents.length - 1;
          const content = contents[i]!;

          if (typeof content === "string") {
            result.appendText(
              charGroup.createChars(this.parseStringContent(content))
            );
          } else {
            if ((content.tag === "ol" || content.tag === "ul") && i !== 0) {
              result.appendText(charGroup.createChars("\n"));
            }

            this.parse(content, result);

            if ((content.tag === "ol" || content.tag === "ul") && !isLast) {
              result.appendText(charGroup.createChars("\n"));
            }
          }
        }

        ScopeTracker.exitScope();

        return result;
      }
      case "line":
      case "span": {
        ScopeTracker.enterScope(this.createScope(node));

        const charGroup = new CharacterGroup(ScopeTracker.currentScope);

        for (let i = 0; i < node.content.length; i++) {
          const content = node.content[i]!;

          if (typeof content === "string") {
            result.appendText(
              charGroup.createChars(this.parseStringContent(content))
            );
          } else {
            this.parse(content, result);
          }
        }

        if (node.tag === "line") {
          result.appendText(charGroup.createChars("\n"));
        }

        ScopeTracker.exitScope();

        return result;
      }
      case "ol":
      case "ul": {
        const prefix = this.getListElementPrefix(node);
        const padding = this.getListPadding();

        const isNested = ScopeTracker.isImmediateChildOf("li");

        ScopeTracker.enterScope(this.createScope(node));

        const unstyledCharGroup = new CharacterGroup({
          bg: ScopeTracker.currentScope.bg,
          inverted: ScopeTracker.currentScope.inverted,
        });
        const charGroup = new CharacterGroup(ScopeTracker.currentScope);

        if (result.length > 0 && result.lastCharacter?.value !== "\n") {
          result.appendText(charGroup.createChars("\n"));
        }

        const contentList = node.content.filter(
          (c) => typeof c !== "string" || c.trim().length
        );

        for (let i = 0; i < contentList.length; i++) {
          const isLast = i === contentList.length - 1;
          const content = contentList[i]!;

          if (typeof content === "string" || content.tag !== "li") {
            console.warn(
              `Invalid element inside <${node.tag}>. Each child of <${node.tag}> must be a <li> element.`
            );
            continue;
          }

          const { contentPad, firstLineOffset } = this.getContentPad(
            node,
            i + 1
          );

          const subText = this.parse(content, new TextRenderer());

          subText.prependAllLines(
            unstyledCharGroup.createChars(" ".repeat(contentPad))
          );
          subText.slice(firstLineOffset);
          subText.prependText(unstyledCharGroup.createChars(" "));
          subText.prependText(charGroup.createChars(prefix(i)));
          subText.prependAllLines(
            unstyledCharGroup.createChars(" ".repeat(padding))
          );

          if (!isLast || !isNested) {
            subText.appendText(charGroup.createChars("\n"));
          }

          result.concat(subText);
        }

        ScopeTracker.exitScope();

        return result;
      }
      case "pad": {
        ScopeTracker.enterScope(this.createScope(node));

        const charGroup = new CharacterGroup(ScopeTracker.currentScope);

        const paddingAttr = Number(this.getAttribute(node, "size") ?? 0);

        const contentText = new TextRenderer();

        for (let i = 0; i < node.content.length; i++) {
          const content = node.content[i]!;

          if (typeof content === "string") {
            contentText.appendText(
              charGroup.createChars(this.parseStringContent(content))
            );
          } else {
            this.parse(content, contentText);
          }
        }

        const padding = leftPad("", paddingAttr);
        contentText.prependAllLines(charGroup.createChars(padding));

        result.concat(contentText);

        ScopeTracker.exitScope();

        return result;
      }
      case "br": {
        const charGroup =
          result.lastGroup ?? new CharacterGroup(ScopeTracker.currentScope);

        return result.appendText(charGroup.createChars("\n"));
      }
      case "s": {
        const charGroup =
          result.lastGroup ?? new CharacterGroup(ScopeTracker.currentScope);

        return result.appendText(charGroup.createChars(" "));
      }
      case "": {
        const charGroup =
          result.lastGroup ?? new CharacterGroup(ScopeTracker.currentScope);

        for (let i = 0; i < node.content.length; i++) {
          const content = node.content[i]!;

          if (typeof content === "string") {
            result.appendText(
              charGroup.createChars(this.parseStringContent(content))
            );
          } else {
            this.parse(content, result);
          }
        }

        return result;
      }
    }

    console.warn(`Invalid tag: ${node.tag}`);

    return result;
  }

  private static parseStringContent(content: string) {
    return content.replace(/\n/g, "").trim();
  }

  private static getAttribute(
    node: MarkupNode,
    name: string
  ): string | undefined {
    for (const [key, value] of node.attributes) {
      if (key === name) {
        return as(value, "string");
      }
    }
  }

  private static getListPadding(): number {
    let p = 0;

    ScopeTracker.traverseUp((scope) => {
      if (scope.tag === "ol" || scope.tag === "ul") {
        p += 1;
      }
    });

    if (p === 0) {
      return 0;
    }

    return (p - 1) * 2;
  }

  private static getContentPad(node: MarkupNode, line: number) {
    if (node.tag === "ul") {
      return {
        contentPad: 2,
        firstLineOffset: 2,
      };
    }
    const maxDigitPrefix = node.content.length.toString().length;

    const contentPad = node.content.length.toString().length + 2;

    return {
      contentPad,
      firstLineOffset: contentPad - (maxDigitPrefix - line.toString().length),
    };
  }

  private static getListElementPrefix(
    node: MarkupNode
  ): (index: number) => string {
    if (node.tag === "ol") {
      return (index) => `${index + 1}.`;
    }

    const type = this.getAttribute(node, "type") ?? "bullet";

    const symbol = (() => {
      switch (type) {
        case "bullet":
          return String.fromCharCode(0x25cf);
        case "circle":
          return String.fromCharCode(0x25cb);
        case "square":
          return String.fromCharCode(0x25a0);
        default:
          throw new Error(`Invalid list type: ${type}`);
      }
    })();

    return () => `${symbol}`;
  }

  private static createScope(node: MarkupNode): Scope {
    const noInherit = node.attributes.some(
      ([key, value]) =>
        key === "no-inherit" && (value === true || value === "true")
    );

    const scope: Scope = noInherit
      ? { noInherit: true }
      : { ...ScopeTracker.currentScope, noInherit: false };

    if (node.tag) {
      scope.tag = node.tag;
    }

    for (const [name, value] of node.attributes) {
      switch (name) {
        case "color":
          scope.color = as(value, "string");
          if (scope.color === "none") {
            scope.color = undefined;
          }
          break;
        case "bg":
          scope.bg = as(value, "string");
          if (scope.color === "none") {
            scope.color = undefined;
          }
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

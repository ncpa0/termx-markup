import { TermxBgColors } from "../colors/termx-bg-color";
import { TermxFontColors } from "../colors/termx-font-colors";
import { desanitizeHtml } from "../html-tag";
import type { MarkupNode } from "../markup-parser";
import { parseMarkup } from "../markup-parser";
import type { Settings } from "../settings";
import { GlobalSettings } from "../settings";
import { leftPad } from "./left-pad";
import type { Scope } from "./scope-tracker";
import { ScopeTracker } from "./scope-tracker";
import { CharacterGroup, TextRenderer } from "./text-renderer/text";

declare global {
  interface Array<T> {
    includes(searchElement: any, fromIndex?: number): boolean;
  }
}

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
  private static _instance: MarkupFormatter;

  static {
    MarkupFormatter._instance = new MarkupFormatter();
  }

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

  static format(markup: string | MarkupNode): string {
    return MarkupFormatter._instance.format(markup);
  }

  constructor(private settings: Settings = GlobalSettings) {}

  format(markup: string | MarkupNode): string {
    const node = typeof markup === "string" ? parseMarkup(markup) : markup;
    const text = this.parse(node, new TextRenderer());

    text.removeTrailingNewLine();

    return desanitizeHtml(text.render());
  }

  private handleError(message: string) {
    if (this.settings.__.strictMode) {
      throw new Error(message);
    }

    if (this.settings.__.warnings) {
      console.warn(message);
    }
  }

  private normalizeText(node: MarkupNode) {
    if (node.tag === "pre") {
      return;
    }

    const join = ScopeTracker.currentScope.attributes.join;

    if (join === "none") {
      for (let i = 0; i < node.content.length; i++) {
        const content = node.content[i]!;
        if (typeof content === "string") {
          node.content[i] = content.replace(/\s*\n\s*/g, " ").trim();
        }
      }
      return;
    }

    const doesLineStartsWithWhitespace = (index: number) => {
      const line = node.content[index]!;
      if (typeof line !== "string") {
        return false;
      }
      return line[0] === " " || line[0] === "\n";
    };

    const lastIndex = node.content.length - 1;
    for (let i = 0; i < node.content.length; i++) {
      const content = node.content[i]!;

      if (typeof content === "string") {
        const singleLined = content.replace(/\s*\n\s*/g, " ");
        let trimmed = singleLined.trim();
        const prevTag =
          ((node.content[i - 1] as MarkupNode)?.tag as string) || undefined;
        const nextTag = (node.content[i + 1] as MarkupNode)?.tag;

        const shouldSkipLeft = ["br", "s", "ul", "ol", "line"].includes(
          prevTag
        );
        const shouldSkipRight = ["br", "s", "ul", "ol"].includes(nextTag);

        if (trimmed.length === 0) {
          if (
            !shouldSkipLeft &&
            !shouldSkipRight &&
            i !== 0 &&
            i !== lastIndex
          ) {
            node.content[i] = " ";
          } else {
            node.content[i] = "";
          }
        } else {
          if (
            !shouldSkipLeft &&
            typeof node.content[i - 1] === "object" &&
            singleLined[0] === " "
          ) {
            trimmed = " " + trimmed;
          }

          if (
            !shouldSkipRight &&
            i !== lastIndex &&
            (singleLined[singleLined.length - 1] === " " ||
              doesLineStartsWithWhitespace(i + 1))
          ) {
            node.content[i] = trimmed + " ";
          } else {
            node.content[i] = trimmed;
          }
        }
      }
    }
  }

  private parse(node: MarkupNode, result: TextRenderer): TextRenderer {
    switch (node.tag) {
      case "pre": {
        ScopeTracker.enterScope(this.createScope(node));
        this.normalizeText(node);

        const charGroup = new CharacterGroup(
          ScopeTracker.currentScope.attributes
        );

        for (let i = 0; i < node.content.length; i++) {
          const content = node.content[i]!;

          if (typeof content === "string") {
            result.appendText(charGroup.createChars(content));
          } else {
            this.handleError(
              "The <pre> tag should only contain text. All other tags will be ignored."
            );
          }
        }

        ScopeTracker.exitScope();

        return result;
      }
      case "li": {
        ScopeTracker.enterScope(this.createScope(node));
        this.normalizeText(node);

        const charGroup = new CharacterGroup(
          ScopeTracker.currentScope.attributes
        );

        const contents = node.content.filter((c) =>
          typeof c === "string" ? c.length : true
        );

        for (let i = 0; i < contents.length; i++) {
          const isLast = i === contents.length - 1;
          const content = contents[i]!;

          if (typeof content === "string") {
            result.appendText(charGroup.createChars(content));
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
        this.normalizeText(node);

        const charGroup = new CharacterGroup(
          ScopeTracker.currentScope.attributes
        );

        for (let i = 0; i < node.content.length; i++) {
          const content = node.content[i]!;

          if (typeof content === "string") {
            result.appendText(charGroup.createChars(content));
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
        this.normalizeText(node);

        const unstyledCharGroup = new CharacterGroup({
          bg: ScopeTracker.currentScope.attributes.bg,
          inverted: ScopeTracker.currentScope.attributes.inverted,
        });
        const charGroup = new CharacterGroup(
          ScopeTracker.currentScope.attributes
        );

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
            this.handleError(
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
        this.normalizeText(node);

        const charGroup = new CharacterGroup(
          ScopeTracker.currentScope.attributes
        );

        const paddingAttr = Number(this.getAttribute(node, "size") ?? 0);

        const contentText = new TextRenderer();

        for (let i = 0; i < node.content.length; i++) {
          const content = node.content[i]!;

          if (typeof content === "string") {
            contentText.appendText(charGroup.createChars(content));
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
          result.lastGroup ??
          new CharacterGroup(ScopeTracker.currentScope.attributes);

        return result.appendText(charGroup.createChars("\n"));
      }
      case "s": {
        ScopeTracker.enterScope(this.createScope(node));
        this.normalizeText(node);

        const charGroup = new CharacterGroup(
          ScopeTracker.currentScope.attributes
        );

        result.appendText(charGroup.createChars(" "));

        ScopeTracker.exitScope();

        return result;
      }
      case "": {
        this.normalizeText(node);

        const charGroup =
          result.lastGroup ??
          new CharacterGroup(ScopeTracker.currentScope.attributes);

        for (let i = 0; i < node.content.length; i++) {
          const content = node.content[i]!;

          if (typeof content === "string") {
            result.appendText(charGroup.createChars(content));
          } else {
            this.parse(content, result);
          }
        }

        return result;
      }
    }

    this.handleError(`Invalid tag: ${node.tag}`);

    return result;
  }

  private getAttribute(node: MarkupNode, name: string): string | undefined {
    for (const [key, value] of node.attributes) {
      if (key === name) {
        return this.parseAttribute(key, value, "string");
      }
    }
  }

  private getListPadding(): number {
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

  private getContentPad(node: MarkupNode, line: number) {
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

  private getListElementPrefix(node: MarkupNode): (index: number) => string {
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

  private createScope(node: MarkupNode): Scope {
    const noInherit = node.attributes.some(
      ([key, value]) =>
        key === "no-inherit" && (value === true || value === "true")
    );

    const scope: Scope = noInherit
      ? { attributes: { noInherit: true } }
      : {
          attributes: {
            ...ScopeTracker.currentScope.attributes,
            noInherit: false,
          },
        };

    if (node.tag) {
      scope.tag = node.tag;
    }

    const attributes = scope.attributes;

    for (const [name, value] of node.attributes) {
      switch (name) {
        case "color":
          attributes.color = this.parseAttribute("color", value, "string");
          if (attributes.color === "none") {
            attributes.color = undefined;
          }
          continue;
        case "bg":
          attributes.bg = this.parseAttribute("bg", value, "string");
          if (attributes.color === "none") {
            attributes.color = undefined;
          }
          continue;
        case "bold":
          attributes.bold = this.parseAttribute("bold", value, "boolean");
          continue;
        case "dim":
          attributes.dimmed = this.parseAttribute("dim", value, "boolean");
          continue;
        case "italic":
          attributes.italic = this.parseAttribute("italic", value, "boolean");
          continue;
        case "underscore":
          attributes.underscore = this.parseAttribute(
            "underscore",
            value,
            "boolean"
          );
          continue;
        case "blink":
          attributes.blink = this.parseAttribute("blink", value, "boolean");
          continue;
        case "invert":
          attributes.inverted = this.parseAttribute("invert", value, "boolean");
          continue;
        case "strike":
          attributes.strikethrough = this.parseAttribute(
            "strike",
            value,
            "boolean"
          );
          continue;
        case "join":
          attributes.join = this.parseAttribute(
            "join",
            value,
            "string",
            "space",
            "none"
          );
          continue;
        case "no-inherit":
          continue;
        // tag-specific attributes
        case "size": // pad
        case "type": // ul
          continue;
      }

      this.handleError(`Unknown attribute: [${name}]`);
    }

    return scope;
  }

  private parseAttribute(
    name: string,
    value: any,
    type: "string"
  ): string | undefined;
  private parseAttribute(
    name: string,
    value: any,
    type: "boolean"
  ): boolean | undefined;
  private parseAttribute<L extends string[]>(
    name: string,
    value: any,
    type: "string",
    ...literal: L
  ): L[number];
  private parseAttribute(
    name: string,
    value: any,
    type: "string" | "boolean",
    ...literal: string[]
  ) {
    switch (type) {
      case "string":
        if (typeof value === "string") {
          if (literal.length ? literal.includes(value) : true) {
            return value;
          }
        }
        break;
      case "boolean":
        if (typeof value === "boolean") {
          return value;
        }
        if (value === "true" || value === "1") {
          return true;
        }
        if (value === "false" || value === "0") {
          return false;
        }
        break;
    }

    this.handleError(
      `Invalid attribute: value '${value}' cannot be assigned to [${name}].`
    );

    return undefined;
  }
}

/* eslint-disable for-direction */
/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */
/* eslint-disable @typescript-eslint/no-base-to-string */
import stripAnsi from "strip-ansi";
import { TermxBgColor } from "../colors/termx-bg-color";
import { TermxFontColor } from "../colors/termx-font-colors";
import { desanitizeHtml } from "../html-tag";
import type { MarkupNode } from "../markup-parser";
import { parseMarkup } from "../markup-parser";
import { leftPad } from "./left-pad";
import type { ScopeStyles } from "./scope-tracker";
import { ScopeTracker } from "./scope-tracker";

const UNSET = TermxFontColor.get("unset");

const escape = "\u001b";
const Bold = `${escape}[1m`;
const Dimmed = `${escape}[2m`;
const Italic = `${escape}[3m`;
const Underscore = `${escape}[4m`;
const Blink = `${escape}[5m`;
const Inverted = `${escape}[7m`;
const StrikeThrough = `${escape}[9m`;

const BORDER_CHAR = {
  left: "│",
  right: "│",
  top: "─",
  bottom: "─",
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
};

class ConditionalBreak {}

class Lines {
  private lines: Array<ConditionalBreak | string> = [];

  conditionalBreak() {
    this.lines.push(new ConditionalBreak());

    return this;
  }

  add(text: string) {
    this.lines.push(text);

    return this;
  }

  append(text: string) {
    if (this.lines.length > 0) {
      if (typeof this.lines[this.lines.length - 1] === "string") {
        this.lines[this.lines.length - 1] += text;
      } else {
        this.add(text);
      }
    } else {
      this.add(text);
    }

    return this;
  }

  concat(other: Lines) {
    if (other.lines.length === 0) {
      return this;
    }

    if (this.lines.length === 0) {
      this.lines = other.lines.slice();
    } else {
      if (
        typeof this.lines[this.lines.length - 1] === "object" ||
        typeof other.lines[0] === "object"
      ) {
        this.lines = this.lines.concat(other.lines);
      } else {
        this.lines[this.lines.length - 1] += other.lines[0]!;
        this.lines = this.lines.concat(other.lines.slice(1));
      }
    }

    return this;
  }

  forEach(fn: (line: string, index: number) => any) {
    let i = 0;
    this.lines.forEach((line) => {
      if (typeof line === "string") {
        fn(line, i++);
      }
    });
    return this;
  }

  mapLines(fn: (line: string, index: number) => string) {
    let i = 0;
    this.lines = this.lines.flatMap((line) => {
      if (typeof line === "string") {
        return fn(line, i++);
      } else {
        return line;
      }
    });

    return this;
  }

  toString() {
    const separator = "\n";
    let result = "";
    this.forEach((line, i) => {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      result += (i !== 0 ? separator : "") + line;
    });
    // for (let i = 0; i < this.lines.length; i++) {
    //   const line = this.lines[i];
    //   if (typeof line === "string") {
    //     // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    //     result += (i !== 0 ? separator : "") + line;
    //   } else {
    //     // TODO: check if last/first
    //     // result += separator;
    //   }
    // }
    return result;
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

  static format(markup: string): string {
    const node = parseMarkup(markup);
    return (
      TermxFontColor.get("unset") +
      desanitizeHtml(this.formatMarkup(node).toString())
    );
  }

  private static formatMarkup(node: MarkupNode): Lines {
    const result = new Lines();

    switch (node.tag) {
      case "li":
      case "line":
      case "span": {
        const parentAnsi = this.scopeToAnsi(ScopeTracker.currentScope);

        ScopeTracker.enterScope(this.createScope(node));

        const ansiScope = this.scopeToAnsi(ScopeTracker.currentScope);

        for (const content of node.content) {
          const lines = this.mapContents(content);
          lines.mapLines((l) => `${ansiScope}${l}${UNSET}${parentAnsi}`);
          result.concat(lines);
        }

        ScopeTracker.exitScope();

        if (node.tag === "line") {
          result.conditionalBreak();
        }

        return result;
      }
      case "pre": {
        const parentAnsi = this.scopeToAnsi(ScopeTracker.currentScope);

        ScopeTracker.enterScope(this.createScope(node));

        const ansiScope = this.scopeToAnsi(ScopeTracker.currentScope);

        result.conditionalBreak();

        for (const content of node.content) {
          if (typeof content === "string") {
            const subLines = content.split("\n");
            if (subLines.length > 0) {
              result.append(`${ansiScope}${subLines[0]!}${UNSET}${parentAnsi}`);

              for (let i = 1; i < subLines.length; i++) {
                result.add(`${ansiScope}${subLines[i]!}${UNSET}${parentAnsi}`);
              }
            }
          } else {
            const lines = this.mapContents(content, true);
            lines.mapLines((l) => `${ansiScope}${l}${UNSET}${parentAnsi}`);
            result.concat(lines);
          }
        }

        ScopeTracker.exitScope();

        result.conditionalBreak();

        return result;
      }
      case "box": {
        const border = this.getAttribute(node, "border", false);
        const topBorder = toBool(this.getAttribute(node, "border-top", border));
        const bottomBorder = toBool(
          this.getAttribute(node, "border-bottom", border)
        );
        const leftBorder = toBool(
          this.getAttribute(node, "border-left", border)
        );
        const rightBorder = toBool(
          this.getAttribute(node, "border-right", border)
        );
        const padding = as(this.getAttribute(node, "padding", "0"), "string");
        const topPadding = as(
          this.getAttribute(node, "padding-top", padding),
          "string"
        );
        const bottomPadding = as(
          this.getAttribute(node, "padding-bottom", padding),
          "string"
        );
        const leftPadding = as(
          this.getAttribute(node, "padding-left", padding),
          "string"
        );
        const rightPadding = as(
          this.getAttribute(node, "padding-right", padding),
          "string"
        );

        const parentAnsi = this.scopeToAnsi(ScopeTracker.currentScope);

        ScopeTracker.enterScope(this.createScope(node));

        const ansi = this.scopeToAnsi(ScopeTracker.currentScope);

        const contentLines = node.content.reduce(
          (lines, content) => lines.concat(this.mapContents(content)),
          new Lines()
        );

        const targetLength = this.findLongestLineLength(contentLines);

        const sidesPadding = Number(leftPadding) + Number(rightPadding);

        const left = leftBorder
          ? BORDER_CHAR.left + " ".repeat(Number(leftPadding))
          : "";

        const right = rightBorder
          ? " ".repeat(Number(rightPadding)) + BORDER_CHAR.right
          : "";

        if (topBorder) {
          const innerWidth = targetLength + sidesPadding;
          let top = this.createBorderLine(innerWidth, "top");

          if (leftBorder) {
            top = BORDER_CHAR.topLeft + top;
          }

          if (rightBorder) {
            top = top + BORDER_CHAR.topRight;
          }

          result.add(ansi + top);

          const padLine = left + " ".repeat(targetLength) + right;
          for (let i = 0; i < Number(topPadding); i++) {
            result.add(padLine);
          }

          result.add(UNSET + parentAnsi);
        }

        if (leftBorder || rightBorder) {
          if (!leftBorder) {
            contentLines.mapLines(
              (l) =>
                this.padForLength(l, targetLength) +
                ansi +
                right +
                UNSET +
                parentAnsi
            );
          } else if (!rightBorder) {
            contentLines.mapLines((l) => ansi + left + UNSET + parentAnsi + l);
          } else {
            contentLines.mapLines(
              (l) =>
                ansi +
                left +
                UNSET +
                parentAnsi +
                this.padForLength(l, targetLength) +
                ansi +
                right +
                UNSET +
                parentAnsi
            );
          }
        }

        result.concat(contentLines);

        if (bottomBorder) {
          const innerWidth = targetLength + sidesPadding;
          let bottom = this.createBorderLine(innerWidth, "bottom");

          if (leftBorder) {
            bottom = BORDER_CHAR.bottomLeft + bottom;
          }

          if (rightBorder) {
            bottom = bottom + BORDER_CHAR.bottomRight;
          }

          result.add(ansi);

          const padLine = left + " ".repeat(targetLength) + right;
          for (let i = 0; i > Number(bottomPadding); i++) {
            if (i > 0) {
              result.add(padLine);
            } else {
              result.append(padLine);
            }
          }

          if (Number(bottomPadding) > 0) {
            result.add(bottom);
          } else {
            result.append(bottom);
          }
        }

        ScopeTracker.exitScope();

        return result;
      }
      case "ol":
      case "ul": {
        const prefix = this.getListElementPrefix(node);
        const parentAnsi = this.scopeToAnsi(ScopeTracker.currentScope);

        ScopeTracker.enterScope(this.createScope(node));

        const ansiScope = this.scopeToAnsi(ScopeTracker.currentScope);

        const contents = node.content.filter(
          (c) => typeof c !== "string" || c.trim().length
        );

        for (const [i, content] of contents.entries()) {
          if (typeof content === "string" || content.tag !== "li") {
            throw new Error(
              `Invalid element inside <${node.tag}>. Each child of <${node.tag}> must be a <li> element.`
            );
          }

          const { contentPad } = this.getContentPad(node, i + 1);

          const lines = this.mapContents(content);

          lines.mapLines((l, elemLine) => {
            if (elemLine === 0) {
              return `${prefix(i)}${ansiScope}${l}${UNSET}${parentAnsi}`;
            }

            return `${ansiScope}${leftPad(l, contentPad)}${UNSET}${parentAnsi}`;
          });

          result.conditionalBreak();
          result.concat(lines);
        }

        ScopeTracker.exitScope();

        return result;
      }
      case "pad": {
        const parentAnsi = this.scopeToAnsi(ScopeTracker.currentScope);

        ScopeTracker.enterScope(this.createScope(node));

        const ansiScope = this.scopeToAnsi(ScopeTracker.currentScope);

        const paddingAttr = as(this.getAttribute(node, "size", "0"), "string");

        for (const content of node.content) {
          const lines = this.mapContents(content);
          result.concat(lines);
        }

        result.mapLines(
          (l) =>
            `${ansiScope}${leftPad(
              l,
              Number(paddingAttr)
            )}${UNSET}${parentAnsi}`
        );

        ScopeTracker.exitScope();

        return result;
      }
      case "br": {
        result.conditionalBreak();

        return result;
      }
      case "s": {
        result.append(" ");
        return result;
      }
      case "": {
        for (const content of node.content) {
          const lines = this.mapContents(content);
          result.concat(lines);
        }
        return result;
      }
    }

    throw new Error(`Invalid tag: <${node.tag}>`);
  }

  private static join(strings: string[], separator = "") {
    let result = "";
    for (let i = 0; i < strings.length; i++) {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      result += (i !== 0 ? separator : "") + strings[i];
    }
    return result;
  }

  private static getAttribute(
    node: MarkupNode,
    name: string,
    defaultValue: string | boolean
  ): string | boolean;
  private static getAttribute(
    node: MarkupNode,
    name: string
  ): string | boolean | undefined;
  private static getAttribute(
    node: MarkupNode,
    name: string,
    defaultValue: string | boolean | undefined
  ): string | boolean | undefined;
  private static getAttribute(
    node: MarkupNode,
    name: string,
    defaultValue?: string | boolean
  ): string | boolean | undefined {
    for (const [key, value] of node.attributes) {
      if (key === name) {
        return value;
      }
    }
    return defaultValue;
  }

  /**
   * Counts the number of characters that will be visible in a
   * terminal output.
   */
  private static countVisibleChars(str: string): number {
    return stripAnsi(str).length;
  }

  private static padForLength(str: string, targetLength: number): string {
    const len = this.countVisibleChars(str);
    if (targetLength > len) {
      return str + " ".repeat(targetLength - len);
    }
    return str;
  }

  private static findLongestLineLength(lines: Lines): number {
    let max = 0;
    lines.forEach((l) => {
      const len = this.countVisibleChars(l);
      if (len > max) {
        max = len;
      }
    });
    return max;
  }

  private static mapContents(content: MarkupNode | string, pre?: boolean) {
    if (typeof content === "string") {
      if (pre) {
        return new Lines().add(content);
      }
      return new Lines().add(content.replaceAll("\n", "").trim());
    }

    return this.formatMarkup(content);
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

    return p * 3;
  }

  private static getContentPad(node: MarkupNode, line: number) {
    if (node.tag === "ul") {
      return {
        contentPad: 2,
        firstElementOffset: 2,
      };
    }

    const maxDigitPrefix = node.content.length.toString().length;

    const contentPad = node.content.length.toString().length + 2;

    return {
      contentPad,
      firstElementOffset:
        contentPad - (maxDigitPrefix - line.toString().length),
    };
  }

  private static getListElementPrefix(
    node: MarkupNode
  ): (index: number) => string {
    if (node.tag === "ol") {
      const listSize = node.content
        .filter((c) => typeof c !== "string")
        .length.toString();

      return (index) => {
        const prefixNumber = (index + 1).toString();
        return `${prefixNumber.padStart(listSize.length)}. `;
      };
    }

    const type = this.getAttribute(node, "type", "bullet");

    const symbol = (() => {
      switch (type) {
        case "bullet":
          return String.fromCharCode(0x25cf);
        case "circle":
          return String.fromCharCode(0x25cb);
        case "square":
          return String.fromCharCode(0x25a1);
      }
      return String.fromCharCode(0x25cf);
    })();

    return () => `${symbol} `;
  }

  private static scopeToAnsi(scope: ScopeStyles): string {
    let result = "";

    if (scope.noInherit) {
      result += TermxFontColor.get("unset");
    }

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

  private static createScope(node: MarkupNode): ScopeStyles {
    const noInherit = node.attributes.some(
      ([key, value]) =>
        key === "no-inherit" && (value === true || value === "true")
    );

    const scope: ScopeStyles = noInherit
      ? { noInherit: true }
      : { ...ScopeTracker.currentScope, noInherit: false };

    if (node.tag) {
      scope.tag = node.tag;
    }

    for (const [name, value] of node.attributes) {
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

  private static createBorderLine(
    length: number,
    pos: "top" | "bottom"
  ): string {
    const char = pos === "top" ? BORDER_CHAR.top : BORDER_CHAR.bottom;
    return this.join(Array.from({ length }, () => char));
  }
}

function toBool(value: string | boolean, defaultValue = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  switch (value) {
    case "1":
    case "true":
      return true;
    case "0":
    case "false":
      return false;
  }

  return defaultValue;
}

function as(value: string | boolean, as: "string"): string;
function as(value: string | boolean, as: "boolean"): boolean;
function as(value: string | boolean, as: "string" | "boolean") {
  if (typeof value === as) {
    return value;
  }
  throw new Error(`Invalid attribute type: ${typeof value} (expected ${as})`);
}

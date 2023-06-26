export type MarkupNode = {
  tag: string;
  textNode: boolean;
  attributes: Array<[attributeName: string, value: string | boolean]>;
  content: Array<string | MarkupNode>;
};

export class MarkupParserError extends Error {
  constructor(
    public parsedMarkup: string,
    public position: number,
    message: string
  ) {
    super("Invalid Markup. " + message);
  }

  private getPositionCords(): [line: number, column: number] {
    let lineIndex = 0;
    let columnIndex = 0;
    for (let i = 0; i < this.position; i++) {
      if (this.parsedMarkup[i] === "\n") {
        lineIndex++;
        columnIndex = 0;
      } else {
        columnIndex++;
      }
    }
    return [lineIndex, columnIndex];
  }

  private getStack() {
    return this.stack ?? "";
  }

  getPositionPatch() {
    const [lineIndex, columnIndex] = this.getPositionCords();

    const lines = this.parsedMarkup.split("\n");

    const patchLine = lines[lineIndex]!;

    const highlightLine = " ".repeat(columnIndex) + "^";

    let result = "";

    if (lineIndex > 1) {
      result += lines[lineIndex - 2]! + "\n";
    }

    if (lineIndex > 0) {
      result += lines[lineIndex - 1]! + "\n";
    }

    result += patchLine + "\n" + highlightLine;

    return result;
  }

  toString() {
    return `${
      this.message
    }\n\n${this.getPositionPatch()}\n\n${this.getStack()}`;
  }
}

class MarkupNodeBuilder {
  o: MarkupNode = {
    tag: "",
    content: [],
    attributes: [],
    textNode: false,
  };

  content: Array<string | MarkupNodeBuilder> = [];
  lastStringContent = "";

  constructor(public parent?: MarkupNodeBuilder) {}

  addChild() {
    if (this.lastStringContent.length) {
      this.content.push(this.lastStringContent);
      this.lastStringContent = "";
    }
    const child = new MarkupNodeBuilder(this);
    this.content.push(child);
    return child;
  }

  addChar(char: string) {
    this.lastStringContent += char;
  }

  serialize(): MarkupNode {
    for (let i = 0; i < this.content.length; i++) {
      const c = this.content[i]!;
      if (typeof c === "string") {
        this.o.content.push(c);
      } else {
        this.o.content.push(c.serialize());
      }
    }

    if (this.lastStringContent.length) {
      this.o.content.push(this.lastStringContent);
    }

    return this.o;
  }
}

class MarkupBuilder {
  /** MArkup node that is currently being built. */
  node: MarkupNodeBuilder = new MarkupNodeBuilder();

  constructor() {
    this.node.o.textNode = true;
  }

  addChildNode() {
    this.node = this.node.addChild();
  }

  moveUp() {
    this.node = this.node.parent!;
  }

  isTopLevel() {
    return this.node.parent === undefined;
  }

  serialize(): MarkupNode {
    if (
      this.node.content.length === 1 &&
      this.node.o.tag === "" &&
      typeof this.node.content[0] !== "string"
    ) {
      return this.node.content[0]!.serialize();
    }
    return this.node.serialize();
  }
}

const IS_IN_TAG = 1;
const IS_IN_ATTRIBUTE = 2;
const IS_IN_ATTRIBUTE_QUOTE = 4;
const IS_ESCAPED = 8;
const IS_CLOSING_TAG = 16;
const IS_TAG_NAME_READ = 32;

const NOT_IS_IN_TAG = ~IS_IN_TAG;
const NOT_IS_IN_ATTRIBUTE = ~IS_IN_ATTRIBUTE;
const NOT_IS_IN_ATTRIBUTE_QUOTE = ~IS_IN_ATTRIBUTE_QUOTE;
const NOT_IS_ESCAPED = ~IS_ESCAPED;
const NOT_IS_CLOSING_TAG = ~IS_CLOSING_TAG;
const NOT_IS_TAG_NAME_READ = ~IS_TAG_NAME_READ;

/**
 * Markup parsing function used internally by the library.
 *
 * It is only capable of parsing simple Markup structures and has
 * no support for most of the XML features like namespaces,
 * comments, CDATA, etc. But in return it is extremely fast. (up
 * to 3x faster than the
 * [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser))
 */
export function parseMarkup(markupStr: string): MarkupNode {
  const markup = new MarkupBuilder();

  let currentAttributeName = "";
  let currentAttributeValue = "";

  let closeTagName = "";

  let state = 0;

  for (let i = 0; i < markupStr.length; i++) {
    const char = markupStr[i]!;

    switch (state) {
      case 0: {
        switch (char) {
          case "<": {
            state = state | IS_IN_TAG;

            if (markupStr[i + 1] === "/") {
              state = state | IS_CLOSING_TAG;
              i++;
            } else {
              markup.addChildNode();
            }
            continue;
          }
          case "\\": {
            state = state | IS_ESCAPED;
            continue;
          }
        }
        markup.node.addChar(char);
        break;
      }
      // IS_ESCAPED
      case 8: {
        markup.node.addChar(char);
        state = state & NOT_IS_ESCAPED;
        break;
      }
      // IS_IN_TAG
      case 1: {
        switch (char) {
          case "\n": {
            if (markup.node.o.tag.length > 0) {
              state = state | IS_TAG_NAME_READ;
            }
            continue;
          }
          case " ": {
            if (markup.node.o.tag.length > 0) {
              state = state | IS_TAG_NAME_READ;
            }
            continue;
          }
          case ">": {
            if (markup.node.o.tag.length === 0) {
              throw new MarkupParserError(markupStr, i, "No tag name found.");
            }
            state = state & NOT_IS_IN_TAG;
            continue;
          }
          case "/": {
            if (markupStr[i + 1] === ">") {
              state = state & NOT_IS_IN_TAG;
              i++;
              markup.moveUp();
            } else {
              throw new MarkupParserError(
                markupStr,
                i,
                "Invalid character encountered."
              );
            }
            continue;
          }
          case "=": {
            // = char means this is actually an attribute, not a tag name
            // but since we are in this case, it means the tag name is empty
            throw new MarkupParserError(
              markupStr,
              i - markup.node.o.tag.length,
              "No tag name found."
            );
          }
        }
        markup.node.o.tag += char;
        break;
      }
      // IS_IN_TAG | IS_TAG_NAME_READ
      case 33: {
        switch (char) {
          case "\n": {
            continue;
          }
          case " ": {
            continue;
          }
          case ">": {
            state = state & NOT_IS_IN_TAG & NOT_IS_TAG_NAME_READ;
            continue;
          }
          case "/": {
            if (markupStr[i + 1] === ">") {
              state = state & NOT_IS_IN_TAG & NOT_IS_TAG_NAME_READ;
              i++;
              markup.moveUp();
            } else {
              throw new MarkupParserError(
                markupStr,
                i,
                "Invalid character encountered."
              );
            }
            continue;
          }
          case "=": {
            throw new MarkupParserError(
              markupStr,
              i,
              "Invalid character encountered."
            );
          }
        }
        state = state | IS_IN_ATTRIBUTE;
        currentAttributeName += char;
        break;
      }
      // IS_IN_TAG | IS_CLOSING_TAG
      case 17: {
        switch (char) {
          case "\n": {
            continue;
          }
          case " ": {
            continue;
          }
          case ">": {
            state = state & NOT_IS_IN_TAG & NOT_IS_CLOSING_TAG;
            if (closeTagName !== markup.node.o.tag) {
              throw new MarkupParserError(
                markupStr,
                i,
                `Closing tag does not match opening tag, expected '${markup.node.o.tag}' but found '${closeTagName}'.`
              );
            }
            closeTagName = "";
            markup.moveUp();
            continue;
          }
        }
        closeTagName += char;
        break;
      }
      // IS_IN_TAG | IS_TAG_NAME_READ | IS_IN_ATTRIBUTE
      case 35: {
        switch (char) {
          case "=": {
            state = state & NOT_IS_IN_ATTRIBUTE;
            if (markupStr[i + 1] === '"') {
              state = state | IS_IN_ATTRIBUTE_QUOTE;
              i += 1;
            } else {
              throw new MarkupParserError(
                markupStr,
                i + 1,
                "Attribute values must be enclosed in double quotes."
              );
            }
            continue;
          }
          case "\n": {
            state = state & NOT_IS_IN_ATTRIBUTE;
            markup.node.o.attributes.push([currentAttributeName, true]);
            currentAttributeName = "";
            continue;
          }
          case " ": {
            state = state & NOT_IS_IN_ATTRIBUTE;
            markup.node.o.attributes.push([currentAttributeName, true]);
            currentAttributeName = "";
            continue;
          }
          case ">": {
            state =
              state &
              NOT_IS_IN_TAG &
              NOT_IS_IN_ATTRIBUTE &
              NOT_IS_TAG_NAME_READ;
            markup.node.o.attributes.push([currentAttributeName, true]);
            currentAttributeName = "";
            continue;
          }
        }
        currentAttributeName += char;
        break;
      }
      // IS_IN_TAG | IS_TAG_NAME_READ | IS_IN_ATTRIBUTE_QUOTE
      case 37: {
        switch (char) {
          case '"': {
            state = state & NOT_IS_IN_ATTRIBUTE_QUOTE;
            markup.node.o.attributes.push([
              currentAttributeName,
              currentAttributeValue,
            ]);
            currentAttributeName = "";
            currentAttributeValue = "";
            continue;
          }
          case "\\": {
            state = state | IS_ESCAPED;
            continue;
          }
        }
        currentAttributeValue += char;
        break;
      }
      // IS_IN_TAG | IS_TAG_NAME_READ | IS_IN_ATTRIBUTE_QUOTE | IS_ESCAPED
      case 45: {
        currentAttributeValue += char;
        state = state & NOT_IS_ESCAPED;
        break;
      }
    }
  }

  if (!markup.isTopLevel()) {
    throw new MarkupParserError(
      markupStr,
      markupStr.length - 1,
      `Closing tag is missing. Expected a close tag for '${markup.node.o.tag}' before the end of the document.`
    );
  }

  return markup.serialize();
}

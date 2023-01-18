export type XmlObject = {
  tag: string;
  textNode: boolean;
  attributes: Array<[attributeName: string, value: string | boolean]>;
  content: Array<string | XmlObject>;
};

export class XmlParserError extends Error {
  static parsedXml: string;

  static setIsWorkingOn(xml: string) {
    this.parsedXml = xml;
  }

  parsedXml = XmlParserError.parsedXml;

  constructor(message: string, public position: number) {
    super("Invalid XML. " + message);
  }

  private getPositionCords(): [line: number, column: number] {
    let lineIndex = 0;
    let columnIndex = 0;
    for (let i = 0; i < this.position; i++) {
      if (this.parsedXml[i] === "\n") {
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

    const lines = this.parsedXml.split("\n");

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

class XmlObjectBuilder {
  o: XmlObject = {
    textNode: false,
    tag: "",
    attributes: [],
    content: [],
  };

  content: Array<string | XmlObjectBuilder> = [];
  lastStringContent = "";

  constructor(public parent?: XmlObjectBuilder) {}

  addChild() {
    if (this.lastStringContent !== "") {
      this.content.push(this.lastStringContent);
      this.lastStringContent = "";
    }
    const child = new XmlObjectBuilder(this);
    this.content.push(child);
    return child;
  }

  addChar(char: string) {
    this.lastStringContent += char;
  }

  serialize(): XmlObject {
    if (this.lastStringContent !== "") {
      this.content.push(this.lastStringContent);
    }

    for (let i = 0; i < this.content.length; i++) {
      const c = this.content[i]!;
      if (typeof c === "string") {
        this.o.content.push(c);
      } else {
        this.o.content.push(c.serialize());
      }
    }

    return this.o;
  }
}

class XmlBuilder {
  /** XML node that is currently being built. */
  node: XmlObjectBuilder = new XmlObjectBuilder();

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

  serialize(): XmlObject {
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

/**
 * XML parsing function used internally by the library.
 *
 * It is only capable of parsing simple XML structures and has no
 * support for most of the XML features like namespaces,
 * comments, CDATA, etc. But in return it is extremely fast.
 * (about 2x faster than the
 * [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser))
 */
export function parseXml(xmlStr: string) {
  XmlParserError.setIsWorkingOn(xmlStr);

  const xml = new XmlBuilder();

  let currentAttributeName = "";
  let currentAttributeValue = "";

  let closeTagName = "";

  const IS_IN_TAG = 1;
  const IS_IN_ATTRIBUTE = 2;
  const IS_IN_ATTRIBUTE_QUOTE = 4;
  const IS_ESCAPED = 8;
  const IS_CLOSING_TAG = 16;
  const IS_TAG_NAME_READ = 32;

  let state = 0;

  for (let i = 0; i < xmlStr.length; i++) {
    const char = xmlStr[i]!;

    switch (state) {
      case 0: {
        switch (char) {
          case "<": {
            state = state | IS_IN_TAG;

            if (xmlStr[i + 1] === "/") {
              state = state | IS_CLOSING_TAG;
              i++;
            } else {
              xml.addChildNode();
            }
            break;
          }
          case "\\": {
            state = state | IS_ESCAPED;
            break;
          }
          default: {
            xml.node.addChar(char);
          }
        }
        break;
      }
      // IS_ESCAPED
      case 8: {
        xml.node.addChar(char);
        state = state & ~IS_ESCAPED;
        break;
      }
      // IS_IN_TAG
      case 1: {
        switch (char) {
          case " ": {
            if (xml.node.o.tag.length > 0) {
              state = state | IS_TAG_NAME_READ;
            }
            break;
          }
          case ">": {
            if (xml.node.o.tag.length === 0) {
              throw new XmlParserError("No tag name found.", i);
            }
            state = state & ~IS_IN_TAG;
            break;
          }
          case "/": {
            if (xmlStr[i + 1] === ">") {
              state = state & ~IS_IN_TAG;
              i++;
              xml.moveUp();
            } else {
              throw new XmlParserError("Invalid character encountered.", i);
            }
            break;
          }
          case "=": {
            // = char means this is actually an attribute, not a tag name
            // but since we are in this case, it means the tag name is empty
            throw new XmlParserError(
              "No tag name found.",
              i - xml.node.o.tag.length
            );
          }
          default: {
            xml.node.o.tag += char;
          }
        }
        break;
      }
      // IS_IN_TAG | IS_TAG_NAME_READ
      case 33: {
        switch (char) {
          case " ": {
            break;
          }
          case ">": {
            state = state & ~IS_IN_TAG & ~IS_TAG_NAME_READ;
            break;
          }
          case "/": {
            if (xmlStr[i + 1] === ">") {
              state = state & ~IS_IN_TAG & ~IS_TAG_NAME_READ;
              i++;
              xml.moveUp();
            } else {
              throw new XmlParserError("Invalid character encountered.", i);
            }
            break;
          }
          case "=": {
            throw new XmlParserError("Invalid character encountered.", i);
          }
          default: {
            state = state | IS_IN_ATTRIBUTE;
            currentAttributeName += char;
          }
        }
        break;
      }
      // IS_IN_TAG | IS_CLOSING_TAG
      case 17: {
        switch (char) {
          case " ": {
            break;
          }
          case ">": {
            state = state & ~IS_IN_TAG & ~IS_CLOSING_TAG;
            if (closeTagName !== xml.node.o.tag) {
              throw new XmlParserError(
                `Closing tag does not match opening tag, expected '${xml.node.o.tag}' but found '${closeTagName}'.`,
                i
              );
            }
            closeTagName = "";
            xml.moveUp();
            break;
          }
          default: {
            closeTagName += char;
          }
        }
        break;
      }
      // IS_IN_TAG | IS_TAG_NAME_READ | IS_IN_ATTRIBUTE
      case 35: {
        switch (char) {
          case "=": {
            state = state & ~IS_IN_ATTRIBUTE;
            if (xmlStr[i + 1] === '"') {
              state = state | IS_IN_ATTRIBUTE_QUOTE;
              i += 1;
            } else {
              throw new XmlParserError(
                "Attribute values must be enclosed in double quotes.",
                i + 1
              );
            }
            break;
          }
          case " ": {
            state = state & ~IS_IN_ATTRIBUTE;
            xml.node.o.attributes.push([currentAttributeName, true]);
            currentAttributeName = "";
            break;
          }
          case ">": {
            state = state & ~IS_IN_TAG & ~IS_IN_ATTRIBUTE & ~IS_TAG_NAME_READ;
            xml.node.o.attributes.push([currentAttributeName, true]);
            currentAttributeName = "";
            break;
          }
          default: {
            currentAttributeName += char;
          }
        }
        break;
      }
      // IS_IN_TAG | IS_TAG_NAME_READ | IS_IN_ATTRIBUTE_QUOTE
      case 37: {
        switch (char) {
          case '"': {
            state = state & ~IS_IN_ATTRIBUTE_QUOTE;
            xml.node.o.attributes.push([
              currentAttributeName,
              currentAttributeValue,
            ]);
            currentAttributeName = "";
            currentAttributeValue = "";
            break;
          }
          case "\\": {
            state = state | IS_ESCAPED;
            break;
          }
          default: {
            currentAttributeValue += char;
          }
        }
        break;
      }
      // IS_IN_TAG | IS_TAG_NAME_READ | IS_IN_ATTRIBUTE_QUOTE | IS_ESCAPED
      case 45: {
        currentAttributeValue += char;
        state = state & ~IS_ESCAPED;
        break;
      }
    }
  }

  if (!xml.isTopLevel()) {
    throw new XmlParserError(
      `XML closing tag is missing. Expected a close tag for '${xml.node.o.tag}' before the end of the document.`,
      xmlStr.length - 1
    );
  }

  return xml.serialize();
}

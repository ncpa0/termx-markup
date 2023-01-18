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
  isTextNode = false;
  tag = "";
  attributes: Array<[attributeName: string, value: string | boolean]> = [];
  content: Array<string | XmlObjectBuilder> = [];

  constructor(private parent?: XmlObjectBuilder) {}

  addChild() {
    const child = new XmlObjectBuilder(this);
    this.content.push(child);
    return child;
  }

  getParent() {
    return this.parent;
  }

  serialize(): XmlObject {
    return {
      textNode: this.isTextNode,
      tag: this.tag,
      attributes: this.attributes.slice(),
      content: this.content.map((c) => {
        if (typeof c === "string") {
          return c;
        }
        return c.serialize();
      }),
    };
  }
}

class XmlBuilder {
  /** XML node that is currently being built. */
  node: XmlObjectBuilder = new XmlObjectBuilder();

  constructor() {
    this.node.isTextNode = true;
  }

  addContentChar(char: string) {
    const lastIndex = this.node.content.length - 1;
    if (typeof this.node.content[lastIndex] === "string") {
      (this.node.content[lastIndex] as string) += char;
    } else {
      this.node.content.push(char);
    }
  }

  addChildNode() {
    this.node = this.node.addChild();
  }

  moveUp() {
    this.node = this.node.getParent()!;
  }

  isTopLevel() {
    const parent = this.node.getParent();
    return parent === undefined;
  }

  serialize(): XmlObject {
    if (
      this.node.content.length === 1 &&
      this.node.tag === "" &&
      typeof this.node.content[0] !== "string"
    ) {
      return this.node.content[0]!.serialize();
    }
    return this.node.serialize();
  }
}

/** XML parsing function used internally by the library. */
export function parseXml(xmlStr: string) {
  XmlParserError.setIsWorkingOn(xmlStr);

  let isInTag = false;
  let isInAttribute = false;
  let isInAttribQuote = false;
  let isEscaped = false;

  let isClosingTag = false;

  let tagNameRead = false;

  let currentAttributeName = "";
  let currentAttributeValue = "";

  let closeTagName = "";

  const xml = new XmlBuilder();

  for (let i = 0; i < xmlStr.length; i++) {
    const char = xmlStr[i]!;

    if (isInAttribQuote) {
      if (isEscaped) {
        currentAttributeValue += char;
      } else {
        switch (char) {
          case '"': {
            isInAttribQuote = false;
            xml.node.attributes.push([
              currentAttributeName,
              currentAttributeValue,
            ]);
            currentAttributeName = "";
            currentAttributeValue = "";
            break;
          }
          case "\\": {
            isEscaped = true;
            continue;
          }
          default: {
            currentAttributeValue += char;
          }
        }
      }
    } else if (isInAttribute) {
      switch (char) {
        case "=": {
          isInAttribute = false;
          if (xmlStr[i + 1] === '"') {
            isInAttribQuote = true;
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
          isInAttribute = false;
          xml.node.attributes.push([currentAttributeName, true]);
          currentAttributeName = "";
          break;
        }
        case ">": {
          isInTag = false;
          isInAttribute = false;
          xml.node.attributes.push([currentAttributeName, true]);
          currentAttributeName = "";
          break;
        }
        default: {
          currentAttributeName += char;
        }
      }
    } else if (isClosingTag) {
      switch (char) {
        case " ": {
          break;
        }
        case ">": {
          isClosingTag = false;
          isInTag = false;
          if (closeTagName !== xml.node.tag) {
            throw new XmlParserError(
              `Closing tag does not match opening tag, expected '${xml.node.tag}' but found '${closeTagName}'.`,
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
    } else if (isInTag) {
      if (tagNameRead) {
        switch (char) {
          case " ": {
            break;
          }
          case ">": {
            isInTag = false;
            tagNameRead = false;
            break;
          }
          case "/": {
            if (xmlStr[i + 1] === ">") {
              isInTag = false;
              tagNameRead = false;
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
            isInAttribute = true;
            currentAttributeName += char;
          }
        }
      } else {
        switch (char) {
          case " ": {
            if (xml.node.tag.length > 0) {
              tagNameRead = true;
            }
            break;
          }
          case ">": {
            if (xml.node.tag.length === 0) {
              throw new XmlParserError("No tag name found.", i);
            }
            isInTag = false;
            tagNameRead = false;
            break;
          }
          case "/": {
            if (xmlStr[i + 1] === ">") {
              isInTag = false;
              tagNameRead = false;
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
              i - xml.node.tag.length
            );
          }
          default: {
            xml.node.tag += char;
          }
        }
      }
    } else {
      if (isEscaped) {
        xml.addContentChar(char);
      } else {
        switch (char) {
          case "<": {
            isInTag = true;
            tagNameRead = false;
            isClosingTag = xmlStr[i + 1] === "/";

            if (!isClosingTag) {
              xml.addChildNode();
            } else {
              i += 1;
            }
            break;
          }
          case "\\": {
            isEscaped = true;
            continue;
          }
          default: {
            xml.addContentChar(char);
          }
        }
      }
    }

    isEscaped = false;
  }

  if (!xml.isTopLevel()) {
    throw new XmlParserError(
      `XML closing tag is missing. Expected a close tag for '${xml.node.tag}' before the end of the document.`,
      xmlStr.length - 1
    );
  }

  return xml.serialize();
}

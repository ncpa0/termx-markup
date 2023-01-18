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
            xml.node.o.attributes.push([
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
          xml.node.o.attributes.push([currentAttributeName, true]);
          currentAttributeName = "";
          break;
        }
        case ">": {
          isInTag = false;
          isInAttribute = false;
          xml.node.o.attributes.push([currentAttributeName, true]);
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
            if (xml.node.o.tag.length > 0) {
              tagNameRead = true;
            }
            break;
          }
          case ">": {
            if (xml.node.o.tag.length === 0) {
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
              i - xml.node.o.tag.length
            );
          }
          default: {
            xml.node.o.tag += char;
          }
        }
      }
    } else {
      if (isEscaped) {
        xml.node.addChar(char);
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
            xml.node.addChar(char);
          }
        }
      }
    }

    isEscaped = false;
  }

  if (!xml.isTopLevel()) {
    throw new XmlParserError(
      `XML closing tag is missing. Expected a close tag for '${xml.node.o.tag}' before the end of the document.`,
      xmlStr.length - 1
    );
  }

  return xml.serialize();
}

export type XmlObject = {
  tag: string;
  textNode: boolean;
  attributes: Array<[attributeName: string, value: string | boolean]>;
  content: Array<string | XmlObject>;
};

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

  moveTop() {
    let next = this.node.getParent();
    while (next) {
      this.node = next;
      next = this.node.getParent();
    }
    return this;
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
            throw new Error(
              `Invalid XML. Closing tag does not match opening tag, expected '${xml.node.tag}' but received '${closeTagName}' at (${i}).`
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
            } else {
              throw new Error(
                `Invalid XML. Invalid character encountered at (${i}).`
              );
            }
            break;
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
              throw new Error(`Invalid XML. No tag name found at (${i}).`);
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
            } else {
              throw new Error(
                `Invalid XML. Invalid character encountered at (${i}).`
              );
            }
            break;
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

  return xml.moveTop().serialize();
}

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
  private current: XmlObjectBuilder = new XmlObjectBuilder();

  constructor() {
    this.current.isTextNode = true;
  }

  get isTextNode() {
    return this.current.isTextNode;
  }

  set isTextNode(value: boolean) {
    this.current.isTextNode = value;
  }

  get tag() {
    return this.current.tag;
  }

  set tag(value: string) {
    this.current.tag = value;
  }

  get attributes() {
    return this.current.attributes;
  }

  set attributes(
    value: Array<[attributeName: string, value: string | boolean]>
  ) {
    this.current.attributes = value;
  }

  get content() {
    return this.current.content;
  }

  set content(value: Array<string | XmlObjectBuilder>) {
    this.current.content = value;
  }

  addContentChar(char: string) {
    const lastIndex = this.content.length - 1;
    if (typeof this.content[lastIndex] === "string") {
      (this.content[lastIndex] as string) += char;
    } else {
      this.content.push(char);
    }
  }

  addChild() {
    this.current = this.current.addChild();
  }

  moveUp() {
    this.current = this.current.getParent()!;
  }

  moveTop() {
    let next = this.current.getParent();
    while (next) {
      this.current = next;
      next = this.current.getParent();
    }
    return this;
  }

  serialize(): XmlObject {
    if (
      this.current.content.length === 1 &&
      this.current.tag === "" &&
      typeof this.current.content[0] !== "string"
    ) {
      return this.current.content[0]!.serialize();
    }
    return this.current.serialize();
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
            xml.attributes.push([currentAttributeName, currentAttributeValue]);
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
          xml.attributes.push([currentAttributeName, true]);
          currentAttributeName = "";
          break;
        }
        case ">": {
          isInTag = false;
          isInAttribute = false;
          xml.attributes.push([currentAttributeName, true]);
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
          if (closeTagName !== xml.tag) {
            throw new Error(
              `Invalid XML. Closing tag does not match opening tag, expected '${xml.tag}' but received '${closeTagName}' at (${i}).`
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
            if (xml.tag.length > 0) {
              tagNameRead = true;
            }
            break;
          }
          case ">": {
            if (xml.tag.length === 0) {
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
            xml.tag += char;
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
              xml.addChild();
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

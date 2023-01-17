export type XmlObject = {
  tag: string;
  textNode?: boolean;
  attributes: Array<[attributeName: string, value: string | boolean]>;
  content: Array<string | XmlObject>;
};

/** XML parsing function used internally by the library. */
export function parseXml(xml: string): XmlObject {
  if (xml[0] !== "<") {
    return {
      tag: "",
      textNode: true,
      attributes: [],
      content: parseContent(xml),
    };
  }

  // Create the return object
  const obj: XmlObject = {} as XmlObject;

  // Check for the opening and closing tags
  const startTagRegex = /<(\w+)\s*[^>]*>/;
  const endTagRegex = /<\/(\w+)\s*>/;
  const startTagMatch = xml.match(startTagRegex);
  const endTagMatch = xml.match(endTagRegex);
  if (!startTagMatch || !endTagMatch) {
    return {
      tag: "",
      textNode: true,
      attributes: [],
      content: [xml],
    };
  }

  // Get the tag name and attributes
  const tagName = startTagMatch[1];
  obj["tag"] = tagName!;
  const attributes = startTagMatch[0].slice(
    tagName!.length + 1,
    startTagMatch[0].indexOf(">", tagName!.length)
  );
  if (attributes && attributes[1]) {
    obj["attributes"] = parseAttributes(
      attributes[attributes.length - 1] === "/"
        ? attributes.slice(0, -1)
        : attributes
    );
  } else {
    obj["attributes"] = [];
  }

  // Get the content
  const contentStartIndex = startTagMatch[0].length;
  const contentEndIndex = findEndTagPosition(
    xml.slice(contentStartIndex),
    tagName!
  );
  const content = xml.substring(
    contentStartIndex,
    contentStartIndex + contentEndIndex.position
  );
  if (content.length > 0) {
    // Parse the content recursively
    obj["content"] = parseContent(content);
  } else {
    obj["content"] = [];
  }

  return obj;
}

function parseContent(content: string): Array<string | XmlObject> {
  const results = [];

  let currentIndex = 0;
  let currentChar = content[currentIndex];
  let currentContent = "";
  let currentTag = "";
  let currentAttributeString = "";
  let inTag = false;
  let inAttribute = false;
  let inQuote = false;
  let quoteType = "";

  while (currentIndex < content.length) {
    currentChar = content[currentIndex];
    if (currentChar === "<" && !inQuote) {
      inTag = true;
      currentTag = "";
      currentAttributeString = "";
    } else if (currentChar === ">" && !inQuote) {
      inTag = false;
      if (currentContent.length > 0) {
        results.push(currentContent);
        currentContent = "";
      }

      const prevChar = content[currentIndex - 1];

      if (prevChar === "/") {
        if (currentTag[currentTag.length - 1] === "/") {
          currentTag = currentTag.slice(0, -1);
        }
        results.push(
          parseXml(`<${currentTag} ${currentAttributeString}></${currentTag}>`)
        );
      } else {
        const closeTagIndex = findEndTagPosition(
          content.slice(currentIndex + 1),
          currentTag
        );

        if (closeTagIndex.isSelfClosing) {
          results.push(
            parseXml(
              `<${currentTag} ${currentAttributeString}></${currentTag}>`
            )
          );
          currentIndex = closeTagIndex.position + currentIndex + 1;
        } else {
          const subTag = content.substring(
            currentIndex + 1,
            closeTagIndex.position + currentIndex + 1
          );
          results.push(
            parseXml(
              `<${currentTag} ${currentAttributeString}>${subTag}</${currentTag}>`
            )
          );
          currentIndex =
            closeTagIndex.position + currentIndex + currentTag.length + 3;
        }
      }
      inAttribute = false;
      inQuote = false;
      inTag = false;
    } else if (inTag && currentChar === " " && !inQuote) {
      inAttribute = true;
      currentAttributeString += currentChar;
    } else if (
      inAttribute &&
      (currentChar === "'" || currentChar === '"') &&
      !inQuote
    ) {
      inQuote = true;
      quoteType = currentChar;
      currentAttributeString += currentChar;
    } else if (inAttribute && currentChar === quoteType && inQuote) {
      inQuote = false;
      currentAttributeString += currentChar + " ";
    } else {
      if (inTag) {
        if (inAttribute) {
          currentAttributeString += currentChar;
        } else {
          currentTag += currentChar;
        }
      } else {
        currentContent += currentChar;
      }
    }
    currentIndex++;
  }

  if (currentContent.length > 0) {
    results.push(currentContent);
  }

  return results;
}

function findEndTagPosition(
  content: string,
  tag: string
): { position: number; isSelfClosing: boolean } {
  let c = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i]!;

    switch (char) {
      case "<": {
        const isClosing = content[i + 1] === "/";
        if (isClosing) {
          const isFinalEndTag =
            content.slice(i + 2, i + 2 + tag.length) === tag;

          if (c === 0) {
            if (isFinalEndTag) {
              return {
                position: i,
                isSelfClosing: false,
              };
            }
            throw new Error("Invalid XML. No closing tag found.");
          }

          c--;
        } else {
          c++;
        }
        break;
      }
      case ">": {
        const isClosing = content[i - 1] === "/";
        if (isClosing) {
          if (c === 0) {
            return {
              position: i,
              isSelfClosing: true,
            };
          }

          c--;
        }
        break;
      }
    }
  }

  throw new Error("Invalid XML. No closing tag found.");
}

function parseAttributes(
  attributeString: string
): Array<[attributeName: string, value: string | boolean]> {
  const result: Array<[attributeName: string, value: string | boolean]> = [];

  for (const attr of attributeString.split(" ")) {
    if (attr.length === 0) {
      continue;
    }
    const [name, value] = attr.split("=");
    result.push([name!, value ? value.slice(1, -1) : true]);
  }

  return result;
}

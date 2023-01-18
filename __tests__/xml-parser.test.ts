import { parseXml, XmlParserError } from "../src/xml-parser";

const catchErr = (fn: () => void) => {
  try {
    fn();
  } catch (err) {
    return err as Error;
  }
};

XmlParserError.prototype["getStack"] = jest.fn(() => "at ./index:1:1");

describe("parseXml", () => {
  it("should parse simple xml", () => {
    const xml = "<root><child>child text</child></root>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [],
          content: ["child text"],
        },
      ],
    });
  });

  it("should parse simple xml with a escaped '<' character", () => {
    const xml = "<root><child>child \\< text</child></root>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [],
          content: ["child < text"],
        },
      ],
    });
  });

  it("should parse xml with attribute", () => {
    const xml = '<root><child id="1">child text</child></root>';
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [["id", "1"]],
          content: ["child text"],
        },
      ],
    });
  });

  it("should parse xml with boolean attribute that has whitespace after it", () => {
    const xml = "<root><child bold >  foo bar baz  </child></root>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [["bold", true]],
          content: ["  foo bar baz  "],
        },
      ],
    });
  });

  it("should parse xml with boolean attribute that does not have whitespace after it", () => {
    const xml = "<root><child bold>  foo bar baz  </child></root>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [["bold", true]],
          content: ["  foo bar baz  "],
        },
      ],
    });
  });

  it("should parse xml with multiple boolean attributes", () => {
    const xml =
      "<root><child bold italic strikethrough>  foo bar baz  </child></root>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [
            ["bold", true],
            ["italic", true],
            ["strikethrough", true],
          ],
          content: ["  foo bar baz  "],
        },
      ],
    });
  });

  it("should parse xml with attribute that contains escaped quotes", () => {
    const xml = '<root><child id="1\\"2">child text</child></root>';
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [["id", '1"2']],
          content: ["child text"],
        },
      ],
    });
  });

  it("should parse xml with multiple attributes", () => {
    const xml = '<root><child id="1" class="test">child text</child></root>';
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [
            ["id", "1"],
            ["class", "test"],
          ],
          content: ["child text"],
        },
      ],
    });
  });

  it("should parse xml with multiple attributes including boolean attributes (string, bool, string, bool)", () => {
    const xml =
      '<root><child id="1" bold class="test" italic>child text</child></root>';
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [
            ["id", "1"],
            ["bold", true],
            ["class", "test"],
            ["italic", true],
          ],
          content: ["child text"],
        },
      ],
    });
  });

  it("should parse xml with multiple attributes including boolean attributes (bool, string, bool, string)", () => {
    const xml =
      '<root><child bold id="1" italic class="test">child text</child></root>';
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [
            ["bold", true],
            ["id", "1"],
            ["italic", true],
            ["class", "test"],
          ],
          content: ["child text"],
        },
      ],
    });
  });

  it("should parse xml with multiple children", () => {
    const xml =
      '<root><child id="1" class="test">child text</child><child id="2" class="test">child text</child></root>';
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        {
          tag: "child",
          textNode: false,
          attributes: [
            ["id", "1"],
            ["class", "test"],
          ],
          content: ["child text"],
        },
        {
          tag: "child",
          textNode: false,
          attributes: [
            ["id", "2"],
            ["class", "test"],
          ],
          content: ["child text"],
        },
      ],
    });
  });

  it("should parse xml with multiple children including textNodes", () => {
    const xml =
      "<root>a<child>child text</child>b<child>child text</child>c</root>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      textNode: false,
      attributes: [],
      content: [
        "a",
        {
          tag: "child",
          textNode: false,
          attributes: [],
          content: ["child text"],
        },
        "b",
        {
          tag: "child",
          textNode: false,
          attributes: [],
          content: ["child text"],
        },
        "c",
      ],
    });
  });

  it("should parse an xml without a top level tag", () => {
    const xml = "Hello <p>World</p>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "",
      textNode: true,
      attributes: [],
      content: [
        "Hello ",
        {
          tag: "p",
          textNode: false,
          attributes: [],
          content: ["World"],
        },
      ],
    });
  });

  it("should correctly parse nested tags", () => {
    const xml = "<p>a-start<p>b-start<p>text</p>b-end</p>a-end</p>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "p",
      textNode: false,
      attributes: [],
      content: [
        "a-start",
        {
          tag: "p",
          textNode: false,
          attributes: [],
          content: [
            "b-start",
            {
              tag: "p",
              textNode: false,
              attributes: [],
              content: ["text"],
            },
            "b-end",
          ],
        },
        "a-end",
      ],
    });
  });

  it("should correctly parse top-level self closing tag", () => {
    const xml = "<p />";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "p",
      textNode: false,
      attributes: [],
      content: [],
    });
  });

  it("should correctly parse self closing tag", () => {
    const xml = "<p>Hello<br/><br />World</p>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "p",
      textNode: false,
      attributes: [],
      content: [
        "Hello",
        { tag: "br", textNode: false, attributes: [], content: [] },
        { tag: "br", textNode: false, attributes: [], content: [] },
        "World",
      ],
    });
  });

  it("should correctly parse self closing tag with attributes", () => {
    const xml = '<p>Hello<br id="1"/><br id="2" />World</p>';
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "p",
      textNode: false,
      attributes: [],
      content: [
        "Hello",
        {
          tag: "br",
          textNode: false,
          attributes: [["id", "1"]],
          content: [],
        },
        {
          tag: "br",
          textNode: false,
          attributes: [["id", "2"]],
          content: [],
        },
        "World",
      ],
    });
  });

  describe("with invalid whitespaces in tags", () => {
    it("should ignore whitespace in open tag", () => {
      const xml = "<  p  >Hello</p>";

      const result = parseXml(xml);

      expect(result).toEqual({
        tag: "p",
        textNode: false,
        attributes: [],
        content: ["Hello"],
      });
    });

    it("should ignore whitespace in open tag with attributes", () => {
      const xml = '<  p  id="1"  class="name"  >Hello</p>';

      const result = parseXml(xml);

      expect(result).toEqual({
        tag: "p",
        textNode: false,
        attributes: [
          ["id", "1"],
          ["class", "name"],
        ],
        content: ["Hello"],
      });
    });

    it("should ignore whitespace in close tag", () => {
      const xml = "<p>Hello</  p  >";

      const result = parseXml(xml);

      expect(result).toEqual({
        tag: "p",
        textNode: false,
        attributes: [],
        content: ["Hello"],
      });
    });

    it("should ignore whitespace in all tags in a nested structure", () => {
      const xml =
        "<  p  >foo<  p  >bar<  p  >baz</  p  >qux</  p  >coorg</  p  >";

      const result = parseXml(xml);

      expect(result).toEqual({
        tag: "p",
        textNode: false,
        attributes: [],
        content: [
          "foo",
          {
            tag: "p",
            textNode: false,
            attributes: [],
            content: [
              "bar",
              {
                tag: "p",
                textNode: false,
                attributes: [],
                content: ["baz"],
              },
              "qux",
            ],
          },
          "coorg",
        ],
      });
    });
  });

  describe("negative scenarios", () => {
    it("should correctly format the error message for multiline xml", () => {
      const xml = `
      <root>
        <span>Hello</span>
        <p>World</span>
      </root>
    `;

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw an error if a closing tag is missing", () => {
      const xml = "<p>Hello";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. XML closing tag is missing. Expected a close tag for 'p' before the end of the document."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw an error if a closing tag is missing in a nested structure", () => {
      const xml = "<span>Hello<p>World</p>";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. XML closing tag is missing. Expected a close tag for 'span' before the end of the document."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw an error if the closing tag is not matching the opening tag", () => {
      const xml = "<p>Hello</span>";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. Closing tag does not match opening tag, expected 'p' but found 'span'."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw when encountering / character inside a tag", () => {
      const xml = "<p / >Hello</p>";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. Invalid character encountered."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw when encountering / character inside a tag between attributes", () => {
      const xml = "<p bold / invert >Hello</p>";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. Invalid character encountered."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw when encountering / character inside a tag name", () => {
      const xml = "<sp/an>Hello</sp/an>";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. Invalid character encountered."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw an error if the tag name is empty", () => {
      const xml = "<>Hello</>";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. No tag name found."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw an error if the tag name is empty but an attribute is set", () => {
      const xml = '< class="name">Hello</>';

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. No tag name found."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw an error when encountering = character inside a tag", () => {
      const xml = "<p = >Hello</p>";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. Invalid character encountered."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw an error when encountering = character inside a tag between attributes", () => {
      const xml = "<p bold = invert>Hello</p>";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. Invalid character encountered."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw an error when attribute value is not inside quotes", () => {
      const xml = "<p bold=true>Hello</p>";

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. Attribute values must be enclosed in double quotes."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });

    it("should throw an error when attribute value does not have a quote at the end", () => {
      const xml = '<p bold="true>Hello</p>';

      expect(() => parseXml(xml)).toThrowError(
        "Invalid XML. XML closing tag is missing. Expected a close tag for 'p' before the end of the document."
      );

      const err = catchErr(() => parseXml(xml));
      expect(err?.toString()).toMatchSnapshot();
    });
  });
});

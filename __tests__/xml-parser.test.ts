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

  describe("bench sample", () => {
    const xml = `<any_name attr="https://example.com/somepath">
    <person id="101">
        <phone>+122233344550</phone>
        <name>Jack</name>
        <phone>+122233344551</phone>
        <age>33</age>
        <emptyNode></emptyNode>
        <booleanNode>false</booleanNode>
        <booleanNode>true</booleanNode>
        <selfclosing />
        <selfclosing with="value" />
        <married firstTime="No" attr="val 2">Yes</married>
        <birthday>Wed, 28 Mar 1979 12:13:14 +0300</birthday>
        <address>
            <city>New York</city>
            <street>Park Ave</street>
            <buildingNo>1</buildingNo>
            <flatNo>1</flatNo>
        </address>
        <address>
            <city>Boston</city>
            <street>Centre St</street>
            <buildingNo>33</buildingNo>
            <flatNo>24</flatNo>
        </address>
    </person>
    <person id="102">
        <phone>+122233344553</phone>
        <name>Boris</name>
        <phone>+122233344554</phone>
        <age>34</age>
        <married firstTime="Yes">Yes</married>
        <birthday>Mon, 31 Aug 1970 02:03:04 +0300</birthday>
        <address>
            <city>Moscow</city>
            <street>Kahovka</street>
            <buildingNo>1</buildingNo>
            <flatNo>2</flatNo>
        </address>
        <address>
            <city>Tula</city>
            <street>Lenina</street>
            <buildingNo>3</buildingNo>
            <flatNo>78</flatNo>
        </address>
    </person>
</any_name>`;

    it("is parsed correctly", () => {
      const result = parseXml(xml);
      expect(result).toEqual({
        tag: "any_name",
        textNode: false,
        attributes: [["attr", "https://example.com/somepath"]],
        content: [
          "\n    ",
          {
            tag: "person",
            textNode: false,
            attributes: [["id", "101"]],
            content: [
              "\n        ",
              {
                tag: "phone",
                textNode: false,
                attributes: [],
                content: ["+122233344550"],
              },
              "\n        ",
              {
                tag: "name",
                textNode: false,
                attributes: [],
                content: ["Jack"],
              },
              "\n        ",
              {
                tag: "phone",
                textNode: false,
                attributes: [],
                content: ["+122233344551"],
              },
              "\n        ",
              {
                tag: "age",
                textNode: false,
                attributes: [],
                content: ["33"],
              },
              "\n        ",
              {
                tag: "emptyNode",
                textNode: false,
                attributes: [],
                content: [],
              },
              "\n        ",
              {
                tag: "booleanNode",
                textNode: false,
                attributes: [],
                content: ["false"],
              },
              "\n        ",
              {
                tag: "booleanNode",
                textNode: false,
                attributes: [],
                content: ["true"],
              },
              "\n        ",
              {
                tag: "selfclosing",
                textNode: false,
                attributes: [],
                content: [],
              },
              "\n        ",
              {
                tag: "selfclosing",
                textNode: false,
                attributes: [["with", "value"]],
                content: [],
              },
              "\n        ",
              {
                tag: "married",
                textNode: false,
                attributes: [
                  ["firstTime", "No"],
                  ["attr", "val 2"],
                ],
                content: ["Yes"],
              },
              "\n        ",
              {
                tag: "birthday",
                textNode: false,
                attributes: [],
                content: ["Wed, 28 Mar 1979 12:13:14 +0300"],
              },
              "\n        ",
              {
                tag: "address",
                textNode: false,
                attributes: [],
                content: [
                  "\n            ",
                  {
                    tag: "city",
                    textNode: false,
                    attributes: [],
                    content: ["New York"],
                  },
                  "\n            ",
                  {
                    tag: "street",
                    textNode: false,
                    attributes: [],
                    content: ["Park Ave"],
                  },
                  "\n            ",
                  {
                    tag: "buildingNo",
                    textNode: false,
                    attributes: [],
                    content: ["1"],
                  },
                  "\n            ",
                  {
                    tag: "flatNo",
                    textNode: false,
                    attributes: [],
                    content: ["1"],
                  },
                  "\n        ",
                ],
              },
              "\n        ",
              {
                tag: "address",
                textNode: false,
                attributes: [],
                content: [
                  "\n            ",
                  {
                    tag: "city",
                    textNode: false,
                    attributes: [],
                    content: ["Boston"],
                  },
                  "\n            ",
                  {
                    tag: "street",
                    textNode: false,
                    attributes: [],
                    content: ["Centre St"],
                  },
                  "\n            ",
                  {
                    tag: "buildingNo",
                    textNode: false,
                    attributes: [],
                    content: ["33"],
                  },
                  "\n            ",
                  {
                    tag: "flatNo",
                    textNode: false,
                    attributes: [],
                    content: ["24"],
                  },
                  "\n        ",
                ],
              },
              "\n    ",
            ],
          },
          "\n    ",
          {
            tag: "person",
            textNode: false,
            attributes: [["id", "102"]],
            content: [
              "\n        ",
              {
                tag: "phone",
                textNode: false,
                attributes: [],
                content: ["+122233344553"],
              },
              "\n        ",
              {
                tag: "name",
                textNode: false,
                attributes: [],
                content: ["Boris"],
              },
              "\n        ",
              {
                tag: "phone",
                textNode: false,
                attributes: [],
                content: ["+122233344554"],
              },
              "\n        ",
              {
                tag: "age",
                textNode: false,
                attributes: [],
                content: ["34"],
              },
              "\n        ",
              {
                tag: "married",
                textNode: false,
                attributes: [["firstTime", "Yes"]],
                content: ["Yes"],
              },
              "\n        ",
              {
                tag: "birthday",
                textNode: false,
                attributes: [],
                content: ["Mon, 31 Aug 1970 02:03:04 +0300"],
              },
              "\n        ",
              {
                tag: "address",
                textNode: false,
                attributes: [],
                content: [
                  "\n            ",
                  {
                    tag: "city",
                    textNode: false,
                    attributes: [],
                    content: ["Moscow"],
                  },
                  "\n            ",
                  {
                    tag: "street",
                    textNode: false,
                    attributes: [],
                    content: ["Kahovka"],
                  },
                  "\n            ",
                  {
                    tag: "buildingNo",
                    textNode: false,
                    attributes: [],
                    content: ["1"],
                  },
                  "\n            ",
                  {
                    tag: "flatNo",
                    textNode: false,
                    attributes: [],
                    content: ["2"],
                  },
                  "\n        ",
                ],
              },
              "\n        ",
              {
                tag: "address",
                textNode: false,
                attributes: [],
                content: [
                  "\n            ",
                  {
                    tag: "city",
                    textNode: false,
                    attributes: [],
                    content: ["Tula"],
                  },
                  "\n            ",
                  {
                    tag: "street",
                    textNode: false,
                    attributes: [],
                    content: ["Lenina"],
                  },
                  "\n            ",
                  {
                    tag: "buildingNo",
                    textNode: false,
                    attributes: [],
                    content: ["3"],
                  },
                  "\n            ",
                  {
                    tag: "flatNo",
                    textNode: false,
                    attributes: [],
                    content: ["78"],
                  },
                  "\n        ",
                ],
              },
              "\n    ",
            ],
          },
          "\n",
        ],
      });
    });
  });
});

import { parseXml } from "../src/xml-parser";

describe("parseXml", () => {
  it("should parse simple xml", () => {
    const xml = "<root><child>child text</child></root>";
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      attributes: [],
      content: [
        {
          tag: "child",
          attributes: [],
          content: ["child text"],
        },
      ],
    });
  });

  it("should parse xml with attribute", () => {
    const xml = '<root><child id="1">child text</child></root>';
    const result = parseXml(xml);

    expect(result).toEqual({
      tag: "root",
      attributes: [],
      content: [
        {
          tag: "child",
          attributes: [["id", "1"]],
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
      attributes: [],
      content: [
        {
          tag: "child",
          attributes: [
            ["id", "1"],
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
      attributes: [],
      content: [
        {
          tag: "child",
          attributes: [
            ["id", "1"],
            ["class", "test"],
          ],
          content: ["child text"],
        },
        {
          tag: "child",
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
      attributes: [],
      content: [
        "a",
        {
          tag: "child",
          attributes: [],
          content: ["child text"],
        },
        "b",
        {
          tag: "child",
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
      attributes: [],
      content: [
        "a-start",
        {
          tag: "p",
          attributes: [],
          content: [
            "b-start",
            {
              tag: "p",
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
});

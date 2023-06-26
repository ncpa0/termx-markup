import { MarkupFormatter } from "../../src/formatter/formatter";
import { html } from "../../src/html-tag";

describe("MarkupFormatter", () => {
  describe("should correctly format the xml", () => {
    it("scenario 1", () => {
      const xml = html`
        <line>Hello World</line>
        <line bold color="red">
          Red
          <pre color="blue">or blue?</pre>
          text
        </line>
        <line underscore>
          <span>This</span>
          <pre>is</pre>
          <pre>one</pre>
          <span>line</span>
        </line>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchAnsiString(
        "Hello World\nRed or blue? text\nThis is one line"
      );
      expect(formatted).toContainAnsiStringWithStyles("Hello World", {
        color: "none",
      });
      expect(formatted).toContainAnsiStringWithStyles("Red", {
        color: "red",
        bold: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("or blue?", {
        color: "blue",
        bold: true,
      });
      expect(formatted).toContainAnsiStringWithStyles(" text", {
        color: "red",
        bold: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("This is one line", {
        color: "none",
        underscore: true,
      });

      expect(formatted).toMatchSnapshot();
    });

    it("scenario 2", () => {
      const xml = html`
        <span>
          <span color="red"> Red </span>
          <span color="green"> Green </span>
          <span color="blue"> Blue </span>
          Normal
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchAnsiString("Red Green Blue Normal");
      expect(formatted).toContainAnsiStringWithStyles("Red", {
        color: "red",
      });
      expect(formatted).toContainAnsiStringWithStyles("Green", {
        color: "green",
      });
      expect(formatted).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formatted).toContainAnsiStringWithStyles("Normal", {
        color: "none",
      });
      expect(formatted).toMatchSnapshot();
    });

    it("scenario 3", () => {
      const xml = html`
        <span>
          <span color="red"> Red </span><br />
          <span color="green"> Green </span><br />
          <span color="blue"> Blue </span>< br /> Normal
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchAnsiString("Red\nGreen\nBlue\nNormal");
      expect(formatted).toContainAnsiStringWithStyles("Red", {
        color: "red",
      });
      expect(formatted).toContainAnsiStringWithStyles("Green", {
        color: "green",
      });
      expect(formatted).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formatted).toContainAnsiStringWithStyles("Normal", {
        color: "none",
      });
      expect(formatted).toMatchSnapshot();
    });

    it("scenario 4", () => {
      const xml = html`
        <span bold italic underscore>
          <pre color="red"> Red </pre>
          <pre color="green"> Green </pre>
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchAnsiString(" Red   Green ");
      expect(formatted).toContainAnsiStringWithStyles(" Red ", {
        color: "red",
        bold: true,
        italic: true,
        underscore: true,
      });
      expect(formatted).toContainAnsiStringWithStyles(" Green ", {
        color: "green",
        bold: true,
        italic: true,
        underscore: true,
      });
      expect(formatted).toMatchSnapshot();
    });

    it("scenario 5", () => {
      const xml = html`
        <span join="none" underscore blink bold color="yellow">
          <pre>Lorem </pre>
          <span bold color="blue">
            <pre>ipsum </pre>
            <span dim color="green">
              <pre>dolor </pre>
              <span invert>
                <pre>sit </pre>
              </span>
              <pre>amet </pre>
            </span>
            <pre>consectetur </pre>
          </span>
          <pre>adipiscing</pre>
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchAnsiString(
        "Lorem ipsum dolor sit amet consectetur adipiscing"
      );
      expect(formatted).toContainAnsiStringWithStyles("Lorem ", {
        color: "yellow",
        bold: true,
        blink: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("ipsum ", {
        color: "blue",
        bold: true,
        blink: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("dolor ", {
        color: "green",
        bold: true,
        blink: true,
        dimmed: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("sit ", {
        color: "green",
        bold: true,
        blink: true,
        dimmed: true,
        inverted: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("amet", {
        color: "green",
        bold: true,
        blink: true,
        dimmed: true,
        inverted: false,
      });
      expect(formatted).toContainAnsiStringWithStyles("consectetur ", {
        color: "blue",
        bold: true,
        blink: true,
        dimmed: false,
        inverted: false,
      });
      expect(formatted).toContainAnsiStringWithStyles("adipiscing", {
        color: "yellow",
        bold: true,
        blink: true,
        dimmed: false,
        inverted: false,
      });
      expect(formatted).toMatchSnapshot();
    });

    it("scenario 6", () => {
      // prettier-ignore
      const xml = html`
        <span color="#f5aa42">
          <span color="rgb(137, 245, 209)"> Green </span>
          <pre> </pre>
          <span color="blue"> Blue </span>
          <pre> </pre>
          Orange
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchAnsiString("Green   Blue   Orange");
      expect(formatted).toContainAnsiStringWithStyles("Green", {
        color: "rgb(137, 245, 209)",
      });
      expect(formatted).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formatted).toContainAnsiStringWithStyles("   Orange", {
        color: "#f5aa42",
      });
      expect(formatted).toMatchSnapshot();
    });

    it("scenario 7", () => {
      const xml = html`
        <span underscore color="yellow">
          <pre>Lorem</pre>
          <span no-inherit strike color="blue">
            <pre>ipsum</pre>
            <span dim color="green">
              <pre>dolor</pre>
            </span>
            <pre>sit</pre>
          </span>
          <pre>amet</pre>
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchAnsiString("Lorem ipsum dolor sit amet");
      expect(formatted).toContainAnsiStringWithStyles("Lorem ", {
        color: "yellow",
        underscore: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("ipsum ", {
        color: "blue",
        strikethrough: true,
        underscore: false,
      });
      expect(formatted).toContainAnsiStringWithStyles("dolor", {
        color: "green",
        dimmed: true,
        strikethrough: true,
        underscore: false,
      });
      expect(formatted).toContainAnsiStringWithStyles(" sit", {
        color: "blue",
        strikethrough: true,
        underscore: false,
        dimmed: false,
      });
      expect(formatted).toContainAnsiStringWithStyles(" amet", {
        color: "yellow",
        underscore: true,
        strikethrough: false,
        dimmed: false,
      });
      expect(formatted).toMatchSnapshot();
    });

    it("scenario 8", () => {
      const xml = html`
        <span bold color="yellow">
          [
          <span color="none"> Hello world </span>
          ]
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchAnsiString("[ Hello world ]");
      expect(formatted).toContainAnsiStringWithStyles("[ ", {
        color: "yellow",
        bold: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("Hello world", {
        color: "none",
        bold: true,
      });
      expect(formatted).toContainAnsiStringWithStyles(" ]", {
        color: "yellow",
        bold: true,
      });
      expect(formatted).toMatchSnapshot();
    });

    it("scenario 9", () => {
      const xml = html`
        <span bold color="yellow">
          [<span color="none">Lorem ipsum</span>]<br />
          <span>[</span><span color="none">dolor sit amet</span><span>]</span>
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchAnsiString("[Lorem ipsum]\n[dolor sit amet]");
      expect(formatted).toContainAnsiStringWithStyles("[", {
        color: "yellow",
        bold: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("Lorem ipsum", {
        color: "none",
        bold: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("]", {
        color: "yellow",
        bold: true,
      });
      expect(formatted).toContainAnsiStringWithStyles("dolor sit amet", {
        color: "none",
        bold: true,
      });
      expect(formatted).toMatchSnapshot();
    });
  });

  describe("<ol> tag", () => {
    it("should correctly render list with numbered indexes", () => {
      const xml = html`
        <ol>
          <li color="red">Red</li>
          <li color="green">Green</li>
          <li color="blue">Blue</li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString("1. Red\n2. Green\n3. Blue");
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render nested list scenario 1", () => {
      const xml = html`
        <ol>
          <li color="red">Red</li>
          <li color="green">Green</li>
          <li>
            <span>Shades of blue</span>
            <ol>
              <li color="blue">Blue</li>
              <li color="rgb(0, 147, 175)">Munsell</li>
              <li color="rgb(204, 204, 255)">Periwinkle</li>
            </ol>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(`1. Red
2. Green
3. Shades of blue
   1. Blue
   2. Munsell
   3. Periwinkle`);
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Shades of blue", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Munsell", {
        color: "rgb(0, 147, 175)",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Periwinkle", {
        color: "rgb(204, 204, 255)",
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render nested list scenario 2", () => {
      const xml = html`
        <ol>
          <li color="red">Red</li>
          <li color="green">Green</li>
          <li>
            <span>Shades of blue</span>
            <ol>
              <li color="blue">Blue</li>
              <li color="rgb(0, 147, 175)">Munsell</li>
              <li color="rgb(204, 204, 255)">Periwinkle</li>
            </ol>
            <span>**************</span>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(`1. Red
2. Green
3. Shades of blue
   1. Blue
   2. Munsell
   3. Periwinkle
   **************`);
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Shades of blue", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Munsell", {
        color: "rgb(0, 147, 175)",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Periwinkle", {
        color: "rgb(204, 204, 255)",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("**************", {
        color: "none",
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render nested list scenario 3", () => {
      const xml = html`
        <ol>
          <li color="red">Red</li>
          <li color="green">Green</li>
          <li>
            <span>
              Shades of blue
              <ol>
                <li color="blue">Blue</li>
                <li color="rgb(0, 147, 175)">Munsell</li>
                <li color="rgb(204, 204, 255)">Periwinkle</li>
              </ol>
              **************
            </span>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(`1. Red
2. Green
3. Shades of blue
   1. Blue
   2. Munsell
   3. Periwinkle
   **************`);
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Shades of blue", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Munsell", {
        color: "rgb(0, 147, 175)",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Periwinkle", {
        color: "rgb(204, 204, 255)",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("**************", {
        color: "none",
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render nested list scenario 4", () => {
      const xml = html`
        <ol bold>
          <li color="red">Foo</li>
          <li underscore>
            <ol italic>
              <li dim color="blue">Bar</li>
              <li color="lightBlue">Baz</li>
            </ol>
          </li>
        </ol>
        <ol invert>
          <li color="yellow">Qux</li>
          <li blink>
            Li header
            <ol>
              <li color="green">Corge</li>
            </ol>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(
        `
1. Foo
2. 1. Bar
   2. Baz
1. Qux
2. Li header
   1. Corge
`.trim()
      );
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
        bold: true,
        inverted: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Foo", {
        color: "red",
        bold: true,
        inverted: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
        bold: true,
        inverted: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
        bold: true,
        italic: true,
        underscore: true,
        inverted: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Bar", {
        color: "blue",
        bold: true,
        italic: true,
        underscore: true,
        dimmed: true,
        inverted: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
        bold: true,
        italic: true,
        underscore: true,
        inverted: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Baz", {
        color: "lightBlue",
        bold: true,
        italic: true,
        underscore: true,
        dimmed: false,
        inverted: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
        bold: false,
        inverted: true,
        italic: false,
        underscore: false,
        dimmed: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Qux", {
        color: "yellow",
        bold: false,
        inverted: true,
        italic: false,
        underscore: false,
        dimmed: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
        bold: false,
        inverted: true,
        italic: false,
        underscore: false,
        dimmed: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Li header", {
        color: "none",
        bold: false,
        inverted: true,
        italic: false,
        underscore: false,
        dimmed: false,
        blink: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Corge", {
        color: "green",
        bold: false,
        inverted: true,
        italic: false,
        underscore: false,
        dimmed: false,
        blink: true,
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render text that comes after the nested list", () => {
      const xml = html`
        <span>
          <ol>
            <li color="red">Red</li>
            <li color="green">Green</li>
            <li>
              <span>Shades of blue</span>
              <ol>
                <li color="blue">Blue</li>
                <li color="rgb(0, 147, 175)">Munsell</li>
                <li color="rgb(204, 204, 255)">Periwinkle</li>
              </ol>
            </li>
          </ol>
          <span>Some text</span>
        </span>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(`1. Red
2. Green
3. Shades of blue
   1. Blue
   2. Munsell
   3. Periwinkle
Some text`);
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Shades of blue", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Munsell", {
        color: "rgb(0, 147, 175)",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Periwinkle", {
        color: "rgb(204, 204, 255)",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Some text", {
        color: "none",
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render multiline list elements with just a few elems", () => {
      const xml = html`
        <ol>
          <li color="red">
            <line>Red</line>
            <span bold>Red</span>
          </li>
          <li color="green">
            <line>Green</line>
            <span bold>Green</span>
          </li>
          <li color="blue">
            <line>Blue</line>
            <span bold>Blue</span>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(
        "1. Red\n   Red\n2. Green\n   Green\n3. Blue\n   Blue"
      );
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
        bold: true,
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render multiline list elements with more than 9 elements", () => {
      const xml = html`
        <ol underscore>
          <li color="red">
            <line bold>Red</line>
            <span>Red</span>
          </li>
          <li color="green">
            <line bold>Green</line>
            <span>Green</span>
          </li>
          <li color="blue">
            <line bold>Blue</line>
            <span>Blue</span>
          </li>
          <li color="yellow">
            <line bold>Yellow</line>
            <span>Yellow</span>
          </li>
          <li color="magenta">
            <line bold>Magenta</line>
            <span>Magenta</span>
          </li>
          <li color="cyan">
            <line bold>Cyan</line>
            <span>Cyan</span>
          </li>
          <li color="white">
            <line bold>White</line>
            <span>White</span>
          </li>
          <li color="lightRed">
            <line bold>Light Red</line>
            <span>Light Red</span>
          </li>
          <li color="lightGreen">
            <line bold>Light Green</line>
            <span>Light Green</span>
          </li>
          <li color="lightYellow">
            <line bold>Light Yellow</line>
            <span>Light Yellow</span>
          </li>
          <li color="lightBlue">
            <line bold>Light Blue</line>
            <span>Light Blue</span>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(
        `
1.  Red
    Red
2.  Green
    Green
3.  Blue
    Blue
4.  Yellow
    Yellow
5.  Magenta
    Magenta
6.  Cyan
    Cyan
7.  White
    White
8.  Light Red
    Light Red
9.  Light Green
    Light Green
10. Light Yellow
    Light Yellow
11. Light Blue
    Light Blue
   `.trim()
      );
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
        bold: false,
      });

      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("4.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Yellow", {
        color: "yellow",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Yellow", {
        color: "yellow",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("5.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Magenta", {
        color: "magenta",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Magenta", {
        color: "magenta",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("6.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Cyan", {
        color: "cyan",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Cyan", {
        color: "cyan",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("7.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("White", {
        color: "white",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("White", {
        color: "white",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("8.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Light Red", {
        color: "lightRed",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Light Red", {
        color: "lightRed",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("9.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Light Green", {
        color: "lightGreen",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Light Green", {
        color: "lightGreen",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("10.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Light Yellow", {
        color: "lightYellow",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Light Yellow", {
        color: "lightYellow",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("11.", {
        color: "none",
        underscore: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Light Blue", {
        color: "lightBlue",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Light Blue", {
        color: "lightBlue",
        bold: false,
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render multiline list elements with more than 9 nested elements", () => {
      const xml = html`
        <ol bg="#acf64c">
          <li>Element 1</li>
          <li>Element 2</li>
          <li>
            <line>Colors:</line>
            <pad size="2">
              <ol color="#000000">
                <li color="red">
                  <span>red</span>
                </li>
                <li color="green">
                  <span>green</span>
                </li>
                <li color="blue">
                  <span>blue</span>
                </li>
                <li color="yellow">
                  <span>yellow</span>
                </li>
                <li color="magenta">
                  <span>magenta</span>
                </li>
                <li color="cyan">
                  <span>cyan</span>
                </li>
                <li color="white">
                  <span>white</span>
                </li>
                <li color="lightRed">
                  <span>lightRed</span>
                </li>
                <li color="lightGreen">
                  <span>lightGreen</span>
                </li>
                <li color="lightYellow">
                  <span>lightYellow</span>
                </li>
                <li color="lightBlue">
                  <span>lightBlue</span>
                </li>
                <li color="lightMagenta">
                  <span>lightMagenta</span>
                </li>
              </ol>
            </pad>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(
        `
1. Element 1
2. Element 2
3. Colors:
     1.  red
     2.  green
     3.  blue
     4.  yellow
     5.  magenta
     6.  cyan
     7.  white
     8.  lightRed
     9.  lightGreen
     10. lightYellow
     11. lightBlue
     12. lightMagenta
    `.trim()
      );
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Element 1", {
        color: "none",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Element 2", {
        color: "none",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Colors:", {
        color: "none",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("red", {
        color: "red",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("green", {
        color: "green",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("blue", {
        color: "blue",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("4.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("yellow", {
        color: "yellow",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("5.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("magenta", {
        color: "magenta",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("6.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("cyan", {
        color: "cyan",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("7.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("white", {
        color: "white",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("8.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("lightRed", {
        color: "lightRed",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("9.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("lightGreen", {
        color: "lightGreen",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("10.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("lightYellow", {
        color: "lightYellow",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("11.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("lightBlue", {
        color: "lightBlue",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("12.", {
        color: "rgb(0, 0, 0)",
        bg: "#acf64c",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("lightMagenta", {
        color: "lightMagenta",
        bg: "#acf64c",
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("with <ul> tag nested inside", () => {
      const xml = html`
        <ol>
          <li color="red">Foo</li>
          <li color="red">Bar</li>
          <li color="yellow">
            Baz:
            <ul>
              <li color="blue">Baz 1</li>
              <li color="blue">Baz 2</li>
              <li color="blue">Baz 3</li>
            </ul>
          </li>
          <li color="red">Qux</li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(`1. Foo
2. Bar
3. Baz:
   ● Baz 1
   ● Baz 2
   ● Baz 3
4. Qux`);
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Foo", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Bar", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Baz:", {
        color: "yellow",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("●", {
        color: "yellow",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Baz 1", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Baz 2", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Baz 3", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("4.", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Qux", {
        color: "red",
      });
      expect(formattedXml).toMatchSnapshot();
    });
  });

  describe("<ul> tag", () => {
    it("should correctly render list with bullet indexes", () => {
      const xml = html`
        <ul>
          <li color="red">Red</li>
          <li color="green">Green</li>
          <li color="blue">Blue</li>
        </ul>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(`● Red
● Green
● Blue`);
      expect(formattedXml).toContainAnsiStringWithStyles("●", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render nested list", () => {
      const xml = html`
        <ul color="yellow">
          <li color="red">Red</li>
          <li color="green">Green</li>
          <li>
            <span>Shades of blue</span>
            <ul type="circle">
              <li color="blue">Blue</li>
              <li color="rgb(0, 147, 175)">Munsell</li>
              <li color="rgb(204, 204, 255)">Periwinkle</li>
            </ul>
          </li>
        </ul>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(`● Red
● Green
● Shades of blue
  ○ Blue
  ○ Munsell
  ○ Periwinkle`);
      expect(formattedXml).toContainAnsiStringWithStyles("●", {
        color: "yellow",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Shades of blue", {
        color: "yellow",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("○", {
        color: "yellow",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Munsell", {
        color: "rgb(0, 147, 175)",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Periwinkle", {
        color: "rgb(204, 204, 255)",
      });

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render multiline list elements", () => {
      const xml = html`
        <ul type="square">
          <li color="red">
            <line bold>Red</line>
            <span>Red</span>
          </li>
          <li color="green">
            <line bold>Green</line>
            <span>Green</span>
          </li>
          <li color="blue">
            <line bold>Blue</line>
            <span>Blue</span>
          </li>
        </ul>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(
        "■ Red\n  Red\n■ Green\n  Green\n■ Blue\n  Blue"
      );
      expect(formattedXml).toContainAnsiStringWithStyles("■", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Red", {
        color: "red",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Green", {
        color: "green",
        bold: false,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
        bold: true,
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Blue", {
        color: "blue",
        bold: false,
      });

      expect(formattedXml).toMatchSnapshot();
    });

    it("with <ol> tag nested inside", () => {
      const xml = html`
        <ul>
          <li color="red">Foo</li>
          <li color="red">Bar</li>
          <li color="yellow">
            Baz:
            <ol>
              <li color="blue">Baz 1</li>
              <li color="blue">Baz 2</li>
              <li color="blue">Baz 3</li>
            </ol>
          </li>
          <li color="red">Qux</li>
        </ul>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(`● Foo
● Bar
● Baz:
  1. Baz 1
  2. Baz 2
  3. Baz 3
● Qux`);
      expect(formattedXml).toContainAnsiStringWithStyles("●", {
        color: "none",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Foo", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Bar", {
        color: "red",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Baz:", {
        color: "yellow",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("1.", {
        color: "yellow",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Baz 1", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("2.", {
        color: "yellow",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Baz 2", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("3.", {
        color: "yellow",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Baz 3", {
        color: "blue",
      });
      expect(formattedXml).toContainAnsiStringWithStyles("Qux", {
        color: "red",
      });
      expect(formattedXml).toMatchSnapshot();
    });
  });

  describe("<pad> tag", () => {
    it("should not do anything id the size is not specified", () => {
      const xml = html`<pad>Test</pad>`;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString("Test");
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly add padding for simple text", () => {
      const xml = html`<pad size="2">Test</pad>`;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString("  Test");
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly add padding for multiline text", () => {
      const xml = html`<pad size="2">
        <line>Line 1</line>
        <line>Line 2</line>
        <line>Line 3</line>
      </pad>`;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString("  Line 1\n  Line 2\n  Line 3");
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly add padding for multiline text with nested tags", () => {
      const xml = html`
        <pad size="3">
          <line>Line 1</line>
          <line>Line 2</line>
          <line>
            <span>tag 1</span>
            <s />
            <span>tag 2</span>
          </line>
        </pad>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(
        "   Line 1\n   Line 2\n   tag 1 tag 2"
      );
      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly add padding for nested pad tags", () => {
      const xml = html`
        <pad size="2">
          <line>Line 1</line>
          <line>Line 2</line>
          <line>
            <pad size="2">
              <span>tag 1</span>
              <span>tag 2</span>
            </pad>
          </line>
        </pad>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchAnsiString(
        "  Line 1\n  Line 2\n    tag 1 tag 2"
      );
      expect(formattedXml).toMatchSnapshot();
    });
  });
});

import { MarkupFormatter } from "../../src/formatter/formatter";
import { html } from "../../src/html-tag";

describe("MarkupFormatter", () => {
  describe("should correctly format the xml", () => {
    it("scenario 1", () => {
      const xml = html`
        <line>Hello World</line>
        <line color="red">
          Red
          <pre color="blue"> or blue? </pre>
          text
        </line>
        <line>
          <span>This</span>
          <pre> is </pre>
          <pre>one </pre>
          <span>line</span>
        </line>
      `;

      const formatted = MarkupFormatter.format(xml);

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

      expect(formatted).toMatchSnapshot();
    });

    it("scenario 4", () => {
      const xml = html`
        <pre bold italic underscore>
          <span color="red"> Red </span>
          <span color="green"> Green </span>
        </pre>
      `;

      const formatted = MarkupFormatter.format(xml);

      expect(formatted).toMatchSnapshot();
    });

    it("scenario 5", () => {
      const xml = html`
        <span blink bold color="yellow">
          <pre>Lorem </pre>
          <span bold color="blue">
            <pre>ipsum </pre>
            <span dim color="green">
              <pre>dolor </pre>
              <span invert>
                <pre>sit </pre>
              </span>
              <pre>amet</pre>
            </span>
            <pre> consectetur </pre>
          </span>
          <pre>adipiscing </pre>
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

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

      expect(formatted).toMatchSnapshot();
    });

    it("scenario 7", () => {
      const xml = html`
        <span underscore color="yellow">
          <pre>Lorem </pre>
          <span no-inherit strike color="blue">
            <pre>ipsum </pre>
            <span dim color="green">
              <pre>dolor </pre>
            </span>
            <pre> sit </pre>
          </span>
          <pre>amet</pre>
        </span>
      `;

      const formatted = MarkupFormatter.format(xml);

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

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render nested list", () => {
      const xml = html`
        <ol>
          <li color="red">Red</li>
          <li color="green">Green</li>
          <li>
            <line>Shades of blue</line>
            <ol>
              <li color="blue">Blue</li>
              <li color="rgb(0, 147, 175)">Munsell</li>
              <li color="rgb(204, 204, 255)">Periwinkle</li>
            </ol>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render multiline list elements", () => {
      const xml = html`
        <ol>
          <li color="red">
            <line>Red</line>
            <span>Red</span>
          </li>
          <li color="green">
            <line>Green</line>
            <span>Green</span>
          </li>
          <li color="blue">
            <line>Blue</line>
            <span>Blue</span>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render multiline list elements with more than 9 elements", () => {
      const xml = html`
        <ol>
          <li color="red">
            <line>Red</line>
            <span>Red</span>
          </li>
          <li color="green">
            <line>Green</line>
            <span>Green</span>
          </li>
          <li color="blue">
            <line>Blue</line>
            <span>Blue</span>
          </li>
          <li color="yellow">
            <line>Yellow</line>
            <span>Yellow</span>
          </li>
          <li color="magenta">
            <line>Magenta</line>
            <span>Magenta</span>
          </li>
          <li color="cyan">
            <line>cyan</line>
            <span>cyan</span>
          </li>
          <li color="white">
            <line>white</line>
            <span>white</span>
          </li>
          <li color="lightRed">
            <line>lightRed</line>
            <span>lightRed</span>
          </li>
          <li color="lightGreen">
            <line>lightGreen</line>
            <span>lightGreen</span>
          </li>
          <li color="lightYellow">
            <line>lightYellow</line>
            <span>lightYellow</span>
          </li>
          <li color="lightBlue">
            <line>lightBlue</line>
            <span>lightBlue</span>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render multiline list elements with more than 9 nested elements", () => {
      const xml = html`
        <ol>
          <li>Element 1</li>
          <li>Element 2</li>
          <li>
            <line>Colors:</line>
            <ol>
              <li color="red">
                <line>Red</line>
                <span>Red</span>
              </li>
              <li color="green">
                <line>Green</line>
                <span>Green</span>
              </li>
              <li color="blue">
                <line>Blue</line>
                <span>Blue</span>
              </li>
              <li color="yellow">
                <line>Yellow</line>
                <span>Yellow</span>
              </li>
              <li color="magenta">
                <line>Magenta</line>
                <span>Magenta</span>
              </li>
              <li color="cyan">
                <line>cyan</line>
                <span>cyan</span>
              </li>
              <li color="white">
                <line>white</line>
                <span>white</span>
              </li>
              <li color="lightRed">
                <line>lightRed</line>
                <span>lightRed</span>
              </li>
              <li color="lightGreen">
                <line>lightGreen</line>
                <span>lightGreen</span>
              </li>
              <li color="lightYellow">
                <line>lightYellow</line>
                <span>lightYellow</span>
              </li>
              <li color="lightBlue">
                <line>lightBlue</line>
                <span>lightBlue</span>
              </li>
              <li color="lightMagenta">
                <line>lightMagenta</line>
                <span>lightMagenta</span>
              </li>
            </ol>
          </li>
        </ol>
      `;

      const formattedXml = MarkupFormatter.format(xml);

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

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render nested list", () => {
      const xml = html`
        <ul>
          <li color="red">Red</li>
          <li color="green">Green</li>
          <li>
            <line>Shades of blue</line>
            <ul type="circle">
              <li color="blue">Blue</li>
              <li color="rgb(0, 147, 175)">Munsell</li>
              <li color="rgb(204, 204, 255)">Periwinkle</li>
            </ul>
          </li>
        </ul>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly render multiline list elements", () => {
      const xml = html`
        <ul type="square">
          <li color="red">
            <line>Red</line>
            <span>Red</span>
          </li>
          <li color="green">
            <line>Green</line>
            <span>Green</span>
          </li>
          <li color="blue">
            <line>Blue</line>
            <span>Blue</span>
          </li>
        </ul>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchSnapshot();
    });
  });

  describe("<pad> tag", () => {
    it("should not do anything id the size is not specified", () => {
      const xml = html`<pad>Test</pad>`;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly add padding for simple text", () => {
      const xml = html`<pad size="2">Test</pad>`;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly add padding for multiline text", () => {
      const xml = html`<pad size="2"
        ><line>Line 1</line><line>Line 2</line><line>Line 3</line></pad
      >`;

      const formattedXml = MarkupFormatter.format(xml);

      expect(formattedXml).toMatchSnapshot();
    });

    it("should correctly add padding for multiline text with nested tags", () => {
      const xml = html`
        <pad size="2">
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
              <s />
              <span>tag 2</span>
            </pad>
          </line>
        </pad>
      `;

      const formattedXml = MarkupFormatter.format(xml);

      console.log(formattedXml);

      expect(formattedXml).toMatchSnapshot();
    });
  });
});

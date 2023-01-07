import { TermxFontColor } from "../../src/colors/termx-font-colors";
import { MarkupFormatter } from "../../src/formatter/formatter";
import { html } from "../../src/html-tag";

describe("MarkupFormatter", () => {
  it("should correctly format the xml", () => {
    const xml = html`
      <p>Hello World</p>
      <p color="red">Red <p color="blue">or blue?</p> text</p>
      <span>This </span>is <span> one </span><span>line </span>
    `;

    const formatted = MarkupFormatter.format(xml);

    console.log(formatted);

    const expectedResult = `${TermxFontColor.get(
      "unset"
    )}Hello World\n${TermxFontColor.get("unset")}${TermxFontColor.get(
      "red"
    )}Red ${TermxFontColor.get("blue")}or blue?${
      TermxFontColor.get("unset") + TermxFontColor.get("red")
    } text\n${TermxFontColor.get("unset")}This ${TermxFontColor.get(
      "unset"
    )}is one ${TermxFontColor.get("unset")}line ${TermxFontColor.get("unset")}`;

    expect(formatted).toBe(expectedResult);
  });

  it("should correctly format the xml with a custom formatter", () => {
    const xml = html`<p color="green">All tests have passed.</p>`;

    const formatted = MarkupFormatter.format(xml);

    console.log(formatted);
  });
});

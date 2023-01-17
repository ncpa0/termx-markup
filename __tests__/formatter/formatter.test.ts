import { TermxFontColor } from "../../src/colors/termx-font-colors";
import { MarkupFormatter } from "../../src/formatter/formatter";
import { html } from "../../src/html-tag";

describe("MarkupFormatter", () => {
  it("should correctly format the xml", () => {
    const xml = html`
      <p>Hello World</p>
      <p color="red">Red <span color="blue">or blue?</span> text</p>
      <p>This <span>is</span> <span>one</span> line</p>
    `;

    const formatted = MarkupFormatter.format(xml);

    const expectedResult = `${TermxFontColor.get(
      "unset"
    )}Hello World\n${TermxFontColor.get("unset")}${TermxFontColor.get(
      "red"
    )}Red ${TermxFontColor.get("blue")}or blue?${
      TermxFontColor.get("unset") + TermxFontColor.get("red")
    } text\n${TermxFontColor.get("unset")}This is${TermxFontColor.get(
      "unset"
    )} one${TermxFontColor.get("unset")} line${TermxFontColor.get("unset")}`;

    expect(formatted).toBe(expectedResult);
  });
});

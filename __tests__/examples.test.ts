import { html, Output } from "../src/index";

describe("test", () => {
  it("t", () => {
    Output.print(html`
      <br />
      <br />
      <line>Drinks:</line>
      <ul>
        <li>Coffee</li>
        <li>Tea</li>
        <li>
          <line>Milk</line>
          <ul type="circle">
            <li>Skim</li>
            <li>Whole</li>
          </ul>
        </li>
      </ul>
      <br />
      <br />
    `);
  });
});

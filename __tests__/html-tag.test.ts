import { html } from "../src/html-tag";

describe("html", () => {
  it("should correctly construct a string", () => {
    expect(html`<div>${"hello"}</div>`).toBe("<div>hello</div>");
  });

  it("should correctly sanitize parameters", () => {
    expect(html`<div>${"<script>alert('hello')</script>"}</div>`).toBe(
      "<div>&lt;script&gt;alert('hello')&lt;/script&gt;</div>"
    );
  });
});

/**
 * Creates a html string from the given template literal. Each
 * parameter in the template literal is escaped to not include
 * xml tag characters.
 *
 * @example
 *   html`<div>${"<span>hello</span>"}</div>`;
 *   // > <div>&lt;span&gt;hello&lt;/span&gt;</div>
 */
export function html(...args: any[]): string {
  const b = args[0];
  let c = "",
    a = 0,
    d = 0;
  for (c = b[0], a = 1, d = args.length; a < d; a++) {
    /** One of the parameters in the template literal. */
    const param = args[a];

    if (
      typeof param === "object" &&
      param !== null &&
      param.name === "RawHtml"
    ) {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      c += param.toString() + b[a];
    } else {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      c += sanitizeHtml(param.toString()) + b[a];
    }
  }
  return c;
}

/**
 * Creates a RawHtml object that can be used to insert raw HTML
 * into a `html` template.
 *
 * @example
 *   html`<div>${"<span>hello</span>"}</div>`;
 *   // > <div>&lt;span&gt;hello&lt;/span&gt;</div>
 *
 *   html`<div>${raw("<span>hello</span>")}</div>`;
 *   // > <div><span>hello</span></div>
 */
export function raw(html: string): RawHtml {
  return new RawHtml(html);
}

function sanitizeHtml(html: string): string {
  return html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function desanitizeHtml(html: string): string {
  return html.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

class RawHtml {
  name = "RawHtml";
  constructor(public html: string) {}

  toString(): string {
    return this.html;
  }
}

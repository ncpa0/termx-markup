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
    if (
      typeof args[a] === "object" &&
      args[a] !== null &&
      args[a].name === "RawHtml"
    ) {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      c += String(args[a]) + b[a];
    } else {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      c += sanitizeHtml(String(args[a])) + b[a];
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

function isEscaped(str: string, position: number): boolean {
  let backslashCount = 0;

  for (let i = position - 1; i >= 0; i--) {
    if (str[i] === "\\") {
      backslashCount++;
    } else {
      break;
    }
  }

  return backslashCount % 2 === 1;
}

function sanitizeHtml(html: string): string {
  const result = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lastIndex = result.length - 1;
  if (result[lastIndex] === "\\") {
    if (!isEscaped(result, lastIndex)) {
      return result + "\\";
    }
  }

  return result;
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

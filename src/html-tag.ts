type HtmlOptions = {
  sanitizeParams?: boolean;
};

function htmlFactory(opts?: HtmlOptions) {
  let next: (v: any, param: any) => string;

  function html(...args: any[]): string {
    const params = args[0];
    let content = "",
      idx = 0,
      d = 0;
    for (content = params[0], idx = 1, d = args.length; idx < d; idx++) {
      content += next(args[idx], params[idx]);
    }

    return content;
  }

  function nextSanitize(v: any, param: any): string {
    if (typeof v === "object" && v !== null && v.name === "RawHtml") {
      return String(v) + String(param);
    } else {
      return sanitizeHtml(String(v)) + String(param);
    }
  }

  function nextNoSanitize(v: any, param: any): string {
    return String(v) + String(param);
  }

  if (opts?.sanitizeParams === false) {
    next = nextNoSanitize;
  } else {
    next = nextSanitize;
  }

  /**
   * Changes the `sanitizeParams` option of this html function.
   * When called on the exported html function it will affect all
   * html templates globally.
   */
  html.setSanitizeParams = (v: boolean) => {
    if (v === false) {
      next = nextNoSanitize;
    } else {
      next = nextSanitize;
    }
  };

  /** Create a new `html` function with the given options. */
  html.new = (opts?: HtmlOptions) => {
    return htmlFactory(opts);
  };

  /**
   * Replaces all triangle brackets, which are usually used for
   * html tags HTML Entities, in the given strings with HTML
   * Entities.
   *
   * This is a no-op if the html sanitization is enabled. (`html`
   * will automatically sanitize all params)
   *
   * @example
   *   html.sanitize("<span></span>"); // -> "&lt;span&gt;&lt;/span&gt;"
   */
  html.sanitize = (str: string) => sanitizeHtml(str);

  /**
   * Creates a RawHtml object that can be used to insert raw HTML
   * into a `html` template.
   *
   * This is a no-op if the html sanitization is disabled.
   */
  html.raw = (str: string) => raw(str);

  return html;
}

/**
 * Creates a html string from the given template literal. Each
 * parameter in the template literal is escaped to not include
 * xml tag characters.
 *
 * @example
 *   html`<div>${"<span>hello</span>"}</div>`;
 *   // > <div>&lt;span&gt;hello&lt;/span&gt;</div>
 */
export const html = htmlFactory({ sanitizeParams: true });

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

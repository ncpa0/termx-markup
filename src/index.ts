import { MarkupFormatter } from "./formatter/formatter";
import { html, raw } from "./html-tag";
import { parseMarkup } from "./markup-parser";
import { Output, OutputBuffer } from "./output";

export type { MarkupNode } from "./markup-parser";
export { MarkupFormatter, html, raw, Output, OutputBuffer, parseMarkup };

export default {
  MarkupFormatter,
  html,
  raw,
  Output,
  OutputBuffer,
  parseMarkup,
};

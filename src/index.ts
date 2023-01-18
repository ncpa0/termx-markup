import { MarkupFormatter } from "./formatter/formatter";
import { html, raw } from "./html-tag";
import { Output, OutputBuffer } from "./output";
import { parseXml } from "./xml-parser";

export type { XmlObject } from "./xml-parser";
export { MarkupFormatter, html, raw, Output, OutputBuffer, parseXml };

export default {
  MarkupFormatter,
  html,
  raw,
  Output,
  OutputBuffer,
  parseXml,
};

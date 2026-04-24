import { MarkupFormatter } from "./formatter/formatter";
import { html, raw } from "./html-tag";
import { parseMarkup } from "./markup-parser";
import { Output, OutputBuffer } from "./output";
import { Settings } from "./settings";
import {
  terminalWidth,
  wrapTerminalLines,
  trimStartToWidth,
} from "./terminal-width";

export type { MarkupNode } from "./markup-parser";
export {
  MarkupFormatter,
  Output,
  OutputBuffer,
  Settings,
  html,
  parseMarkup,
  raw,
  terminalWidth,
  wrapTerminalLines,
  trimStartToWidth,
};

export default {
  MarkupFormatter,
  html,
  raw,
  Output,
  OutputBuffer,
  parseMarkup,
  Settings,
  terminalWidth,
  wrapTerminalLines,
  trimStartToWidth,
};

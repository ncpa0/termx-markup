/** @typedef {import("../../dist/types/formatter/text-renderer/styles").Styles} Styles */
/** @typedef {typeof import("../../dist/types/colors/termx-font-colors").TermxFontColors} FontColors */
/** @typedef {typeof import("../../dist/types/colors/termx-bg-color").TermxBgColors} BgColors */

const stripAnsi = require("./strip-ansi.js").default;
/** @type {BgColors} */
const TermxBgColors =
  require("../../dist/cjs/colors/termx-bg-color.cjs").TermxBgColors;
/** @type {FontColors} */
const TermxFontColors =
  require("../../dist/cjs/colors/termx-font-colors.cjs").TermxFontColors;
const MarkupFormatter = require("../../src/index").MarkupFormatter;

const green = TermxFontColors.get("green");
const red = TermxFontColors.get("red");
const unset = TermxFontColors.get("unset");

const escape = "\u001b";
const Bold = `${escape}[1m`;
const Dimmed = `${escape}[2m`;

const predefinedFontColorsNames = Object.fromEntries(
  Object.entries(TermxFontColors["predefinedColors"]).map(([k, v]) => [v, k])
);
delete predefinedFontColorsNames["\u001b[0m"];

const predefinedBgColorsNames = Object.fromEntries(
  Object.entries(TermxBgColors["predefinedColors"]).map(([k, v]) => [v, k])
);
delete predefinedBgColorsNames["\u001b[0m"];

/**
 * @param {string} received
 * @param {string} expected
 * @param {Styles} styles
 */
function toContainAnsiStringWithStyles(received, expected, styles, offset = 0) {
  const sgrRegex = /\x1b\[([0-9;]*)m/g;

  function createStyleState() {
    return {
      color: undefined,
      bg: undefined,

      bold: false,
      dimmed: false,
      italic: false,
      underscore: false,
      blink: false,
      inverted: false,
      strikethrough: false,
    };
  }

  function resetStyle(style) {
    Object.assign(style, createStyleState());
  }

  function applySgr(style, ansi, codesStr) {
    if (ansi in predefinedFontColorsNames) {
      style.color = predefinedFontColorsNames[ansi];
      return;
    }
    if (ansi in predefinedBgColorsNames) {
      style.bg = predefinedBgColorsNames[ansi];
      return;
    }

    const codes =
      codesStr === "" ? [0] : codesStr.split(";").map((n) => Number(n));

    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];

      switch (code) {
        case 0:
          resetStyle(style);
          break;

        case 1:
          style.bold = true;
          break;
        case 2:
          style.dimmed = true;
          break;
        case 3:
          style.italic = true;
          break;
        case 4:
          style.underscore = true;
          break;
        case 5:
          style.blink = true;
          break;
        case 7:
          style.inverted = true;
          break;
        case 9:
          style.strikethrough = true;
          break;

        case 22:
          style.bold = false;
          style.dimmed = false;
          break;
        case 23:
          style.italic = false;
          break;
        case 24:
          style.underscore = false;
          break;
        case 25:
          style.blink = false;
          break;
        case 27:
          style.inverted = false;
          break;
        case 29:
          style.strikethrough = false;
          break;

        case 39:
          style.color = undefined;
          break;
        case 49:
          style.bg = undefined;
          break;

        // 8-color foreground
        default:
          if (code >= 30 && code <= 37) {
            style.color = code;
          } else if (code >= 90 && code <= 97) {
            style.color = code;
          } else if (code >= 40 && code <= 47) {
            style.bg = code;
          } else if (code >= 100 && code <= 107) {
            style.bg = code;
          }

          // 24-bit foreground
          else if (code === 38 && codes[i + 1] === 2 && codes.length >= i + 5) {
            style.color = `rgb(${codes[i + 2]}, ${codes[i + 3]}, ${
              codes[i + 4]
            })`;
            i += 4;
          }

          // 24-bit background
          else if (code === 48 && codes[i + 1] === 2 && codes.length >= i + 5) {
            style.bg = `rgb(${codes[i + 2]}, ${codes[i + 3]}, ${codes[i + 4]})`;
            i += 4;
          }
      }
    }
  }

  function parseAnsi(input) {
    const chars = [];
    const style = createStyleState();

    let lastIndex = 0;
    let match;

    while ((match = sgrRegex.exec(input))) {
      const text = input.slice(lastIndex, match.index);

      for (const char of text) {
        chars.push({
          char,
          style: { ...style },
        });
      }

      applySgr(style, match[0], match[1]);

      lastIndex = sgrRegex.lastIndex;
    }

    const tail = input.slice(lastIndex);

    for (const char of tail) {
      chars.push({
        char,
        style: { ...style },
      });
    }

    return chars;
  }

  const chars = parseAnsi(received);

  const visibleText = chars.map((c) => c.char).join("");

  function styleMatches(segment) {
    const errors = [];

    function expectBoolean(prop, label) {
      if (styles[prop] == null) return;

      const allHave = segment.every((c) => c.style[prop]);

      if (styles[prop] === true && !allHave) {
        errors.push({
          styleName: label,
          expected: "true",
        });
      }

      if (styles[prop] === false && allHave) {
        errors.push({
          styleName: label,
          expected: "false",
        });
      }
    }

    if ("bold" in styles) {
      expectBoolean("bold", "Bold");
    }
    if ("dimmed" in styles) {
      expectBoolean("dimmed", "Dimmed");
    }
    if ("italic" in styles) {
      expectBoolean("italic", "Italic");
    }
    if ("underscore" in styles) {
      expectBoolean("underscore", "Underscore");
    }
    if ("blink" in styles) {
      expectBoolean("blink", "Blink");
    }
    if ("inverted" in styles) {
      expectBoolean("inverted", "Inverted");
    }
    if ("strikethrough" in styles) {
      expectBoolean("strikethrough", "Strike-Through");
    }

    if (styles.color) {
      const expectedColor = styles.color || "none";

      const allMatch = segment.every((c) => {
        if (styles.color === "none") {
          return c.style.color == null;
        }

        return c.style.color === expectedColor;
      });

      if (!allMatch) {
        errors.push({
          styleName: "Text Color",
          expected: styles.color,
          received: JSON.stringify([
            ...new Set(segment.map((c) => c.style.color)),
          ]),
        });
      }
    }

    if (styles.bg) {
      const expectedBg = styles.bg || "none";

      const allMatch = segment.every((c) => {
        if (styles.bg === "none") {
          return c.style.bg == null;
        }

        return c.style.bg === expectedBg;
      });

      if (!allMatch) {
        errors.push({
          styleName: "Background Color",
          expected: styles.bg,
          received: JSON.stringify([
            ...new Set(segment.map((c) => c.style.bg)),
          ]),
        });
      }
    }

    return errors;
  }

  let matchIndex = visibleText.indexOf(expected, offset);

  let firstErrors = null;

  while (matchIndex !== -1) {
    const segment = chars.slice(matchIndex, matchIndex + expected.length);

    const errors = styleMatches(segment);

    if (errors.length === 0) {
      return {
        pass: true,
        message: () => "",
      };
    }

    if (!firstErrors) {
      firstErrors = errors;
    }

    matchIndex = visibleText.indexOf(expected, matchIndex + 1);
  }

  if (firstErrors) {
    return {
      pass: false,
      message: () =>
        firstErrors
          .map((err) => {
            let msg =
              `Expected style property ${err.styleName} ` +
              `to be '${err.expected}'.`;

            if (err.received != null) {
              msg += `\n\nReceived: ${err.received}`;
            }

            return msg;
          })
          .join("\n\n"),
    };
  }

  return {
    pass: false,
    message:
      () => `${Bold}Received string does not contain the expected substring.${unset}

${green + Bold}Expected:${unset} ${formatExpectedReceived(stripAnsi(expected))}

${red + Bold}Received:${unset} ${formatExpectedReceived(stripAnsi(received))}`,
  };
}

/** @param {string} value */
const formatExpectedReceived = (value) =>
  "" +
  value

    .split("\n")
    .map((line, i, arr) => {
      const eolChar = i < arr.length - 1 ? Dimmed + "\\n" + unset : "";

      line = line.replace(/ /g, Dimmed + String.fromCharCode(183) + unset);
      if (i === 0) return line + eolChar;
      return " ".repeat(10) + line + eolChar;
    })
    .join("\n") +
  "";

const customMatchers = {
  /**
   * @param {string} received
   * @param {string} expected
   */
  toMatchAnsiString(received, expected) {
    const stripped = stripAnsi(received);

    if (stripped === expected) {
      return {
        message: () => "",
        pass: true,
      };
    }

    const displayExpected = formatExpectedReceived(expected);

    const displayReceived = formatExpectedReceived(stripped);

    return {
      message:
        () => `${Bold}Received string does not match the expected string.${unset}

${green + Bold}Expected:${unset} ${displayExpected}

${red + Bold}Received:${unset} ${displayReceived}`,
      pass: false,
    };
  },
  toContainAnsiStringWithStyles,
};

customMatchers.toContainAnsiStringWithStyles =
  customMatchers.toContainAnsiStringWithStyles.bind(customMatchers);
customMatchers.toMatchAnsiString =
  customMatchers.toMatchAnsiString.bind(customMatchers);

expect.extend(customMatchers);

const format = MarkupFormatter.format.bind(MarkupFormatter);
jest.spyOn(MarkupFormatter, "format").mockImplementation((...args) => {
  const formatted = format(...args);

  if (process.env["DISPLAY_RESULTS"] === "true") {
    process.stdout.write(
      `\u001b[1m${expect.getState().currentTestName}:\u001b[0m\n\n` +
        formatted
          .split("\n")
          .map((line) => line.replace(/ /g, String.fromCharCode(183)))
          .join("\n") +
        "\n\n"
    );
  }
  return formatted;
});

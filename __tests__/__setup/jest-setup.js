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
const Italic = `${escape}[3m`;
const Underscore = `${escape}[4m`;
const Blink = `${escape}[5m`;
const Inverted = `${escape}[7m`;
const StrikeThrough = `${escape}[9m`;

const predefinedFontColors = Object.values(
  TermxFontColors["predefinedColors"]
).filter((ansi) => ansi !== unset);
const predefinedBgColors = Object.values(
  TermxBgColors["predefinedColors"]
).filter((ansi) => ansi !== unset);

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
  /**
   * @param {string} received
   * @param {string} expected
   * @param {Styles} styles
   */
  toContainAnsiStringWithStyles(received, expected, styles, offset = 0) {
    const strStartIndex = received.indexOf(expected, offset);

    if (strStartIndex === -1) {
      return {
        message:
          () => `${Bold}Received string does not contain the expected substring.${unset}
  
${green + Bold}Expected:${unset} ${formatExpectedReceived(stripAnsi(expected))}
          
${red + Bold}Received:${unset} ${formatExpectedReceived(stripAnsi(received))}`,
        pass: false,
      };
    }

    /** @type {string[]} */
    let ansi = [];
    let nextAnsi = "";

    for (let i = strStartIndex - 1; i >= 0; i--) {
      const char = received[i];

      if (char === "\n") {
        continue;
      }

      if (nextAnsi === "" && char !== "m") {
        break;
      }

      if (char === escape) {
        ansi.push(escape + nextAnsi);
        nextAnsi = "";
        continue;
      }

      nextAnsi = char + nextAnsi;
    }

    /** @type {{ styleName: string; expected: string }[]} */
    const errors = [];

    if (styles.bg) {
      if (styles.color === "none") {
        const hasAnyColor = ansi.some((ansi) => {
          if (predefinedBgColors.includes(ansi)) {
            return true;
          } else if (ansi.startsWith(`${escape}[48;2;`)) {
            return true;
          }
          return false;
        });

        if (hasAnyColor) {
          errors.push({
            styleName: "Background Color",
            expected: styles.color,
          });
        }
      } else {
        const expectedBg = TermxBgColors.get(styles.bg);
        const hasStyle = ansi.some((ansi) => ansi === expectedBg);

        if (!hasStyle) {
          errors.push({ styleName: "Background Color", expected: styles.bg });
        }
      }
    }

    if (styles.color) {
      if (styles.color === "none") {
        const hasAnyColor = ansi.some((ansi) => {
          if (predefinedFontColors.includes(ansi)) {
            return true;
          } else if (ansi.startsWith(`${escape}[38;2;`)) {
            return true;
          }
          return false;
        });

        if (hasAnyColor) {
          errors.push({ styleName: "Text Color", expected: styles.color });
        }
      } else {
        const expectedColor = TermxFontColors.get(styles.color);
        const hasExpectedColor = ansi.some((ansi) => ansi === expectedColor);

        if (!hasExpectedColor) {
          errors.push({ styleName: "Text Color", expected: styles.color });
        }
      }
    }

    const hasBold = ansi.some((ansi) => ansi === Bold);
    if (styles.bold === true && !hasBold) {
      errors.push({ styleName: "Bold", expected: "true" });
    } else if (styles.bold === false && hasBold) {
      errors.push({ styleName: "Bold", expected: "false" });
    }

    const hasDimmed = ansi.some((ansi) => ansi === Dimmed);
    if (styles.dimmed === true && !hasDimmed) {
      errors.push({ styleName: "Dimmed", expected: "true" });
    } else if (styles.dimmed === false && hasDimmed) {
      errors.push({ styleName: "Dimmed", expected: "false" });
    }

    const hasItalic = ansi.some((ansi) => ansi === Italic);
    if (styles.italic === true && !hasItalic) {
      errors.push({ styleName: "Italic", expected: "true" });
    } else if (styles.italic === false && hasItalic) {
      errors.push({ styleName: "Italic", expected: "false" });
    }

    const hasUnderscore = ansi.some((ansi) => ansi === Underscore);
    if (styles.underscore === true && !hasUnderscore) {
      errors.push({ styleName: "Underscore", expected: "true" });
    } else if (styles.underscore === false && hasUnderscore) {
      errors.push({ styleName: "Underscore", expected: "false" });
    }

    const hasBlink = ansi.some((ansi) => ansi === Blink);
    if (styles.blink === true && !hasBlink) {
      errors.push({ styleName: "Blink", expected: "true" });
    } else if (styles.blink === false && hasBlink) {
      errors.push({ styleName: "Blink", expected: "false" });
    }

    const hasInverted = ansi.some((ansi) => ansi === Inverted);
    if (styles.inverted === true && !hasInverted) {
      errors.push({ styleName: "Inverted", expected: "true" });
    } else if (styles.inverted === false && hasInverted) {
      errors.push({ styleName: "Inverted", expected: "false" });
    }

    const hasStrikethrough = ansi.some((ansi) => ansi === StrikeThrough);
    if (styles.strikethrough === true && !hasStrikethrough) {
      errors.push({ styleName: "Strike-Through", expected: "true" });
    } else if (styles.strikethrough === false && hasStrikethrough) {
      errors.push({ styleName: "Strike-Through", expected: "false" });
    }

    if (errors.length === 0) {
      return {
        message: () => "",
        pass: true,
      };
    }

    const nextOffset = strStartIndex + expected.length;
    const next = this.toContainAnsiStringWithStyles(
      received,
      expected,
      styles,
      nextOffset
    );

    if (next.pass) {
      return next;
    }

    return {
      message: () => {
        const messages = errors.map(
          (err) =>
            `Expected style property ${err.styleName} to be '${err.expected}'.`
        );

        return messages.join("\n");
      },
      pass: false,
    };
  },
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

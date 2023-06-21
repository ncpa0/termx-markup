/** @typedef {import("../dist/cjs/formatter/text-renderer/styles").Styles} Styles */

const stripAnsi = require("./strip-ansi.js").default;
const { TermxBgColors } = require("../../dist/cjs/colors/termx-bg-color.cjs");
const {
  TermxFontColors,
} = require("../../dist/cjs/colors/termx-font-colors.cjs");

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

expect.extend({
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

    const displayExpected = expected
      .split("\n")
      .map((line, i) => {
        if (i === 0) return line;
        return " ".repeat(11) + line;
      })
      .join("\n");

    const displayReceived = stripped
      .split("\n")
      .map((line, i) => {
        if (i === 0) return line;
        return " ".repeat(11) + line;
      })
      .join("\n");

    return {
      message: () => `Received string does not match the expected string.

Expected: "${displayExpected}"

Received: "${displayReceived}"`,
      pass: false,
    };
  },
  /**
   * @param {string} received
   * @param {string} expected
   * @param {Styles} styles
   */
  toContainAnsiStringWithStyles(received, expected, styles) {
    const strStartIndex = received.indexOf(expected);

    /** @type {string[]} */
    let ansi = [];
    let nextAnsi = "";

    for (let i = strStartIndex - 1; i >= 0; i--) {
      const char = received[i];

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
      const expectedBg = TermxBgColors.get(styles.bg);
      const hasStyle = ansi.some((ansi) => ansi === expectedBg);

      if (!hasStyle) {
        errors.push({ styleName: "Background Color", expected: styles.bg });
      }
    }

    if (styles.color) {
      const expectedColor = TermxFontColors.get(styles.color);
      const hasStyle = ansi.some((ansi) => ansi === expectedColor);

      if (!hasStyle) {
        errors.push({ styleName: "Text Color", expected: styles.color });
      }
    }

    if (styles.bold) {
      const hasStyle = ansi.some((ansi) => ansi === Bold);

      if (!hasStyle) {
        errors.push({ styleName: "Bold", expected: "true" });
      }
    }

    if (styles.dimmed) {
      const hasStyle = ansi.some((ansi) => ansi === Dimmed);

      if (!hasStyle) {
        errors.push({ styleName: "Dimmed", expected: "true" });
      }
    }

    if (styles.italic) {
      const hasStyle = ansi.some((ansi) => ansi === Italic);

      if (!hasStyle) {
        errors.push({ styleName: "Italic", expected: "true" });
      }
    }

    if (styles.underscore) {
      const hasStyle = ansi.some((ansi) => ansi === Underscore);

      if (!hasStyle) {
        errors.push({ styleName: "Underscore", expected: "true" });
      }
    }

    if (styles.blink) {
      const hasStyle = ansi.some((ansi) => ansi === Blink);

      if (!hasStyle) {
        errors.push({ styleName: "Blink", expected: "true" });
      }
    }

    if (styles.inverted) {
      const hasStyle = ansi.some((ansi) => ansi === Inverted);

      if (!hasStyle) {
        errors.push({ styleName: "Inverted", expected: "true" });
      }
    }

    if (styles.strikethrough) {
      const hasStyle = ansi.some((ansi) => ansi === StrikeThrough);

      if (!hasStyle) {
        errors.push({ styleName: "Strike-Through", expected: "true" });
      }
    }

    if (errors.length === 0) {
      return {
        message: () => "",
        pass: true,
      };
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
});

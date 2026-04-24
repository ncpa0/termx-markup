/**
 * Returns the visible character count of a string when printed
 * to a terminal. Handles ANSI escape sequences (colors, cursor
 * movement, etc.) and Unicode wide characters (CJK, emoji,
 * etc.).
 *
 * Optimized for high-throughput use.
 */
export function terminalWidth(str: string): number {
  const len = str.length;
  let width = 0;
  let i = 0;

  while (i < len) {
    const cp = str.charCodeAt(i);

    // ── Fast path: printable ASCII (0x20–0x7E) ──────────────────────────────
    if (cp >= 0x20 && cp <= 0x7e) {
      width++;
      i++;
      continue;
    }

    // ── ESC sequences ────────────────────────────────────────────────────────
    if (cp === 0x1b) {
      // ESC
      i++;
      if (i >= len) break;

      const next = str.charCodeAt(i);

      // CSI sequence: ESC [ ... <final byte 0x40–0x7E>
      if (next === 0x5b) {
        // [
        i++;
        while (i < len) {
          const c = str.charCodeAt(i++);
          if (c >= 0x40 && c <= 0x7e) break; // final byte
        }
        continue;
      }

      // OSC sequence: ESC ] ... ST (ESC \ or BEL 0x07)
      if (next === 0x5d) {
        // ]
        i++;
        while (i < len) {
          const c = str.charCodeAt(i++);
          if (c === 0x07) break; // BEL terminator
          if (c === 0x1b && i < len && str.charCodeAt(i) === 0x5c) {
            i++; // ESC \ (ST) terminator
            break;
          }
        }
        continue;
      }

      // DCS / PM / APC: ESC P/X/^ ... ST
      if (next === 0x50 || next === 0x58 || next === 0x5e || next === 0x5f) {
        i++;
        while (i < len) {
          const c = str.charCodeAt(i++);
          if (c === 0x1b && i < len && str.charCodeAt(i) === 0x5c) {
            i++;
            break;
          }
        }
        continue;
      }

      // SS2 / SS3: ESC N/O — consume one more byte
      if (next === 0x4e || next === 0x4f) {
        i += 2;
        continue;
      }

      // All other ESC sequences (RIS, DECSC, etc.) — consume the byte after ESC
      i++;
      continue;
    }

    // ── C0 controls (non-printing) ───────────────────────────────────────────
    if (cp < 0x20) {
      // Tab is the only C0 with a commonly defined visible width (not accurate
      // without column state, but 1 is a reasonable approximation here).
      if (cp === 0x09) {
        width++;
      }
      // CR, LF, BS, BEL, etc. — zero width
      i++;
      continue;
    }

    // ── DEL (0x7F) ───────────────────────────────────────────────────────────
    if (cp === 0x7f) {
      i++;
      continue;
    }

    // ── C1 controls (0x80–0x9F) ─────────────────────────────────────────────
    if (cp >= 0x80 && cp <= 0x9f) {
      i++;
      continue;
    }

    // ── Full-width Unicode ───────────────────────────────────────────────────
    // Decode the full codepoint (handle surrogate pairs for astral plane).
    let codepoint = cp;
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < len) {
      const lo = str.charCodeAt(i + 1);
      if (lo >= 0xdc00 && lo <= 0xdfff) {
        codepoint = 0x10000 + ((cp - 0xd800) << 10) + (lo - 0xdc00);
        i += 2;
      } else {
        i++;
      }
    } else {
      i++;
    }

    width += wcwidth(codepoint);
  }

  return width;
}

/**
 * Returns the terminal cell width of a Unicode codepoint: 0 —
 * combining / non-spacing / control 1 — normal character 2 —
 * wide character (CJK, many emoji, etc.)
 *
 * Based on Unicode 15 East_Asian_Width + derived data. Uses
 * range comparisons — no tables, no strings,
 * branch-predictor-friendly.
 */
function wcwidth(cp: number): 0 | 1 | 2 {
  // Non-spacing / combining marks → 0
  if (cp === 0) return 0;
  if (cp < 0x300) return 1;

  // Combining diacritical marks (U+0300–U+036F)
  if (cp <= 0x036f) return 0;
  if (cp < 0x0483) return 1;
  if (cp <= 0x0489) return 0; // Combining Cyrillic
  if (cp < 0x0591) return 1;
  if (cp <= 0x05bd) return 0; // Hebrew points
  if (cp === 0x05bf) return 0;
  if (cp <= 0x05c7 && cp >= 0x05c1) return 0;
  if (cp < 0x0600) return 1;
  if (cp <= 0x0605) return 0; // Arabic number signs
  if (cp < 0x0610) return 1;
  if (cp <= 0x061a) return 0;
  if (cp < 0x061c) return 1;
  if (cp <= 0x061d) return 0;
  if (cp < 0x064b) return 1;
  if (cp <= 0x065f) return 0; // Arabic combining
  if (cp === 0x0670) return 0;
  if (cp < 0x06d6) return 1;
  if (cp <= 0x06dc) return 0;
  if (cp < 0x06df) return 1;
  if (cp <= 0x06e4) return 0;
  if (cp <= 0x06e6) return 1;
  if (cp <= 0x06e8) return 0;
  if (cp < 0x06ea) return 1;
  if (cp <= 0x06ed) return 0;
  if (cp < 0x0711) return 1;
  if (cp === 0x0711) return 0;
  if (cp < 0x0730) return 1;
  if (cp <= 0x074a) return 0; // Syriac combining

  // Zero-width / variation selectors
  if (cp === 0x200b) return 0; // ZWSP
  if (cp === 0x200c) return 0; // ZWNJ
  if (cp === 0x200d) return 0; // ZWJ
  if (cp === 0x2028) return 0;
  if (cp === 0x2029) return 0;
  if (cp === 0xfeff) return 0; // BOM / ZWNBSP
  if (cp >= 0xfe00 && cp <= 0xfe0f) return 0; // variation selectors
  if (cp >= 0xe0100 && cp <= 0xe01ef) return 0; // variation selectors supplement

  // Soft hyphen
  if (cp === 0x00ad) return 0;

  // Enclosing marks
  if (cp >= 0x20d0 && cp <= 0x20f0) return 0;
  if (cp >= 0x1ab0 && cp <= 0x1aff) return 0;
  if (cp >= 0x1dc0 && cp <= 0x1dff) return 0;

  // Emoji variation selectors (VS-16 etc.) — presentation handled by base char
  if (cp >= 0xfe10 && cp <= 0xfe19) return 2; // CJK compatibility forms
  if (cp >= 0xfe30 && cp <= 0xfe6f) return 2; // CJK compatibility, small forms

  // ── Wide ranges (East_Asian_Width = W or F) ──────────────────────────────
  if (cp >= 0x1100 && cp <= 0x115f) return 2; // Hangul Jamo
  if (cp >= 0x2e80 && cp <= 0x303e) return 2; // CJK radicals, Kangxi, etc.
  if (cp >= 0x3041 && cp <= 0x33bf) return 2; // Kana, Bopomofo, etc.
  if (cp >= 0x33ff && cp <= 0xa4cf) return 2; // CJK Unified & Extension A
  if (cp >= 0xa960 && cp <= 0xa97f) return 2; // Hangul Jamo Extended-A
  if (cp >= 0xac00 && cp <= 0xd7a3) return 2; // Hangul syllables
  if (cp >= 0xf900 && cp <= 0xfaff) return 2; // CJK Compatibility Ideographs
  if (cp >= 0xff01 && cp <= 0xff60) return 2; // Fullwidth ASCII
  if (cp >= 0xffe0 && cp <= 0xffe6) return 2; // Fullwidth currency signs
  if (cp >= 0x1b000 && cp <= 0x1b12f) return 2; // Kana Supplement
  if (cp >= 0x1f004 && cp <= 0x1f0cf) return 2; // Mahjong / playing cards
  if (cp >= 0x1f200 && cp <= 0x1f2ff) return 2; // Enclosed Ideographic
  if (cp >= 0x1f300 && cp <= 0x1f64f) return 2; // Misc symbols, emoticons
  if (cp >= 0x1f900 && cp <= 0x1f9ff) return 2; // Supplemental symbols
  if (cp >= 0x20000 && cp <= 0x2fffd) return 2; // CJK Extension B-F, compat
  if (cp >= 0x30000 && cp <= 0x3fffd) return 2; // CJK Extension G+

  return 1;
}

/**
 * Trims the beginning of a string until its terminal width is <=
 * maxWidth. Handles ANSI escape sequences and Unicode wide
 * characters correctly.
 */
export function trimStartToWidth(str: string, maxWidth: number): string {
  const runes = [...str]; // Split by Unicode codepoints (handles surrogate pairs)

  let totalWidth = terminalWidth(str);
  if (totalWidth <= maxWidth) return str;

  let i = 0;

  while (i < runes.length && totalWidth > maxWidth) {
    const cp = runes[i]!.codePointAt(0)!;

    // ANSI escape sequence — skip without subtracting width (they're zero-width)
    if (cp === 0x1b) {
      i++;
      if (i >= runes.length) break;
      const next = runes[i]!.codePointAt(0)!;

      if (next === 0x5b) {
        // CSI
        i++;
        while (i < runes.length) {
          const c = runes[i++]!.codePointAt(0)!;
          if (c >= 0x40 && c <= 0x7e) break;
        }
      } else if (next === 0x5d) {
        // OSC
        i++;
        while (i < runes.length) {
          const c = runes[i++]!.codePointAt(0)!;
          if (c === 0x07) break;
          if (
            c === 0x1b &&
            i < runes.length &&
            runes[i]!.codePointAt(0) === 0x5c
          ) {
            i++;
            break;
          }
        }
      } else if (
        next === 0x50 ||
        next === 0x58 ||
        next === 0x5e ||
        next === 0x5f
      ) {
        // DCS/PM/APC
        i++;
        while (i < runes.length) {
          const c = runes[i++]!.codePointAt(0)!;
          if (
            c === 0x1b &&
            i < runes.length &&
            runes[i]!.codePointAt(0) === 0x5c
          ) {
            i++;
            break;
          }
        }
      } else if (next === 0x4e || next === 0x4f) {
        // SS2/SS3
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // Visible character — subtract its width and advance
    const charWidth = terminalWidth(runes[i]!);
    totalWidth -= charWidth;
    i++;
  }

  return runes.slice(i).join("");
}

/**
 * Wraps a string by splitting it into lines, then splitting any
 * line whose terminal width exceeds maxWidth into smaller lines
 * of at most maxWidth width. Returns the list of lines without
 * joining them back.
 */
export function wrapTerminalLines(str: string, maxWidth: number): string[] {
  const inputLines = str.split("\n");
  const result: string[] = [];

  for (const line of inputLines) {
    if (terminalWidth(line) <= maxWidth) {
      result.push(line);
      continue;
    }

    // Split this line into chunks of at most maxWidth terminal width
    const runes = [...line];
    let currentLine = "";
    let currentWidth = 0;
    let i = 0;

    while (i < runes.length) {
      const cp = runes[i]!.codePointAt(0)!;

      // ANSI escape sequence — append without affecting width
      if (cp === 0x1b) {
        let seq = runes[i];
        i++;
        if (i >= runes.length) {
          currentLine += seq;
          break;
        }
        const next = runes[i]!.codePointAt(0)!;
        seq += runes[i]!;

        if (next === 0x5b) {
          // CSI
          i++;
          while (i < runes.length) {
            const c = runes[i]!;
            seq += c;
            const code = c.codePointAt(0)!;
            i++;
            if (code >= 0x40 && code <= 0x7e) break;
          }
        } else if (next === 0x5d) {
          // OSC
          i++;
          while (i < runes.length) {
            const c = runes[i]!;
            seq += c;
            const code = c.codePointAt(0)!;
            i++;
            if (code === 0x07) break;
            if (
              code === 0x1b &&
              i < runes.length &&
              runes[i]!.codePointAt(0) === 0x5c
            ) {
              seq += runes[i++]!;
              break;
            }
          }
        } else if (
          next === 0x50 ||
          next === 0x58 ||
          next === 0x5e ||
          next === 0x5f
        ) {
          // DCS/PM/APC
          i++;
          while (i < runes.length) {
            const c = runes[i]!;
            seq += c;
            const code = c.codePointAt(0)!;
            i++;
            if (
              code === 0x1b &&
              i < runes.length &&
              runes[i]!.codePointAt(0) === 0x5c
            ) {
              seq += runes[i++]!;
              break;
            }
          }
        } else if (next === 0x4e || next === 0x4f) {
          // SS2/SS3
          if (i + 1 < runes.length) seq += runes[++i]!;
          i++;
        } else {
          i++;
        }

        currentLine += seq;
        continue;
      }

      // Visible character
      const charWidth = terminalWidth(runes[i]!);

      if (currentWidth + charWidth > maxWidth) {
        // Flush current line and start a new one
        result.push(currentLine);
        currentLine = "";
        currentWidth = 0;
      }

      currentLine += runes[i];
      currentWidth += charWidth;
      i++;
    }

    if (currentLine !== "") {
      result.push(currentLine);
    }
  }

  return result;
}

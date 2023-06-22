import { TermxBgColors } from "../../colors/termx-bg-color";
import { TermxFontColors } from "../../colors/termx-font-colors";
import type { Styles } from "./styles";

const escape = "\u001b";
const Unset = `${escape}[0m`;
const Bold = `${escape}[1m`;
const Dimmed = `${escape}[2m`;
const Italic = `${escape}[3m`;
const Underscore = `${escape}[4m`;
const Blink = `${escape}[5m`;
const Inverted = `${escape}[7m`;
const StrikeThrough = `${escape}[9m`;

export class CharacterGroup {
  private static styleToAnsi(style: Styles): string {
    let result = "";

    if (style.color) {
      result += TermxFontColors.get(style.color);
    }

    if (style.bg) {
      result += TermxBgColors.get(style.bg);
    }

    if (style.bold) {
      result += Bold;
    }

    if (style.dimmed) {
      result += Dimmed;
    }

    if (style.italic) {
      result += Italic;
    }

    if (style.underscore) {
      result += Underscore;
    }

    if (style.blink) {
      result += Blink;
    }

    if (style.inverted) {
      result += Inverted;
    }

    if (style.strikethrough) {
      result += StrikeThrough;
    }

    return result;
  }

  private style: string | null = null;

  constructor(public readonly styles: Styles) {}

  createChars(value: string): Character[] {
    const chars: Character[] = [];

    for (let i = 0; i < value.length; i++) {
      chars.push(new Character(this, value[i]!));
    }

    return chars;
  }

  renderStyles(): string {
    if (this.style) {
      return this.style;
    }
    this.style = `${Unset}${CharacterGroup.styleToAnsi(this.styles)}`;
    return this.style;
  }

  isEqual(other: CharacterGroup): boolean {
    return other.renderStyles() === this.renderStyles();
  }
}

export class Character {
  constructor(public group: CharacterGroup, public value: string) {}
}

export class TextRenderer {
  characters: Character[] = [];

  get length(): number {
    return this.characters.length;
  }

  get lines(): number {
    let count = 0;

    for (let i = 0; i < this.characters.length; i++) {
      if (this.characters[i]!.value === "\n") {
        count++;
      }
    }

    return count;
  }

  get lastGroup(): CharacterGroup | undefined {
    return this.characters[this.characters.length - 1]?.group;
  }

  get lastCharacter(): Character | undefined {
    return this.characters[this.characters.length - 1];
  }

  prependAllLines(chars: Character[]) {
    this.characters = chars.concat(
      this.characters.flatMap((char, i) => {
        if (char.value === "\n" && i !== this.characters.length - 1) {
          return [char, ...chars];
        }
        return char;
      })
    );

    return this;
  }

  appendAllLines(chars: Character[]) {
    this.characters = this.characters.flatMap((char, i) => {
      if (char.value === "\n") {
        return [...chars, char];
      }
      return char;
    });

    return this;
  }

  appendText(text: Character[]) {
    this.characters = this.characters.concat(text);

    return this;
  }

  prependText(text: Character[]) {
    this.characters = text.concat(this.characters);

    return this;
  }

  concat(text: TextRenderer) {
    this.characters = this.characters.concat(text.characters);

    return this;
  }

  slice(start: number, end?: number) {
    this.characters = this.characters.slice(start, end);
    return this;
  }

  removeTrailingNewLine() {
    while (this.characters[this.characters.length - 1]?.value === "\n") {
      this.characters.pop();
    }

    return this;
  }

  render(): string {
    let group: CharacterGroup | undefined;
    let result = "";

    for (let i = 0; i < this.characters.length; i++) {
      const character = this.characters[i]!;

      if (!group || !group.isEqual(character.group)) {
        group = character.group;
        result += group.renderStyles();
      }

      result += character.value;
    }

    return result + `${Unset}`;
  }
}

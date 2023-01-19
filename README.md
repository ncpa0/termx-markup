# termx-markup

## Usage

### Print markup

```tsx
import { Output, html } from "termx-markup";

Output.setDefaultPrintMethod(console.log); // (optional) print using console.log

const markup = html`
  <p bold color="red">Hello <span color="blue">in my</span> world!</p>
`;

Output.println(markup);
```

#### Output:

> <span style="color:blue; font-weight:bold;">Hello </span><span style="color:red; font-weight:bold;">in my</span><span style="color:blue; font-weight:bold;"> world!</span>

### Only formatting

```tsx
import { MarkupFormatter, html } from "termx-markup";

const markup = html`
  <p color="red">Hello <span color="blue">in my</span> world!</p>
`;

const formatted = MarkupFormatter.format(markup);
// formatted = "\u001b[31mHello \u001b[34min my\u001b[0m\u001b[31m world!\u001b[0m"

console.log(formatted);
```

#### Output:

> <span style="color:blue">Hello </span><span style="color:red">in my</span><span style="color:blue"> world!</span>

### Define custom colors

```tsx
import { Output, MarkupFormatter, html } from "termx-markup";

MarkupFormatter.defineColor("burgundy", "rgb(128, 0, 32)");
MarkupFormatter.defineColor("mauve", "#E0B0FF");
MarkupFormatter.defineColor("teal", { r: 0, g: 128, b: 128 });

const markup = html`
  <p color="burgundy">Burgundy</p>
  <p color="mauve">Mauve</p>
  <p color="teal">Teal</p>
`;

Output.print(markup);
```

#### Output:

> <span style="color:rgb(128, 0, 32)">Burgundy</span><br /><span style="color:#E0B0FF">Mauve</span><br /><span style="color:rgb(0, 128, 128)">Teal</span>

## Supported tags

- `<p>` - printed with a trailing new line character, unless it's the last tag
- `<span>` - always printed inline
- `<br />` - prints a new line character

Additionally trailing white-space characters are removed from text inside `<span>` tags but not from `<p>` tags.

## Supported attributes

- `color` - color of the text
- `bg` - background color of the text
- `bold` - bold text

## Default available colors

- `red`
- `green`
- `yellow`
- `blue`
- `magenta`
- `cyan`
- `white`
- `lightRed`
- `lightGreen`
- `lightYellow`
- `lightBlue`
- `lightMagenta`
- `lightCyan`
- `lightWhite`

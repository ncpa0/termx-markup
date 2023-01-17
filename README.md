# termx-markup

## Usage

```tsx
import { Output, html } from "termx-markup";

Output.setEnvPrint(console.log); // (optional) print using console.log

const markup = html`
  <p color="red">Hello <span color="blue">in my</span> world!</p>
`;

Output.println(markup);
```

#### Output:

> <span style="color:blue">Hello </span><span style="color:red">in my</span><span style="color:blue"> world!</span>

## Supported tags

- `<p>` - printed with a trailing new line character, unless it's the last tag
- `<span>` - always printed inline
- `<br />` - prints a new line character

Additionally trailing white-space characters are removed from text inside `<span>` tags but not from `<p>` tags.

## Supported attributes

- `color` - color of the text
- `bg` - background color of the text
- `bold` - bold text

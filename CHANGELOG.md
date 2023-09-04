## 2.0.2 (September 4, 2023)

### Bug Fixes

- #### fix: stringification of arguments provided to the `html` tag template ([#8](https://github.com/ncpa0cpl/termx-markup/pull/8))

  stringifying arguments of the `html` tag template was previously done by calling `.toString()` method on each arg, this was causing errors for cases where an argument was an `undefined` value.
  
  Instead the stringification is now done with the [String() constructor function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/String), which can properly handle undefined values.

## 2.0.1 (August 10, 2023)

### Bug Fixes

- #### fix: too many whitespace characters in between lines of raw text ([#7](https://github.com/ncpa0cpl/termx-markup/pull/7))

  1. Fixed a bug which was causing one too many spaces be added to the text where `<s />` was used.
  2. Fixed a bug which was causing multiline raw text to get joined with too many white-space characters.
  
      ### Example
      Input:
      ```html
      <span>
                   Hello
                   World
      </span>
      ```
      Old output:
      ```
      Hello             World
      ```
      New output:
      ```
      Hello World
      ```

## 2.0.0 (August 9, 2023)

### Features

- #### feat: frame tag and rendering rules rework ([#6](https://github.com/ncpa0cpl/termx-markup/pull/6))

  Added a new `<frame>` tag. Frame is a block element that draws a border around it's contents. The frame tag accepts special attributes `padding`, `padding-left`, `padding-right`, `padding-top`, `padding-bottom`, `padding-horizontal` and `padding-vertical`. These attributes define a padding width/height in character count that will be added in between the frame border and it's contents.

  New rendering rules discern tags into two types: inline rendered and block rendered. Inline tags are always rendered next to each other within the same line, if there are any white-spaces between the inline elements it will be replaced with a single space. Block tags, start with a line break character, unless the block element is the first one and end with a line break, unless the block element is the last one.

  Inline elements:

  - `<span>`
  - `<pre>`
  - `<br>`
  - `<s>`
  - `<li>`

  Block elements:

  - `<line>`
  - `<frame>`
  - `<pad>`
  - `<ul>`
  - `<ol>`

- #### feat: normalized how whitespaces are handled in-between text and tags ([#5](https://github.com/ncpa0cpl/termx-markup/pull/5))

  In previous version termx would simply remove any leading and tailing whitespace characters on each text node, this meant that for example if you wanted to have two separate words in different colors next to each other with a whitespace separating those, you'd have to use the `<s />` tag or the `<pre />` tag to insert that whitepsace character.

  With this update tags and text nodes should behave more like they do in browsers. If there is any number of new line or space character in between tags and text nodes, exactly one space character will be left there, there's a few exceptions to this rule though, for example when the next tag is a break line tag, whitespaces will be removed.

  **Some Examples**
  (Space characters in presented outputs are replaced with a `·` for better readability)

  ```ts
  Output.print(html`<span>Hello <span color="red">World</span></span>`);

  // Old output:
  // 'HelloWorld'

  // New output:
  // 'Hello·World'

  Output.print(html`
    <line>
      <span>This</span>
      <span>is</span>
      <span>one</span>
      <span>line</span>
    </line>
    <span>This is another</span>
  `);

  // Old output:
  // 'Thisisoneline
  //  This·is·another'

  // New output:
  // 'This·is·one·line
  //  This·is·another'
  ```

- #### Feat: new renderer ([#4](https://github.com/ncpa0cpl/termx-markup/pull/4))

  Implemented a completely new formatter/renderer. There's a few breaking changes:

  - `<pre/>` tag will now ignore any embedded tags
  - last `<li />` tag in a list will not add a new line character at the end
  - lists will now be prepended with a new line character if there is any text preceding them
  - styles applied to the lists will now also affect the bullet point characters and numbers in front of `<li />` tag contents
  - invalid/unsupported tag names will no longer cause the formatter to error out, instead those will be simply ignored and a warning will be emitted

## 1.1.1 (June 22, 2023)

### Bug Fixes

- #### fix: trailing slashes in the html params would cause formatting to fail ([#3](https://github.com/ncpa0cpl/termx-markup/pull/3))

  Fixed a bug that would cause the formatter to fail in rare situations where a backslash was the last character of a string parameter and happened to be right in front of a closing tag (see example below). From now on, the `html` tag literal should escape such characters to prevent this from happening.

  ```ts
  MarkupFormatter.format(html`<span>${"Hello World\\"}</span>`);
  // resulting string passed to formatter would look like this:
  // <span>Hello World\</span>
  // the backslash would cause the xml parser to escape the `<` character
  // and the whole thing would be treated as if there's no closing tag

  // with the fix, the resulting string will look like this:
  // <span>Hello World\\</span>
  // since the backslash itself is now escaped, parser will simply ignore it
  ```
